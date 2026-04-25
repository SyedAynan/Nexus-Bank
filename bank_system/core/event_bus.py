"""
Event Bus Foundation (v4.0)
============================
In-process publish/subscribe event bus as a stepping stone to Apache Kafka.

Provides decoupled communication between services:
  - Banking → publishes txn.created, txn.failed
  - Fraud   → subscribes to txn.created, publishes fraud.scored
  - AML     → subscribes to txn.created, publishes aml.flagged
  - Notif   → subscribes to fraud.scored, aml.flagged

When Kafka is integrated, this module can be swapped out with
minimal changes to publishers and subscribers.
"""

import asyncio
import logging
import time
from collections import defaultdict
from datetime import datetime
from enum import StrEnum
from typing import Any, Callable

logger = logging.getLogger("nexa.events")


# ---------------------------------------------------------------------------
# Event Types
# ---------------------------------------------------------------------------

class EventType(StrEnum):
    """All event types in the NEXA platform."""
    # Banking events
    TXN_CREATED = "txn.created"
    TXN_FAILED = "txn.failed"
    TRANSFER_COMPLETED = "transfer.completed"
    ACCOUNT_CREATED = "account.created"
    ACCOUNT_FROZEN = "account.frozen"

    # Fraud events
    FRAUD_SCORED = "fraud.scored"
    FRAUD_ALERT = "fraud.alert"

    # AML events
    AML_FLAGGED = "aml.flagged"
    AML_CYCLE_DETECTED = "aml.cycle_detected"

    # Loan events
    LOAN_APPLIED = "loan.applied"
    LOAN_APPROVED = "loan.approved"
    LOAN_REJECTED = "loan.rejected"

    # Notification events
    NOTIFICATION_SEND = "notification.send"

    # System events
    SYSTEM_HEALTH = "system.health"
    AUDIT_ENTRY = "audit.entry"


# ---------------------------------------------------------------------------
# Event Model
# ---------------------------------------------------------------------------

class Event:
    """Immutable event object with metadata."""

    __slots__ = (
        "event_type", "data", "timestamp", "event_id",
        "source", "correlation_id",
    )

    _counter = 0

    def __init__(
        self,
        event_type: str,
        data: dict[str, Any],
        source: str = "unknown",
        correlation_id: str | None = None,
    ):
        Event._counter += 1
        self.event_type = event_type
        self.data = data
        self.timestamp = datetime.now().isoformat()
        self.event_id = f"EVT-{Event._counter:08d}"
        self.source = source
        self.correlation_id = correlation_id or self.event_id

    def to_dict(self) -> dict:
        return {
            "event_id": self.event_id,
            "event_type": self.event_type,
            "data": self.data,
            "timestamp": self.timestamp,
            "source": self.source,
            "correlation_id": self.correlation_id,
        }

    def __repr__(self) -> str:
        return f"Event({self.event_type}, id={self.event_id})"


# ---------------------------------------------------------------------------
# Event Bus (In-Process Pub/Sub)
# ---------------------------------------------------------------------------

# Type alias for handlers
EventHandler = Callable[[Event], None]
AsyncEventHandler = Callable[[Event], Any]


