"""
File: redis_client.py
Module: bank_system.core.redis_client

Purpose:
    Redis client factory with automatic fallback to an in-memory implementation.
    Provides a single get_redis() function that returns either a real Redis client
    or a FakeRedis instance that mimics the Redis API in memory.

Developer Journey:
    - v1: No Redis — OTPs stored in a Python dict, rate limiting done with a
      simple counter. Data was lost on every restart, and there was no rate
      limiting in production.
    - v2: Added Redis for OTP storage and rate limiting. But the app crashed
      on developer machines without Redis installed.
    - v3: Created FakeRedis fallback — the app works without Redis for local
      development, but logs a warning. This was critical for onboarding new
      developers who don't have Docker installed.
    - v4: Added TTL-based expiration to FakeRedis to match Redis behavior
      for OTP expiration. Added sorted set operations for the sliding window
      rate limiter. Added pipeline support for atomic rate limit checks.

Design Decision:
    FakeRedis is NOT suitable for production — it's single-process, has no
    persistence, and loses all data on restart. In production, REDIS_URL
    must point to a real Redis instance (Docker service or managed Redis
    like Upstash/ElastiCache).

Production Note:
    In Kubernetes, Redis is deployed as a separate pod (see k8s/02-redis.yaml).
    The backend connects via the service name 'nexa-redis:6379' which
    Kubernetes CoreDNS resolves to the pod's ClusterIP.
"""

import logging
import time

import redis

from .config import get_settings

logger = logging.getLogger("nexa.redis")

_redis_instance = None


