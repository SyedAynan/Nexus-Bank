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
        self._store = {}        # key -> value
        self._expiry = {}       # key -> expiry_timestamp (epoch)
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
                k: v for k, v in self._sorted_sets[key].items()
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

