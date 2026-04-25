# NEXA v4.0 â€” Enterprise Architecture Upgrade Plan

## 1. CURRENT SYSTEM ANALYSIS

### 1.1 Architecture Gaps Identified

| Area | Current State | Gap | Severity |
|------|--------------|-----|----------|
| **State Management** | In-memory DSA (Hash Table, BST, Graph) | Lost on restart; no horizontal scaling | ðŸ”´ Critical |
| **Fraud Detection** | Rule-based 6-signal scorer | No ML models; static thresholds; no behavioral learning | ðŸ”´ Critical |
| **Service Coupling** | Monolithic `BankingService` (565 lines) | All DSA + auth + audit in one class; single point of failure | ðŸŸ  High |
| **Event Processing** | Synchronous request-response only | No async event bus; no CQRS; no event sourcing | ðŸŸ  High |
| **Secret Management** | Hardcoded default `secret_key` in config | `"change-this-in-production"` is a security risk | ðŸ”´ Critical |
| **Transfer Atomicity** | Withdraw then deposit (non-atomic) | If deposit fails after withdraw, money disappears | ðŸ”´ Critical |
| **BST Balance** | Standard BST (not self-balancing) | O(n) worst case on sorted insertions | ðŸŸ¡ Medium |
| **Scaling** | Single Uvicorn process | No load balancing, no K8s, no auto-scaling | ðŸŸ  High |
| **Observability** | Basic Python logging | No distributed tracing, no metrics, no APM | ðŸŸ¡ Medium |

### 1.2 Security Audit

```
CRITICAL FINDINGS:
â”œâ”€â”€ Secret key has default value â†’ JWT tokens forgeable
â”œâ”€â”€ Transfer is non-atomic â†’ Race condition can lose funds
â”œâ”€â”€ In-memory alerts list capped at 200 â†’ Evidence loss
â”œâ”€â”€ No input sanitization on search queries â†’ Injection risk
â”œâ”€â”€ No request signing â†’ Replay attacks possible
â””â”€â”€ Session tokens not bound to IP/device fingerprint
```

---

## 2. TARGET ARCHITECTURE (v4.0)

### 2.1 High-Level System Design