class FakeRedis:
    """In-memory fallback when Redis is unavailable (local dev only).

    Supports TTL-based key expiration for correct OTP/session behavior.
    """

    def __init__(self):
        self._store = {}  # key -> value
        self._expiry = {}  # key -> expiry_timestamp (epoch)
        self._sets = {}
        self._sorted_sets = {}
        logger.warning("Using in-memory FakeRedis — data will not persist across restarts")

    def _is_expired(self, key):
        """Check if a key has expired and remove it if so."""
        if key in self._expiry:
            if time.time() >= self._expiry[key]:
                self._store.pop(key, None)
                self._expiry.pop(key, None)
                return True
        return False

    def _cleanup_expired(self):
        """Periodically clean up all expired keys."""
        now = time.time()
        expired_keys = [k for k, exp in self._expiry.items() if now >= exp]
        for k in expired_keys:
            self._store.pop(k, None)
            self._expiry.pop(k, None)

    def get(self, key):
        if self._is_expired(key):
            return None
        return self._store.get(key)

    def set(self, key, value, ex=None):
        self._store[key] = str(value) if not isinstance(value, str) else value
        if ex is not None:
            self._expiry[key] = time.time() + int(ex)
        elif key in self._expiry:
            del self._expiry[key]

    def setex(self, key, seconds, value):
        self._store[key] = str(value) if not isinstance(value, str) else value
        self._expiry[key] = time.time() + int(seconds)

    def delete(self, key):
        self._store.pop(key, None)
        self._expiry.pop(key, None)

    def exists(self, key):
        if self._is_expired(key):
            return 0
        return 1 if key in self._store else 0

    def ttl(self, key):
        if self._is_expired(key):
            return -2
        if key not in self._store:
            return -2
        if key not in self._expiry:
            return -1
        return max(0, int(self._expiry[key] - time.time()))

    def incr(self, key):
        if self._is_expired(key):
            self._store[key] = "0"
        val = int(self._store.get(key, "0")) + 1
        self._store[key] = str(val)
        return val

    def sadd(self, key, *values):
        if key not in self._sets:
            self._sets[key] = set()
        self._sets[key].update(values)

    def srem(self, key, *values):
        if key in self._sets:
            self._sets[key] -= set(values)

    def smembers(self, key):
        return self._sets.get(key, set())

    def scard(self, key):
        return len(self._sets.get(key, set()))

    # ── List operations (for Redis DSA Stack/Queue) ──

    def _get_list(self, key):
        if key not in self._store or not isinstance(self._store[key], list):
            self._store[key] = []
        return self._store[key]

    def lpush(self, key, *values):
        lst = self._get_list(key)
        for v in values:
            lst.insert(0, v)
        return len(lst)

    def rpush(self, key, *values):
        lst = self._get_list(key)
        lst.extend(values)
        return len(lst)

    def lpop(self, key):
        lst = self._get_list(key)
        if lst:
            return lst.pop(0)
        return None

    def lindex(self, key, index):
        lst = self._get_list(key)
        if 0 <= index < len(lst):
            return lst[index]
        return None

    def llen(self, key):
        lst = self._get_list(key)
        return len(lst)

    def lrange(self, key, start, end):
        lst = self._get_list(key)
        return lst[start:end + 1]

    def ltrim(self, key, start, end):
        lst = self._get_list(key)
        self._store[key] = lst[start:end + 1]

    # ── Extended Sorted Set operations (for Redis DSA PriorityQueue) ──

    def zpopmin(self, key, count=1):
        ss = self._sorted_sets.get(key, {})
        if not ss:
            return []
        sorted_items = sorted(ss.items(), key=lambda x: float(x[1]))
        result = sorted_items[:count]
        for member, _ in result:
            del ss[member]
        return [(m, float(s)) for m, s in result]

    def zrange(self, key, start, end, withscores=False):
        ss = self._sorted_sets.get(key, {})
        sorted_items = sorted(ss.items(), key=lambda x: float(x[1]))
        sliced = sorted_items[start:end + 1] if end >= 0 else sorted_items[start:]
        if withscores:
            return [(m, float(s)) for m, s in sliced]
        return [m for m, _ in sliced]

    def ping(self):
        return True

    # Sorted set operations (for rate limiter)
    def zadd(self, key, mapping):
        if key not in self._sorted_sets:
            self._sorted_sets[key] = {}
        self._sorted_sets[key].update(mapping)

    def zcard(self, key):
        return len(self._sorted_sets.get(key, {}))

    def zremrangebyscore(self, key, min_score, max_score):
        if key in self._sorted_sets:
            self._sorted_sets[key] = {
                k: v
                for k, v in self._sorted_sets[key].items()
                if not (float(min_score) <= float(v) <= float(max_score))
            }

    def expire(self, key, seconds):
        if key in self._store or key in self._sorted_sets:
            self._expiry[key] = time.time() + int(seconds)
            return True
        return False

    def pipeline(self):
        return FakePipeline(self)


class FakePipeline:
    """Fake pipeline that queues operations and executes them sequentially."""

    def __init__(self, fake_redis):
        self._redis = fake_redis
        self._commands = []

    def zadd(self, key, mapping):
        self._commands.append(("zadd", key, mapping))
        return self

    def zcard(self, key):
        self._commands.append(("zcard", key))
        return self

    def zremrangebyscore(self, key, min_score, max_score):
        self._commands.append(("zremrangebyscore", key, min_score, max_score))
        return self

    def expire(self, key, seconds):
        self._commands.append(("expire", key, seconds))
        return self

    def execute(self):
        results = []
        for cmd in self._commands:
            op = cmd[0]
            if op == "zadd":
                self._redis.zadd(cmd[1], cmd[2])
                results.append(1)
            elif op == "zcard":
                results.append(self._redis.zcard(cmd[1]))
            elif op == "zremrangebyscore":
                self._redis.zremrangebyscore(cmd[1], cmd[2], cmd[3])
                results.append(0)
            elif op == "expire":
                results.append(True)
            else:
                results.append(None)
        self._commands = []
        return results


def get_redis():
    global _redis_instance
    if _redis_instance is None:
        settings = get_settings()
        try:
            client = redis.from_url(settings.redis_url, decode_responses=True)
            client.ping()
            _redis_instance = client
            logger.info("Connected to Redis")
        except Exception:
            logger.warning("Redis not available — using in-memory fallback")
            _redis_instance = FakeRedis()
    return _redis_instance