class EventBus:
    """
    In-process event bus with synchronous and asynchronous handler support.

    Features:
    - Topic-based pub/sub with wildcard support
    - Async and sync handler registration
    - Error isolation (one handler failure doesn't affect others)
    - Event history for debugging and audit
    - Metrics tracking (publish count, handler latency)

    Future: Replace internals with Kafka producer/consumer while
    keeping the same publish/subscribe API.
    """

    def __init__(self, history_size: int = 500):
        self._sync_handlers: dict[str, list[EventHandler]] = defaultdict(list)
        self._async_handlers: dict[str, list[AsyncEventHandler]] = defaultdict(list)
        self._history: list[dict] = []
        self._history_size = history_size
        self._metrics: dict[str, int] = defaultdict(int)
        self._handler_errors: list[dict] = []

    # --- Registration ---

    def subscribe(self, event_type: str, handler: EventHandler) -> None:
        """Register a synchronous handler for an event type."""
        self._sync_handlers[event_type].append(handler)
        logger.debug(f"Subscribed sync handler {handler.__name__} to {event_type}")

    def subscribe_async(self, event_type: str, handler: AsyncEventHandler) -> None:
        """Register an async handler for an event type."""
        self._async_handlers[event_type].append(handler)
        logger.debug(f"Subscribed async handler {handler.__name__} to {event_type}")

    def unsubscribe(self, event_type: str, handler: EventHandler) -> None:
        """Remove a handler from an event type."""
        if handler in self._sync_handlers[event_type]:
            self._sync_handlers[event_type].remove(handler)
        if handler in self._async_handlers[event_type]:
            self._async_handlers[event_type].remove(handler)

    # --- Publishing ---

    def publish(self, event: Event) -> None:
        """
        Publish an event to all registered handlers.
        Sync handlers are called immediately. Async handlers are scheduled.
        Errors in handlers are caught and logged (no propagation).
        """
        self._metrics[event.event_type] += 1
        self._record_history(event)

        # Call sync handlers
        for handler in self._sync_handlers.get(event.event_type, []):
            try:
                start = time.time()
                handler(event)
                elapsed = (time.time() - start) * 1000
                self._metrics[f"{event.event_type}.handler.{handler.__name__}.ms"] = elapsed
            except Exception as e:
                self._record_error(event, handler.__name__, e)

        # Schedule async handlers
        for handler in self._async_handlers.get(event.event_type, []):
            try:
                loop = asyncio.get_event_loop()
                if loop.is_running():
                    asyncio.ensure_future(self._run_async_handler(handler, event))
                else:
                    loop.run_until_complete(self._run_async_handler(handler, event))
            except RuntimeError:
                # No event loop — skip async handlers
                pass
            except Exception as e:
                self._record_error(event, handler.__name__, e)

        # Wildcard handlers (subscribe to "*" to get all events)
        for handler in self._sync_handlers.get("*", []):
            try:
                handler(event)
            except Exception as e:
                self._record_error(event, handler.__name__, e)

    async def _run_async_handler(self, handler: AsyncEventHandler, event: Event):
        """Execute an async handler with error isolation."""
        try:
            start = time.time()
            await handler(event)
            elapsed = (time.time() - start) * 1000
            self._metrics[f"{event.event_type}.async.{handler.__name__}.ms"] = elapsed
        except Exception as e:
            self._record_error(event, handler.__name__, e)

    # --- Helper: create and publish in one step ---

    def emit(
        self,
        event_type: str,
        data: dict,
        source: str = "unknown",
        correlation_id: str | None = None,
    ) -> Event:
        """Convenience method: create Event and publish it."""
        event = Event(event_type, data, source, correlation_id)
        self.publish(event)
        return event

    # --- History and Metrics ---

    def _record_history(self, event: Event):
        self._history.append(event.to_dict())
        if len(self._history) > self._history_size:
            self._history = self._history[-self._history_size:]

    def _record_error(self, event: Event, handler_name: str, error: Exception):
        error_entry = {
            "event_id": event.event_id,
            "event_type": event.event_type,
            "handler": handler_name,
            "error": str(error),
            "timestamp": datetime.now().isoformat(),
        }
        self._handler_errors.append(error_entry)
        if len(self._handler_errors) > 200:
            self._handler_errors = self._handler_errors[-200:]
        logger.error(
            f"Event handler error: {handler_name} failed on {event.event_type}: {error}"
        )

    def get_history(self, limit: int = 50, event_type: str | None = None) -> list[dict]:
        """Return recent event history, optionally filtered by type."""
        history = self._history
        if event_type:
            history = [e for e in history if e["event_type"] == event_type]
        return list(reversed(history))[:limit]

    def get_metrics(self) -> dict:
        """Return event bus metrics for monitoring dashboard."""
        return {
            "total_events": sum(
                v for k, v in self._metrics.items()
                if not k.endswith(".ms")
            ),
            "event_counts": {
                k: v for k, v in self._metrics.items()
                if not k.endswith(".ms")
            },
            "handler_latencies_ms": {
                k: v for k, v in self._metrics.items()
                if k.endswith(".ms")
            },
            "registered_handlers": {
                event_type: len(handlers)
                for event_type, handlers in self._sync_handlers.items()
            },
            "async_handlers": {
                event_type: len(handlers)
                for event_type, handlers in self._async_handlers.items()
            },
            "error_count": len(self._handler_errors),
            "recent_errors": self._handler_errors[-5:],
        }

    def get_errors(self, limit: int = 50) -> list[dict]:
        """Return recent handler errors."""
        return list(reversed(self._handler_errors))[:limit]


# ---------------------------------------------------------------------------
# Global Event Bus Instance
# ---------------------------------------------------------------------------

_event_bus: EventBus | None = None


def get_event_bus() -> EventBus:
    """Get or create the global event bus singleton."""
    global _event_bus
    if _event_bus is None:
        _event_bus = EventBus()
        logger.info("Event bus initialized (in-process mode)")
    return _event_bus