```
                    â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
                    â”‚          CLIENT LAYER                â”‚
                    â”‚â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”‚
                    â”‚  React Web App    â”‚  React Native    â”‚
                    â”‚  Admin Dashboard  â”‚  Partner API     â”‚
                    â””â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”´â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”˜
                             â”‚    HTTPS/WSS      â”‚
                             â–¼                   â–¼
                    â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
                    â”‚        API GATEWAY (Kong/Envoy)      â”‚
                    â”‚â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”‚
                    â”‚  mTLS Termination  â”‚  Rate Limiting  â”‚
                    â”‚  JWT Validation    â”‚  Request Routing â”‚
                    â”‚  API Versioning    â”‚  Circuit Breaker â”‚
                    â””â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”´â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”˜
                             â”‚                   â”‚
          â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¼â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¼â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
          â–¼                  â–¼                   â–¼                  â–¼
   â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
   â”‚ AUTH SERVICE â”‚  â”‚   BANKING    â”‚  â”‚    USER      â”‚  â”‚ NOTIFICATION â”‚
   â”‚             â”‚  â”‚   SERVICE    â”‚  â”‚   SERVICE    â”‚  â”‚   SERVICE    â”‚
   â”‚ JWT + MFA   â”‚  â”‚ Accounts     â”‚  â”‚ Profiles     â”‚  â”‚ Email/SMS    â”‚
   â”‚ OAuth 2.0   â”‚  â”‚ Transfers    â”‚  â”‚ KYC          â”‚  â”‚ Push/WS      â”‚
   â”‚ WebAuthn    â”‚  â”‚ Ledger       â”‚  â”‚ Preferences  â”‚  â”‚ In-App       â”‚
   â””â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”˜  â””â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”˜  â””â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”˜  â””â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”˜
          â”‚                â”‚                  â”‚                 â”‚
          â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¼â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¼â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
                           â–¼                  â–¼
          â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
          â”‚              EVENT BUS (Apache Kafka)                â”‚
          â”‚â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”‚
          â”‚  txn.created  â”‚  fraud.scored  â”‚  aml.flagged       â”‚
          â”‚  loan.applied â”‚  kyc.verified  â”‚  notification.send â”‚
          â””â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”´â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”´â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
                  â”‚               â”‚                â”‚
   â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¼â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¼â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¼â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
   â–¼              â–¼               â–¼                â–¼              â–¼
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚ FRAUD  â”‚  â”‚   AML    â”‚  â”‚  LOAN    â”‚  â”‚ ANALYTICSâ”‚  â”‚   ML     â”‚
â”‚ ENGINE â”‚  â”‚  ENGINE  â”‚  â”‚  ENGINE  â”‚  â”‚  ENGINE  â”‚  â”‚ PIPELINE â”‚
â”‚ (AI)   â”‚  â”‚ (Graph)  â”‚  â”‚ (Score)  â”‚  â”‚  (BI)    â”‚  â”‚(Training)â”‚
â”‚        â”‚  â”‚          â”‚  â”‚          â”‚  â”‚          â”‚  â”‚          â”‚
â”‚Isolationâ”‚  â”‚ Neo4j    â”‚  â”‚ Priority â”‚  â”‚ ClickHse â”‚  â”‚ MLflow   â”‚
â”‚Forest + â”‚  â”‚ + DFS    â”‚  â”‚ Queue +  â”‚  â”‚ + Cube   â”‚  â”‚ + Feast  â”‚
â”‚LSTM     â”‚  â”‚ Cycles   â”‚  â”‚ XGBoost  â”‚  â”‚          â”‚  â”‚          â”‚
â””â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”˜  â””â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”˜  â””â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”˜  â””â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”˜  â””â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”˜
     â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”´â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”´â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”´â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
                              â”‚
          â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¼â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
          â–¼                   â–¼                   â–¼
   â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”   â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”   â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
   â”‚ POSTGRESQL  â”‚   â”‚ REDIS CLUSTERâ”‚   â”‚  DATA LAKE   â”‚
   â”‚ (Primary)   â”‚   â”‚              â”‚   â”‚              â”‚
   â”‚ + Read      â”‚   â”‚ Sessions     â”‚   â”‚ S3/MinIO     â”‚
   â”‚   Replicas  â”‚   â”‚ Rate Limits  â”‚   â”‚ Parquet      â”‚
   â”‚             â”‚   â”‚ DSA Cache    â”‚   â”‚ ML Training  â”‚
   â”‚ Accounts    â”‚   â”‚ Pub/Sub      â”‚   â”‚ Audit Archiveâ”‚
   â”‚ Transactionsâ”‚   â”‚              â”‚   â”‚              â”‚
   â”‚ Loans       â”‚   â”‚              â”‚   â”‚              â”‚
   â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜   â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜   â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

### 2.2 Service Breakdown

| Service | Responsibility | Tech | Port |
|---------|---------------|------|------|
| **api-gateway** | Routing, auth validation, rate limiting | Kong / Envoy | 8443 |
| **auth-service** | JWT, MFA, OAuth, WebAuthn, sessions | FastAPI | 8001 |
| **banking-service** | Accounts, transfers, ledger (double-entry) | FastAPI | 8002 |
| **user-service** | Profiles, KYC, preferences | FastAPI | 8003 |
| **fraud-service** | ML-based fraud scoring, alerts | FastAPI + PyTorch | 8004 |
| **aml-service** | Graph analysis, cycle detection, SAR | FastAPI + Neo4j | 8005 |
| **loan-service** | Applications, scoring, approval pipeline | FastAPI + XGBoost | 8006 |
| **analytics-service** | Dashboards, BI, reporting | FastAPI + ClickHouse | 8007 |
| **notification-service** | Email, SMS, push, WebSocket | FastAPI + Celery | 8008 |
| **ml-pipeline** | Model training, feature store, serving | MLflow + Feast | 8009 |

---

## 3. FRAUD ENGINE UPGRADE: Rule-Based â†’ AI/ML

### 3.1 Current vs. Proposed

```
CURRENT (Rule-Based)                    PROPOSED (AI/ML Hybrid)
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€                   â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
6 static signals                   â†’    3-layer detection pipeline
Fixed thresholds                   â†’    Adaptive thresholds via ML
No learning                        â†’    Online learning from feedback
In-memory alerts (200 cap)         â†’    Persistent + event-sourced
Single composite score             â†’    Ensemble of 4 models
No behavioral profiling            â†’    Per-user behavioral baseline
```

### 3.2 ML Pipeline Architecture

```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚                 FRAUD DETECTION PIPELINE              â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚                                                      â”‚
â”‚  Layer 1: REAL-TIME (< 10ms)                         â”‚
â”‚  â”œâ”€â”€ Rule Engine (existing 6 signals â€” kept)         â”‚
â”‚  â”œâ”€â”€ Isolation Forest (anomaly detection)            â”‚
â”‚  â””â”€â”€ LightGBM classifier (trained on labeled data)  â”‚
â”‚                                                      â”‚
â”‚  Layer 2: NEAR-REAL-TIME (< 1s)                      â”‚
â”‚  â”œâ”€â”€ LSTM sequence model (behavioral patterns)       â”‚
â”‚  â”œâ”€â”€ Graph Neural Network (network anomalies)        â”‚
â”‚  â””â”€â”€ Autoencoder (reconstruction error scoring)      â”‚
â”‚                                                      â”‚
â”‚  Layer 3: BATCH (hourly/daily)                       â”‚
â”‚  â”œâ”€â”€ Community detection (graph clustering)          â”‚
â”‚  â”œâ”€â”€ Temporal pattern mining                         â”‚
â”‚  â””â”€â”€ Model retraining with new labeled data          â”‚
â”‚                                                      â”‚
â”‚  ENSEMBLE:                                           â”‚
â”‚  final_score = w1*rules + w2*IF + w3*LGBM            â”‚
â”‚              + w4*LSTM + w5*GNN + w6*AE              â”‚
â”‚  (weights learned via stacking meta-learner)         â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

### 3.3 Feature Engineering

