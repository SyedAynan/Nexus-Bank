"""
File: realtime.py
Module: bank_system.core.realtime

Purpose:
    WebSocket connection manager for real-time dashboard updates.
    Maintains a list of active WebSocket connections and broadcasts
    simulation events (transactions, fraud alerts) to all connected clients.

Developer Journey:
    - v1: Dashboard polled the API every 5 seconds — wasteful HTTP requests,
      5-second latency on updates, and increased server load.
    - v2: Implemented WebSocket for push-based updates. The simulation engine
      broadcasts events as they happen, and all connected dashboards update
      instantly. Reduced latency from 5s to <100ms.

How it works:
    1. Client connects to /ws/dashboard → manager.connect() accepts + stores
    2. Simulation engine generates a transaction → manager.broadcast() sends to all
    3. Client disconnects → manager.disconnect() removes from list
    4. Dead connections (network drops) are caught by send_json exception
       handling and automatically cleaned up.

Production Note:
    This in-memory approach works for a single-server deployment. For
    multi-pod Kubernetes deployments, WebSocket connections need to be
    shared across pods using Redis Pub/Sub or a dedicated WebSocket
    gateway (e.g., Socket.IO with Redis adapter).
"""

from typing import Any

from fastapi import WebSocket, WebSocketDisconnect


class ConnectionManager:
    def __init__(self) -> None:
        self.active_connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket) -> None:
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket) -> None:
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message: dict[str, Any]) -> None:
        for connection in list(self.active_connections):
            try:
                await connection.send_json(message)
            except WebSocketDisconnect:
                self.disconnect(connection)


ws_manager = ConnectionManager()


def get_ws_manager() -> ConnectionManager:
    return ws_manager