```python
# Feature groups for ML fraud models
FEATURES = {
    "transaction": [
        "amount", "amount_log", "is_round_number",
        "hour_of_day", "day_of_week", "is_weekend",
    ],
    "velocity": [
        "txn_count_1h", "txn_count_24h", "txn_count_7d",
        "amount_sum_1h", "amount_sum_24h",
        "avg_amount_30d", "stddev_amount_30d",
    ],
    "behavioral": [
        "amount_zscore_user", "time_deviation_user",
        "new_recipient", "recipient_count_30d",
        "balance_ratio", "days_since_last_txn",
    ],
    "graph": [
        "out_degree", "in_degree", "pagerank_score",
        "community_id", "is_bridge_node",
        "neighbor_avg_risk", "cycle_participation_count",
    ],
}
```

---

## 4. PERSISTENT & DISTRIBUTED DSA LAYER

### 4.1 Current Problem

All DSA structures live in-memory in `BankingService.__init__()`. On restart, everything is re-seeded from scratch. No horizontal scaling is possible.

### 4.2 Solution: Redis-Backed DSA with PostgreSQL Persistence

```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚              DSA PERSISTENCE STRATEGY                â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚                                                     â”‚
â”‚  Hash Table  â†’ Redis Hash (HSET/HGET)               â”‚
â”‚                Key: "account:{id}" â†’ account JSON    â”‚
â”‚                O(1) get/set, survives restarts        â”‚
â”‚                                                     â”‚
â”‚  BST          â†’ PostgreSQL B-Tree index              â”‚
â”‚                accounts table with indexed            â”‚
â”‚                account_number column                  â”‚
â”‚                Range queries via SQL WHERE BETWEEN    â”‚
â”‚                                                     â”‚
â”‚  Linked List  â†’ PostgreSQL table + Redis cache       â”‚
â”‚                transactions table ordered by          â”‚
â”‚                created_at DESC, last 50 cached        â”‚
â”‚                                                     â”‚
â”‚  Stack        â†’ Redis List (LPUSH/LPOP)              â”‚
â”‚                Key: "undo:{account_id}"              â”‚
â”‚                LTRIM to cap at 50 entries             â”‚
â”‚                                                     â”‚
â”‚  Queue        â†’ Redis Stream (XADD/XREAD)            â”‚
â”‚                Key: "txn_queue"                      â”‚
â”‚                Consumer groups for parallel workers   â”‚
â”‚                                                     â”‚
â”‚  Priority Q   â†’ Redis Sorted Set (ZADD/ZPOPMIN)     â”‚
â”‚                Key: "loan_queue"                     â”‚
â”‚                Score = priority formula               â”‚
â”‚                                                     â”‚
â”‚  Graph        â†’ Neo4j (production) or                â”‚
â”‚                PostgreSQL adjacency table (MVP)      â”‚
â”‚                AML edges + nodes with risk scores     â”‚
â”‚                                                     â”‚
â”‚  Trie         â†’ Redis (prefix scan) or               â”‚
â”‚                PostgreSQL trigram index               â”‚
â”‚                pg_trgm extension for fuzzy search     â”‚
â”‚                                                     â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

---

## 5. DATABASE SCHEMA UPGRADES

### 5.1 Double-Entry Ledger (replacing direct balance mutation)

```sql
-- Replace direct balance += amount with proper ledger
CREATE TABLE ledger_entries (
    id              BIGSERIAL PRIMARY KEY,
    transaction_id  UUID NOT NULL REFERENCES transactions(id),
    account_id      INTEGER NOT NULL REFERENCES accounts(id),
    entry_type      VARCHAR(10) NOT NULL CHECK (entry_type IN ('debit','credit')),
    amount          NUMERIC(19,4) NOT NULL CHECK (amount > 0),
    balance_after   NUMERIC(19,4) NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Materialized balance view (updated via trigger)
CREATE MATERIALIZED VIEW account_balances AS
SELECT account_id, SUM(
    CASE WHEN entry_type = 'credit' THEN amount ELSE -amount END
) AS balance
FROM ledger_entries
GROUP BY account_id;
```

### 5.2 New Tables for v4.0

```sql
-- KYC verification pipeline
CREATE TABLE kyc_verifications (
    id              SERIAL PRIMARY KEY,
    user_id         INTEGER REFERENCES users(id),
    status          VARCHAR(20) DEFAULT 'pending',
    document_type   VARCHAR(50),
    document_hash   VARCHAR(64),
    provider        VARCHAR(50),  -- Onfido, Jumio, etc.
    risk_level      VARCHAR(10),
    verified_at     TIMESTAMPTZ,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ML model predictions (audit trail for explainability)
CREATE TABLE fraud_predictions (
    id              BIGSERIAL PRIMARY KEY,
    transaction_id  UUID REFERENCES transactions(id),
    model_version   VARCHAR(20) NOT NULL,
    composite_score NUMERIC(6,4) NOT NULL,
    model_scores    JSONB NOT NULL,  -- {isolation_forest: 0.7, lstm: 0.3, ...}
    features_used   JSONB NOT NULL,
    decision        VARCHAR(20) NOT NULL,  -- approve, flag, block
    latency_ms      INTEGER,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Event sourcing for transactions
CREATE TABLE transaction_events (
    id              BIGSERIAL PRIMARY KEY,
    aggregate_id    UUID NOT NULL,  -- transaction ID
    event_type      VARCHAR(50) NOT NULL,
    event_data      JSONB NOT NULL,
    sequence_num    INTEGER NOT NULL,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(aggregate_id, sequence_num)
);

-- Scheduled payments
CREATE TABLE scheduled_payments (
    id              SERIAL PRIMARY KEY,
    account_id      INTEGER REFERENCES accounts(id),
    recipient_id    INTEGER REFERENCES accounts(id),
    amount          NUMERIC(19,4) NOT NULL,
    currency        VARCHAR(10) DEFAULT 'USD',
    frequency       VARCHAR(20) NOT NULL,  -- daily, weekly, monthly
    next_run_at     TIMESTAMPTZ NOT NULL,
    last_run_at     TIMESTAMPTZ,
    status          VARCHAR(20) DEFAULT 'active',
    created_at      TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 6. API STRUCTURE (v4.0)

### 6.1 API Gateway Routes

```
/api/v2/
â”œâ”€â”€ auth/
â”‚   â”œâ”€â”€ POST   /login              â†’ JWT + MFA challenge
â”‚   â”œâ”€â”€ POST   /register           â†’ User registration
â”‚   â”œâ”€â”€ POST   /refresh            â†’ Token refresh
â”‚   â”œâ”€â”€ POST   /mfa/verify         â†’ TOTP verification
â”‚   â”œâ”€â”€ POST   /mfa/setup          â†’ Enable MFA
â”‚   â”œâ”€â”€ POST   /oauth/{provider}   â†’ OAuth callback
â”‚   â”œâ”€â”€ POST   /webauthn/register  â†’ Passkey registration
â”‚   â””â”€â”€ POST   /webauthn/verify    â†’ Passkey authentication
â”‚
â”œâ”€â”€ banking/
â”‚   â”œâ”€â”€ GET    /accounts                â†’ List user accounts
â”‚   â”œâ”€â”€ POST   /accounts                â†’ Create account
â”‚   â”œâ”€â”€ GET    /accounts/{id}           â†’ Get account details
â”‚   â”œâ”€â”€ GET    /accounts/{id}/balance   â†’ Real-time balance
â”‚   â”œâ”€â”€ POST   /transfers               â†’ Initiate transfer
â”‚   â”œâ”€â”€ GET    /transfers/{id}/status   â†’ Transfer status
â”‚   â”œâ”€â”€ GET    /transactions            â†’ Transaction history
â”‚   â”œâ”€â”€ POST   /transactions/undo       â†’ Undo last transaction
â”‚   â”œâ”€â”€ POST   /payments/schedule       â†’ Schedule payment
â”‚   â””â”€â”€ GET    /statements/export       â†’ PDF/CSV export
â”‚
â”œâ”€â”€ loans/
â”‚   â”œâ”€â”€ POST   /applications            â†’ Apply for loan
â”‚   â”œâ”€â”€ GET    /applications            â†’ List applications
â”‚   â”œâ”€â”€ GET    /applications/{id}/score â†’ ML credit score
â”‚   â”œâ”€â”€ POST   /applications/{id}/decideâ†’ Approve/reject
â”‚   â””â”€â”€ GET    /simulator               â†’ What-if scenarios
â”‚
â”œâ”€â”€ intelligence/
â”‚   â”œâ”€â”€ GET    /fraud/alerts            â†’ Fraud alerts
â”‚   â”œâ”€â”€ GET    /fraud/profile/{id}      â†’ Account risk profile
â”‚   â”œâ”€â”€ POST   /fraud/alerts/{id}/reviewâ†’ Review alert
â”‚   â”œâ”€â”€ GET    /aml/graph               â†’ Transfer network
â”‚   â”œâ”€â”€ GET    /aml/cycles              â†’ Detected cycles
â”‚   â”œâ”€â”€ GET    /risk/portfolio          â†’ Portfolio risk
â”‚   â””â”€â”€ GET    /forecast/{horizon}      â†’ Financial forecast
â”‚
â”œâ”€â”€ analytics/
â”‚   â”œâ”€â”€ GET    /dashboard               â†’ KPI summary
â”‚   â”œâ”€â”€ GET    /charts/{type}           â†’ Chart data
â”‚   â”œâ”€â”€ GET    /reports/generate        â†’ Custom reports
â”‚   â””â”€â”€ WS    /stream                  â†’ Real-time updates
â”‚
â”œâ”€â”€ admin/
â”‚   â”œâ”€â”€ GET    /users                   â†’ User management
â”‚   â”œâ”€â”€ PUT    /users/{id}/role         â†’ Role assignment
â”‚   â”œâ”€â”€ GET    /audit                   â†’ Audit logs
â”‚   â”œâ”€â”€ GET    /audit/verify            â†’ Chain verification
â”‚   â”œâ”€â”€ GET    /system/health           â†’ System health
â”‚   â”œâ”€â”€ GET    /dsa/showcase            â†’ DSA visualizations
â”‚   â””â”€â”€ PUT    /features/{flag}         â†’ Feature flags
â”‚
â””â”€â”€ integrations/
    â”œâ”€â”€ POST   /kyc/verify             â†’ KYC submission
    â”œâ”€â”€ GET    /fx/rates               â†’ Live FX rates
    â”œâ”€â”€ POST   /plaid/link             â†’ Bank account linking
    â””â”€â”€ GET    /market-data/{symbol}   â†’ Stock/crypto prices
```
# NEXA v4.0 â€” Architecture Upgrade Plan (Part 2)

## 7. SCALING STRATEGY

### 7.1 Kubernetes Deployment

```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚                 KUBERNETES CLUSTER                       â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚                                                         â”‚
â”‚  Namespace: nexa-prod                                    â”‚
â”‚  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”    â”‚
â”‚  â”‚ Ingress Controller (NGINX / Traefik)             â”‚    â”‚
â”‚  â”‚ TLS termination, path-based routing              â”‚    â”‚
â”‚  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜    â”‚
â”‚                     â”‚                                    â”‚
â”‚  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¼â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”    â”‚
â”‚  â”‚ Service Mesh (Istio / Linkerd)                   â”‚    â”‚
â”‚  â”‚ mTLS between services, observability, retries    â”‚    â”‚
â”‚  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¼â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜    â”‚
â”‚                     â”‚                                    â”‚
â”‚  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â” â”Œâ”€â”€â”€â”€â”€â”€â”´â”€â”€â” â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â” â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”      â”‚
â”‚  â”‚ auth    â”‚ â”‚ banking â”‚ â”‚ fraud   â”‚ â”‚ notif.  â”‚      â”‚
â”‚  â”‚ 2 pods  â”‚ â”‚ 4 pods  â”‚ â”‚ 3 pods  â”‚ â”‚ 2 pods  â”‚      â”‚
â”‚  â”‚ HPA:2-8 â”‚ â”‚ HPA:4-20â”‚ â”‚ HPA:3-10â”‚ â”‚ HPA:2-6 â”‚      â”‚
â”‚  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜ â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜ â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜ â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜      â”‚
â”‚                                                         â”‚
â”‚  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”    â”‚
â”‚  â”‚ StatefulSets                                     â”‚    â”‚
â”‚  â”‚ â”œâ”€â”€ PostgreSQL (primary + 2 read replicas)       â”‚    â”‚
â”‚  â”‚ â”œâ”€â”€ Redis Cluster (6 nodes, 3 masters)           â”‚    â”‚
â”‚  â”‚ â”œâ”€â”€ Kafka (3 brokers + ZooKeeper)                â”‚    â”‚
â”‚  â”‚ â””â”€â”€ Neo4j (causal cluster, 3 cores)              â”‚    â”‚
â”‚  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜    â”‚
â”‚                                                         â”‚
â”‚  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”    â”‚
â”‚  â”‚ Observability Stack                              â”‚    â”‚
â”‚  â”‚ â”œâ”€â”€ Prometheus + Grafana (metrics)               â”‚    â”‚
â”‚  â”‚ â”œâ”€â”€ Jaeger (distributed tracing)                 â”‚    â”‚
â”‚  â”‚ â”œâ”€â”€ Loki (log aggregation)                       â”‚    â”‚
â”‚  â”‚ â””â”€â”€ PagerDuty (alerting)                         â”‚    â”‚
â”‚  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜    â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

### 7.2 Auto-Scaling Policy

| Service | Min Pods | Max Pods | CPU Target | Memory Target | Scale Metric |
|---------|----------|----------|------------|---------------|-------------|
| auth | 2 | 8 | 60% | 70% | requests/sec |
| banking | 4 | 20 | 50% | 60% | transactions/sec |
| fraud | 3 | 10 | 70% | 80% | scoring latency |
| aml | 2 | 6 | 60% | 70% | graph query time |
| analytics | 2 | 8 | 50% | 60% | query latency |
| notification | 2 | 6 | 40% | 50% | queue depth |

### 7.3 Database Scaling

```
PostgreSQL Strategy:
â”œâ”€â”€ Primary (writes)     â†’ c5.2xlarge, 500GB SSD
â”œâ”€â”€ Read Replica 1       â†’ Analytics queries
â”œâ”€â”€ Read Replica 2       â†’ API read traffic
â”œâ”€â”€ PgBouncer            â†’ Connection pooling (max 500 conns)
â””â”€â”€ Partitioning         â†’ transactions table by month
                           ledger_entries by quarter

Redis Strategy:
â”œâ”€â”€ Cluster mode         â†’ 3 masters + 3 replicas
â”œâ”€â”€ Persistence          â†’ AOF with fsync every second
â”œâ”€â”€ Memory               â†’ 16GB per node
â””â”€â”€ Eviction             â†’ allkeys-lru for cache, noeviction for DSA
```

---

## 8. SECURITY HARDENING (Zero Trust)

### 8.1 Security Architecture

```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚              ZERO TRUST SECURITY MODEL               â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚                                                     â”‚
â”‚  Layer 1: NETWORK                                    â”‚
â”‚  â”œâ”€â”€ mTLS between all services (Istio)              â”‚
â”‚  â”œâ”€â”€ Network policies (deny-all default)            â”‚
â”‚  â”œâ”€â”€ WAF (Cloudflare / AWS WAF)                     â”‚
â”‚  â””â”€â”€ DDoS protection                                â”‚
â”‚                                                     â”‚
â”‚  Layer 2: IDENTITY                                   â”‚
â”‚  â”œâ”€â”€ JWT with RS256 (asymmetric, rotate keys)       â”‚
â”‚  â”œâ”€â”€ MFA mandatory for admin/compliance roles       â”‚
â”‚  â”œâ”€â”€ WebAuthn/Passkey for passwordless              â”‚
â”‚  â”œâ”€â”€ OAuth 2.0 + OIDC (Google, Apple, Microsoft)    â”‚
â”‚  â””â”€â”€ Session binding (IP + device fingerprint)      â”‚
â”‚                                                     â”‚
â”‚  Layer 3: APPLICATION                                â”‚
â”‚  â”œâ”€â”€ RBAC with 5 roles + fine-grained permissions   â”‚
â”‚  â”œâ”€â”€ Request signing (HMAC-SHA256)                  â”‚
â”‚  â”œâ”€â”€ Input validation (Pydantic strict mode)        â”‚
â”‚  â”œâ”€â”€ SQL parameterization (SQLAlchemy ORM)          â”‚
â”‚  â””â”€â”€ CSP, HSTS, X-Frame-Options headers            â”‚
â”‚                                                     â”‚
â”‚  Layer 4: DATA                                       â”‚
â”‚  â”œâ”€â”€ Encryption at rest (AES-256, PostgreSQL TDE)   â”‚
â”‚  â”œâ”€â”€ Encryption in transit (TLS 1.3)                â”‚
â”‚  â”œâ”€â”€ PII tokenization (card numbers, SSN)           â”‚
â”‚  â”œâ”€â”€ Key management (HashiCorp Vault)               â”‚
â”‚  â””â”€â”€ Data masking in non-prod environments          â”‚
â”‚                                                     â”‚
â”‚  Layer 5: AUDIT                                      â”‚
â”‚  â”œâ”€â”€ Hash-chain audit logs (existing, enhanced)     â”‚
â”‚  â”œâ”€â”€ Immutable event store (Kafka + S3)             â”‚
â”‚  â”œâ”€â”€ SOC 2 Type II compliance logging               â”‚
â”‚  â””â”€â”€ Automated compliance reports (SAR, CTR)        â”‚
â”‚                                                     â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

### 8.2 Critical Security Fixes (Immediate)

```python
# FIX 1: Remove hardcoded secret key
# config.py â€” BEFORE:
secret_key: str = Field(default="change-this-in-production")
# AFTER:
secret_key: str = Field(...)  # Required, no default. Fail-fast.

# FIX 2: Atomic transfers using database transactions
async def transfer(self, from_id, to_id, amount):
    async with db.begin() as txn:
        # Lock both accounts FOR UPDATE (prevents race conditions)
        from_acc = await db.execute(
            select(Account).where(Account.id == from_id).with_for_update()
        )
        to_acc = await db.execute(
            select(Account).where(Account.id == to_id).with_for_update()
        )
        # Double-entry ledger: debit + credit in same transaction
        db.add(LedgerEntry(account_id=from_id, type='debit', amount=amount))
        db.add(LedgerEntry(account_id=to_id, type='credit', amount=amount))
        # Commit or rollback atomically

# FIX 3: JWT with RS256 (asymmetric keys)
# Generate: openssl genrsa -out private.pem 2048
#           openssl rsa -in private.pem -pubout -out public.pem
# Sign with private key, verify with public key
# Leaked public key â‰  compromised tokens
```

---

## 9. REAL-WORLD INTEGRATIONS

### 9.1 Integration Map

```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚              EXTERNAL INTEGRATIONS                    â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚                                                      â”‚
â”‚  PAYMENTS:                                           â”‚
â”‚  â”œâ”€â”€ Stripe Connect  â†’ Card processing, payouts      â”‚
â”‚  â”œâ”€â”€ Plaid           â†’ Bank account linking, balance  â”‚
â”‚  â”œâ”€â”€ SWIFT/SEPA      â†’ International wire transfers   â”‚
â”‚  â””â”€â”€ ACH             â†’ US domestic bank transfers     â”‚
â”‚                                                      â”‚
â”‚  KYC/IDENTITY:                                       â”‚
â”‚  â”œâ”€â”€ Onfido          â†’ Document + biometric verify    â”‚
â”‚  â”œâ”€â”€ Jumio           â†’ ID scanning + liveness check   â”‚
â”‚  â””â”€â”€ Socure          â†’ Real-time identity fraud       â”‚
â”‚                                                      â”‚
â”‚  MARKET DATA:                                        â”‚
â”‚  â”œâ”€â”€ Alpha Vantage   â†’ Stock prices, forex rates      â”‚
â”‚  â”œâ”€â”€ CoinGecko       â†’ Cryptocurrency prices          â”‚
â”‚  â”œâ”€â”€ Fixer.io        â†’ Live FX rates (150+ curr.)     â”‚
â”‚  â””â”€â”€ Bloomberg API   â†’ Institutional market data      â”‚
â”‚                                                      â”‚
â”‚  COMPLIANCE:                                         â”‚
â”‚  â”œâ”€â”€ Chainalysis     â†’ Crypto AML screening           â”‚
â”‚  â”œâ”€â”€ ComplyAdvantage â†’ PEP/sanctions screening        â”‚
â”‚  â””â”€â”€ Sumsub          â†’ Regulatory compliance          â”‚
â”‚                                                      â”‚
â”‚  COMMUNICATION:                                      â”‚
â”‚  â”œâ”€â”€ SendGrid        â†’ Transactional email            â”‚
â”‚  â”œâ”€â”€ Twilio          â†’ SMS OTP + notifications        â”‚
â”‚  â””â”€â”€ Firebase FCM    â†’ Mobile push notifications      â”‚
â”‚                                                      â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

### 9.2 Integration Pattern (Anti-Corruption Layer)

```python
# Each integration wrapped in an adapter with circuit breaker
class KYCAdapter:
    """Anti-corruption layer for KYC providers."""
    
    def __init__(self, provider: str = "onfido"):
        self.provider = self._get_provider(provider)
        self.circuit_breaker = CircuitBreaker(
            failure_threshold=5,
            recovery_timeout=60
        )
    
    @circuit_breaker
    async def verify_identity(self, user_id, documents) -> KYCResult:
        raw = await self.provider.submit_check(documents)
        return KYCResult(  # Normalize to internal schema
            status=self._map_status(raw.status),
            risk_level=self._map_risk(raw.score),
            provider_ref=raw.check_id
        )
    
    def _get_provider(self, name):
        providers = {"onfido": OnfidoClient, "jumio": JumioClient}
        return providers[name](api_key=vault.get(f"kyc/{name}/key"))
```

---

## 10. NEW INDUSTRY-LEVEL FEATURES

| Feature | Description | Competitive Reference |
|---------|-------------|----------------------|
| **Virtual Cards** | Issue instant virtual Visa/MC cards for online payments | Revolut, Wise |
| **Spending Insights** | AI-categorized spending with merchant logos and trends | Mint, Cleo |
| **Round-Up Savings** | Auto-round transactions to nearest dollar, save difference | Acorns, Monzo |
| **Split Payments** | Split bills with friends via link/QR, track who paid | Venmo, Splitwise |
| **Crypto Wallet** | Buy/sell/hold BTC, ETH with real-time prices | Revolut, Cash App |
| **Credit Score Monitor** | Real-time credit score tracking with improvement tips | Credit Karma |
| **Instant Notifications** | Push + in-app alerts for every transaction within 500ms | All neobanks |
| **Subscription Manager** | Detect recurring charges, cancel from within the app | Truebill/Rocket Money |
| **Cashback Rewards** | Category-based cashback (3% dining, 2% groceries) | Chase, Amex |
| **Open Banking API** | PSD2-compliant APIs for third-party access | Plaid, TrueLayer |

---

## 11. TECH STACK UPGRADE SUMMARY

| Component | Current (v3) | Proposed (v4) | Reason |
|-----------|-------------|---------------|--------|
| **API Framework** | FastAPI (monolith) | FastAPI (microservices) | Service isolation |
| **API Gateway** | None | Kong / Envoy | Centralized routing, auth |
| **Message Bus** | None | Apache Kafka | Event-driven, decoupling |
| **Graph DB** | In-memory adjacency list | Neo4j | Persistent, scalable graph queries |
| **Analytics DB** | PostgreSQL | ClickHouse | 100x faster analytical queries |
| **ML Platform** | None | MLflow + Feast | Model versioning, feature store |
| **ML Serving** | None | TorchServe / Triton | GPU-accelerated inference |
| **Secret Mgmt** | .env file | HashiCorp Vault | Dynamic secrets, rotation |
| **Container** | Docker Compose | Kubernetes (EKS/GKE) | Auto-scaling, self-healing |
| **CI/CD** | GitHub Actions | GitHub Actions + ArgoCD | GitOps deployment |
| **Monitoring** | Basic logging | Prometheus + Grafana + Jaeger | Full observability |
| **CDN** | None | CloudFront / Cloudflare | Edge caching, DDoS |
| **Search** | Trie (in-memory) | Elasticsearch | Full-text + fuzzy + aggregations |

---

## 12. TRANSACTION FLOW (v4.0 â€” End-to-End)

```
User taps "Send $500 to Bob"
        â”‚
        â–¼
[1] React App â†’ POST /api/v2/banking/transfers
        â”‚       Headers: Authorization: Bearer <JWT>
        â”‚       Body: {from: "NX-001", to: "NX-002", amount: 500}
        â–¼
[2] API Gateway (Kong)
        â”œâ”€â”€ Validate JWT signature (RS256 public key)
        â”œâ”€â”€ Check rate limit (Redis: 100 req/min)
        â”œâ”€â”€ Route to banking-service
        â–¼
[3] Banking Service
        â”œâ”€â”€ Validate accounts exist (Redis Hash lookup, O(1))
        â”œâ”€â”€ Check balance >= 500 (Redis cached balance)
        â”œâ”€â”€ BEGIN DB TRANSACTION
        â”‚   â”œâ”€â”€ SELECT ... FOR UPDATE (lock both accounts)
        â”‚   â”œâ”€â”€ INSERT ledger_entry (debit NX-001, $500)
        â”‚   â”œâ”€â”€ INSERT ledger_entry (credit NX-002, $500)
        â”‚   â”œâ”€â”€ INSERT transaction record
        â”‚   â””â”€â”€ COMMIT
        â”œâ”€â”€ Update Redis cached balances
        â”œâ”€â”€ Publish event: txn.created â†’ Kafka
        â–¼
[4] Kafka Consumer: Fraud Service
        â”œâ”€â”€ Extract 22 features from transaction
        â”œâ”€â”€ Layer 1: Isolation Forest â†’ score: 0.12
        â”œâ”€â”€ Layer 1: LightGBM â†’ score: 0.08
        â”œâ”€â”€ Layer 2: LSTM behavioral â†’ score: 0.15
        â”œâ”€â”€ Ensemble: final_score = 0.11 (LOW)
        â”œâ”€â”€ Publish: fraud.scored â†’ Kafka
        â–¼
[5] Kafka Consumer: AML Service
        â”œâ”€â”€ Add edge to Neo4j: (NX-001)-[TRANSFER{$500}]->(NX-002)
        â”œâ”€â”€ Run cycle detection (DFS)
        â”œâ”€â”€ Compute PageRank for both nodes
        â”œâ”€â”€ No cycles detected â†’ CLEAR
        â–¼
[6] Kafka Consumer: Notification Service
        â”œâ”€â”€ WebSocket push to sender dashboard
        â”œâ”€â”€ WebSocket push to recipient dashboard
        â”œâ”€â”€ Send push notification to recipient mobile
        â”œâ”€â”€ Send email confirmation to sender
        â–¼
[7] Kafka Consumer: Analytics Service
        â”œâ”€â”€ Update ClickHouse aggregates
        â”œâ”€â”€ Refresh dashboard KPIs
        â””â”€â”€ Store in data lake (S3/Parquet)

Total latency: ~45ms (steps 1-3)
Async processing: ~200ms (steps 4-7, non-blocking)
```

---

## 13. IMPLEMENTATION PLAN (16 Weeks)

### Phase 1: Foundation (Weeks 1-4)

| Week | Task | Deliverable |
|------|------|-------------|
| 1 | Fix critical security gaps (secret key, atomic transfers, RS256) | Secure auth + atomic ledger |
| 2 | Extract auth-service from monolith, set up Kong gateway | 2 independent services |
| 3 | Extract banking-service with double-entry ledger | Atomic transfers + ledger |
| 4 | Set up Kafka, implement event publishing for transactions | Event bus operational |

### Phase 2: Intelligence (Weeks 5-8)

| Week | Task | Deliverable |
|------|------|-------------|
| 5 | Extract fraud-service, train Isolation Forest on historical data | ML fraud v1 |
| 6 | Train LightGBM + LSTM models, implement ensemble scoring | ML fraud v2 |
| 7 | Extract AML service, migrate graph to Neo4j | Persistent graph DB |
| 8 | Extract loan-service with XGBoost credit scoring | ML-powered loan approval |

### Phase 3: Infrastructure (Weeks 9-12)

| Week | Task | Deliverable |
|------|------|-------------|
| 9 | Kubernetes cluster setup (EKS/GKE), Helm charts | K8s deployment |
| 10 | Set up monitoring stack (Prometheus, Grafana, Jaeger) | Full observability |
| 11 | Redis cluster for DSA persistence, ClickHouse for analytics | Distributed data layer |
| 12 | HashiCorp Vault integration, security hardening | Zero-trust security |

### Phase 4: Features & Polish (Weeks 13-16)

| Week | Task | Deliverable |
|------|------|-------------|
| 13 | Real-world integrations (Stripe, Plaid, Onfido) | Payment + KYC |
| 14 | New features (virtual cards, spending insights, notifications) | Industry-level features |
| 15 | Load testing (Locust), chaos engineering (Litmus), SLA validation | 99.99% availability proof |
| 16 | Documentation, runbooks, final QA, production cutover | Production launch v4.0 |

### Performance Targets

| Metric | Current | Target (v4.0) |
|--------|---------|---------------|
| Login latency | ~200ms | < 50ms |
| Transfer latency | ~150ms | < 45ms |
| Fraud scoring | ~100ms (rules) | < 10ms (Layer 1 ML) |
| Dashboard load | ~500ms | < 200ms |
| Availability | 99% (single server) | 99.99% (K8s + multi-AZ) |
| Concurrent users | ~100 | 10,000+ |
| Transactions/sec | ~50 | 5,000+ |
| Recovery time (RTO) | Minutes (manual) | < 30 seconds (auto) |

---

*NEXA v4.0 Architecture Plan â€” Generated April 2026*
*Classification: Internal â€” Engineering*
