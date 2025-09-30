"""
Intelligent Caching System for Generated Questions

This module provides advanced caching capabilities for generated questions
with intelligent cache keys, invalidation strategies, and performance optimization.
"""

import asyncio
import logging
import hashlib
import json
import pickle
import time
from typing import Dict, List, Optional, Any, Tuple, Union
from dataclasses import dataclass, field
from enum import Enum
from datetime import datetime, timedelta
import aioredis
from collections import defaultdict, OrderedDict
import threading
from functools import wraps
import zlib
import base64

logger = logging.getLogger(__name__)

class CacheStrategy(Enum):
    """Caching strategies"""
    LRU = "lru"                          # Least Recently Used
    LFU = "lfu"                          # Least Frequently Used
    TTL_BASED = "ttl_based"              # Time-to-live based
    ADAPTIVE = "adaptive"                # Adaptive based on usage patterns
    CONTENT_AWARE = "content_aware"      # Content similarity based

class CacheLevel(Enum):
    """Cache levels"""
    MEMORY = "memory"                    # In-memory cache
    REDIS = "redis"                      # Redis distributed cache
    HYBRID = "hybrid"                    # Combined memory and Redis
    PERSISTENT = "persistent"            # Persistent file-based cache

@dataclass
class CacheConfig:
    """Cache configuration"""
    max_memory_size: int = 10000         # Max entries in memory cache
    max_redis_size: int = 100000         # Max entries in Redis cache
    default_ttl: int = 3600               # Default TTL in seconds (1 hour)
    compression_enabled: bool = True       # Enable data compression
    strategy: CacheStrategy = CacheStrategy.ADAPTIVE
    cache_level: CacheLevel = CacheLevel.HYBRID
    hit_rate_threshold: float = 0.7      # Minimum hit rate for adaptive strategies
    similarity_threshold: float = 0.8     # Similarity threshold for content-aware caching
    redis_url: str = "redis://localhost:6379"
    persistent_path: str = "/tmp/question_cache"

@dataclass
class CacheKey:
    """Intelligent cache key"""
    content_hash: str
    question_type: str
    difficulty: str
    provider: str
    model: str
    parameters_hash: str
    context_hash: Optional[str] = None
    variation_seed: Optional[str] = None

@dataclass
class CacheEntry:
    """Cache entry with metadata"""
    key: CacheKey
    value: Any
    created_at: datetime
    expires_at: datetime
    access_count: int = 0
    last_accessed: datetime = field(default_factory=datetime.now)
    quality_score: float = 0.0
    size_bytes: int = 0
    compression_ratio: float = 1.0

@dataclass
class CacheMetrics:
    """Cache performance metrics"""
    total_requests: int = 0
    cache_hits: int = 0
    cache_misses: int = 0
    evictions: int = 0
    size_bytes: int = 0
    hit_rate: float = 0.0
    avg_response_time: float = 0.0
    compression_savings: float = 0.0

class IntelligentCache:
    """Intelligent caching system for generated questions"""
    
    def __init__(self, config: CacheConfig):
        self.config = config
        self.memory_cache: OrderedDict[str, CacheEntry] = OrderedDict()
        self.redis_client: Optional[aioredis.Redis] = None
        self.metrics = CacheMetrics()
        self.access_patterns = defaultdict(int)
        self.content_similarity_index = defaultdict(list)
        self.lock = threading.RLock()
        
        # Initialize cache based on level
        if config.cache_level in [CacheLevel.REDIS, CacheLevel.HYBRID]:
            self._initialize_redis()
        
        # Start background tasks
        self._start_background_tasks()
    
    def _initialize_redis(self):
        """Initialize Redis connection"""
        try:
            self.redis_client = aioredis.from_url(self.config.redis_url)
            logger.info(f"Redis connection initialized: {self.config.redis_url}")
        except Exception as e:
            logger.warning(f"Redis connection failed, falling back to memory cache: {e}")
            self.config.cache_level = CacheLevel.MEMORY
    
    def _start_background_tasks(self):
        """Start background maintenance tasks"""
        # Start cleanup task
        asyncio.create_task(self._periodic_cleanup())
        # Start metrics collection
        asyncio.create_task(self._collect_metrics())
        # Start adaptive strategy optimization
        asyncio.create_task(self._optimize_strategy())
    
    def generate_cache_key(
        self,
        content: str,
        question_type: str,
        difficulty: str,
        provider: str,
        model: str,
        parameters: Dict[str, Any],
        context: Optional[Dict[str, Any]] = None,
        variation_seed: Optional[str] = None
    ) -> CacheKey:
        """Generate intelligent cache key"""
        
        # Content hash
        content_hash = hashlib.sha256(content.encode()).hexdigest()[:16]
        
        # Parameters hash
        params_str = json.dumps(parameters, sort_keys=True)
        params_hash = hashlib.md5(params_str.encode()).hexdigest()[:8]
        
        # Context hash
        context_hash = None
        if context:
            context_str = json.dumps(context, sort_keys=True)
            context_hash = hashlib.md5(context_str.encode()).hexdigest()[:8]
        
        return CacheKey(
            content_hash=content_hash,
            question_type=question_type,
            difficulty=difficulty,
            provider=provider,
            model=model,
            parameters_hash=params_hash,
            context_hash=context_hash,
            variation_seed=variation_seed
        )
    
    def _serialize_key(self, key: CacheKey) -> str:
        """Serialize cache key for storage"""
        key_dict = {
            'content_hash': key.content_hash,
            'question_type': key.question_type,
            'difficulty': key.difficulty,
            'provider': key.provider,
            'model': key.model,
            'parameters_hash': key.parameters_hash,
            'context_hash': key.context_hash,
            'variation_seed': key.variation_seed
        }
        return hashlib.md5(json.dumps(key_dict, sort_keys=True).encode()).hexdigest()
    
    def _compress_value(self, value: Any) -> Tuple[bytes, float]:
        """Compress cache value"""
        try:
            serialized = pickle.dumps(value)
            if self.config.compression_enabled:
                compressed = zlib.compress(serialized)
                compression_ratio = len(serialized) / len(compressed)
                return compressed, compression_ratio
            return serialized, 1.0
        except Exception as e:
            logger.warning(f"Compression failed: {e}")
            return pickle.dumps(value), 1.0
    
    def _decompress_value(self, compressed_data: bytes) -> Any:
        """Decompress cache value"""
        try:
            if self.config.compression_enabled:
                decompressed = zlib.decompress(compressed_data)
            else:
                decompressed = compressed_data
            return pickle.loads(decompressed)
        except Exception as e:
            logger.error(f"Decompression failed: {e}")
            return None
    
    async def get(self, key: CacheKey) -> Optional[Any]:
        """Get value from cache"""
        start_time = time.time()
        self.metrics.total_requests += 1
        
        try:
            # Try memory cache first
            with self.lock:
                serialized_key = self._serialize_key(key)
                if serialized_key in self.memory_cache:
                    entry = self.memory_cache[serialized_key]
                    if entry.expires_at > datetime.now():
                        # Update access patterns
                        entry.access_count += 1
                        entry.last_accessed = datetime.now()
                        self.access_patterns[serialized_key] += 1
                        
                        # Move to end for LRU
                        self.memory_cache.move_to_end(serialized_key)
                        
                        self.metrics.cache_hits += 1
                        response_time = time.time() - start_time
                        self.metrics.avg_response_time = (
                            (self.metrics.avg_response_time * (self.metrics.total_requests - 1) + response_time) 
                            / self.metrics.total_requests
                        )
                        
                        return entry.value
                    else:
                        # Remove expired entry
                        del self.memory_cache[serialized_key]
                        self.metrics.evictions += 1
            
            # Try Redis cache
            if self.config.cache_level in [CacheLevel.REDIS, CacheLevel.HYBRID] and self.redis_client:
                redis_key = f"question_cache:{self._serialize_key(key)}"
                cached_data = await self.redis_client.get(redis_key)
                
                if cached_data:
                    entry_data = self._decompress_value(cached_data)
                    if entry_data and entry_data.expires_at > datetime.now():
                        # Update memory cache
                        with self.lock:
                            self.memory_cache[serialized_key] = entry_data
                            self.memory_cache.move_to_end(serialized_key)
                        
                        self.metrics.cache_hits += 1
                        return entry_data.value
            
            # Cache miss - try content-aware matching
            if self.config.strategy == CacheStrategy.CONTENT_AWARE:
                similar_result = await self._find_similar_content(key)
                if similar_result:
                    self.metrics.cache_hits += 1
                    return similar_result
            
            self.metrics.cache_misses += 1
            return None
            
        except Exception as e:
            logger.error(f"Cache get error: {e}")
            self.metrics.cache_misses += 1
            return None
    
    async def set(
        self,
        key: CacheKey,
        value: Any,
        ttl: Optional[int] = None,
        quality_score: float = 0.0
    ) -> bool:
        """Set value in cache"""
        try:
            if ttl is None:
                ttl = self.config.default_ttl
            
            # Create cache entry
            compressed_data, compression_ratio = self._compress_value(value)
            
            entry = CacheEntry(
                key=key,
                value=value,
                created_at=datetime.now(),
                expires_at=datetime.now() + timedelta(seconds=ttl),
                access_count=0,
                last_accessed=datetime.now(),
                quality_score=quality_score,
                size_bytes=len(compressed_data),
                compression_ratio=compression_ratio
            )
            
            serialized_key = self._serialize_key(key)
            
            # Store in memory cache
            with self.lock:
                # Evict if necessary based on strategy
                self._evict_if_needed()
                
                self.memory_cache[serialized_key] = entry
                self.metrics.size_bytes += entry.size_bytes
                
                # Update content similarity index
                if self.config.strategy == CacheStrategy.CONTENT_AWARE:
                    self._update_similarity_index(key, serialized_key)
            
            # Store in Redis cache
            if self.config.cache_level in [CacheLevel.REDIS, CacheLevel.HYBRID] and self.redis_client:
                redis_key = f"question_cache:{serialized_key}"
                await self.redis_client.setex(
                    redis_key, 
                    ttl, 
                    self._compress_value(entry)[0]
                )
            
            return True
            
        except Exception as e:
            logger.error(f"Cache set error: {e}")
            return False
    
    def _evict_if_needed(self):
        """Evict entries if cache is full"""
        if len(self.memory_cache) >= self.config.max_memory_size:
            evict_count = max(1, int(self.config.max_memory_size * 0.1))  # Evict 10%
            
            if self.config.strategy == CacheStrategy.LRU:
                # LRU eviction
                for _ in range(evict_count):
                    if self.memory_cache:
                        oldest_key, oldest_entry = self.memory_cache.popitem(last=False)
                        self.metrics.size_bytes -= oldest_entry.size_bytes
                        self.metrics.evictions += 1
            
            elif self.config.strategy == CacheStrategy.LFU:
                # LFU eviction
                sorted_items = sorted(
                    self.memory_cache.items(), 
                    key=lambda x: x[1].access_count
                )
                for _ in range(min(evict_count, len(sorted_items))):
                    key, entry = sorted_items.pop(0)
                    del self.memory_cache[key]
                    self.metrics.size_bytes -= entry.size_bytes
                    self.metrics.evictions += 1
            
            else:  # Default to LRU
                for _ in range(evict_count):
                    if self.memory_cache:
                        oldest_key, oldest_entry = self.memory_cache.popitem(last=False)
                        self.metrics.size_bytes -= oldest_entry.size_bytes
                        self.metrics.evictions += 1
    
    def _update_similarity_index(self, key: CacheKey, serialized_key: str):
        """Update content similarity index"""
        content_key = key.content_hash
        self.content_similarity_index[content_key].append(serialized_key)
        
        # Keep only recent entries
        if len(self.content_similarity_index[content_key]) > 10:
            self.content_similarity_index[content_key] = self.content_similarity_index[content_key][-10:]
    
    async def _find_similar_content(self, key: CacheKey) -> Optional[Any]:
        """Find similar content in cache"""
        similar_keys = self.content_similarity_index.get(key.content_hash, [])
        
        for similar_key in similar_keys:
            if similar_key in self.memory_cache:
                entry = self.memory_cache[similar_key]
                if entry.expires_at > datetime.now():
                    # Check if parameters are similar enough
                    if (entry.key.question_type == key.question_type and
                        entry.key.difficulty == key.difficulty and
                        entry.key.parameters_hash == key.parameters_hash):
                        return entry.value
        
        return None
    
    async def invalidate(self, pattern: str = None) -> int:
        """Invalidate cache entries"""
        invalidated_count = 0
        
        try:
            with self.lock:
                if pattern:
                    # Pattern-based invalidation
                    keys_to_delete = []
                    for key in self.memory_cache.keys():
                        if pattern in key:
                            keys_to_delete.append(key)
                    
                    for key in keys_to_delete:
                        entry = self.memory_cache.pop(key, None)
                        if entry:
                            self.metrics.size_bytes -= entry.size_bytes
                            invalidated_count += 1
                else:
                    # Clear all cache
                    size_before = self.metrics.size_bytes
                    self.memory_cache.clear()
                    self.metrics.size_bytes = 0
                    invalidated_count = size_before
            
            # Invalidate Redis cache
            if self.config.cache_level in [CacheLevel.REDIS, CacheLevel.HYBRID] and self.redis_client:
                if pattern:
                    redis_pattern = f"question_cache:*{pattern}*"
                    keys = await self.redis_client.keys(redis_pattern)
                    if keys:
                        deleted = await self.redis_client.delete(*keys)
                        invalidated_count += deleted
                else:
                    # Clear all Redis cache
                    keys = await self.redis_client.keys("question_cache:*")
                    if keys:
                        deleted = await self.redis_client.delete(*keys)
                        invalidated_count += deleted
            
            logger.info(f"Cache invalidation completed: {invalidated_count} entries removed")
            return invalidated_count
            
        except Exception as e:
            logger.error(f"Cache invalidation error: {e}")
            return 0
    
    async def _periodic_cleanup(self):
        """Periodic cleanup of expired entries"""
        while True:
            try:
                await asyncio.sleep(300)  # Run every 5 minutes
                
                with self.lock:
                    expired_keys = []
                    for key, entry in self.memory_cache.items():
                        if entry.expires_at < datetime.now():
                            expired_keys.append(key)
                    
                    for key in expired_keys:
                        entry = self.memory_cache.pop(key, None)
                        if entry:
                            self.metrics.size_bytes -= entry.size_bytes
                            self.metrics.evictions += 1
                
                logger.debug(f"Periodic cleanup: {len(expired_keys)} expired entries removed")
                
            except Exception as e:
                logger.error(f"Periodic cleanup error: {e}")
    
    async def _collect_metrics(self):
        """Collect and update cache metrics"""
        while True:
            try:
                await asyncio.sleep(60)  # Update every minute
                
                # Calculate hit rate
                total = self.metrics.cache_hits + self.metrics.cache_misses
                if total > 0:
                    self.metrics.hit_rate = self.metrics.cache_hits / total
                
                # Log metrics
                logger.info(
                    f"Cache Metrics - Hit Rate: {self.metrics.hit_rate:.2f}, "
                    f"Size: {len(self.memory_cache)}, "
                    f"Memory: {self.metrics.size_bytes / 1024 / 1024:.2f}MB"
                )
                
            except Exception as e:
                logger.error(f"Metrics collection error: {e}")
    
    async def _optimize_strategy(self):
        """Optimize caching strategy based on performance"""
        while True:
            try:
                await asyncio.sleep(600)  # Run every 10 minutes
                
                if self.metrics.hit_rate < self.config.hit_rate_threshold:
                    # Consider switching strategies
                    logger.warning(f"Low cache hit rate: {self.metrics.hit_rate:.2f}")
                    
                    # Could implement adaptive strategy switching here
                    # For now, just log the warning
                
            except Exception as e:
                logger.error(f"Strategy optimization error: {e}")
    
    def get_metrics(self) -> CacheMetrics:
        """Get current cache metrics"""
        return self.metrics
    
    def get_stats(self) -> Dict[str, Any]:
        """Get detailed cache statistics"""
        return {
            "config": {
                "max_memory_size": self.config.max_memory_size,
                "default_ttl": self.config.default_ttl,
                "strategy": self.config.strategy.value,
                "cache_level": self.config.cache_level.value,
                "compression_enabled": self.config.compression_enabled
            },
            "metrics": {
                "total_requests": self.metrics.total_requests,
                "cache_hits": self.metrics.cache_hits,
                "cache_misses": self.metrics.cache_misses,
                "hit_rate": self.metrics.hit_rate,
                "evictions": self.metrics.evictions,
                "size_bytes": self.metrics.size_bytes,
                "avg_response_time": self.metrics.avg_response_time,
                "compression_savings": self.metrics.compression_savings
            },
            "current_usage": {
                "memory_entries": len(self.memory_cache),
                "memory_usage_mb": self.metrics.size_bytes / 1024 / 1024,
                "memory_utilization": len(self.memory_cache) / self.config.max_memory_size
            }
        }

# Cache decorator for easy usage
def cache_result(ttl: int = 3600, key_generator: callable = None):
    """Decorator to cache function results"""
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Generate cache key
            if key_generator:
                cache_key = key_generator(*args, **kwargs)
            else:
                # Default key generation
                content = kwargs.get('content', str(args[0]) if args else '')
                question_type = kwargs.get('question_type', 'default')
                difficulty = kwargs.get('difficulty', 'intermediate')
                provider = kwargs.get('provider', 'default')
                model = kwargs.get('model', 'default')
                parameters = kwargs.get('parameters', {})
                
                # Get or create cache instance
                cache = kwargs.get('cache')
                if not cache:
                    # Use default cache
                    from . import get_intelligent_cache
                    cache = get_intelligent_cache()
                
                if cache:
                    key = cache.generate_cache_key(
                        content=content,
                        question_type=question_type,
                        difficulty=difficulty,
                        provider=provider,
                        model=model,
                        parameters=parameters
                    )
                    
                    # Try to get from cache
                    result = await cache.get(key)
                    if result is not None:
                        return result
                    
                    # Cache miss - execute function
                    result = await func(*args, **kwargs)
                    
                    # Store in cache
                    await cache.set(key, result, ttl)
                    
                    return result
            
            # No caching available
            return await func(*args, **kwargs)
        
        return wrapper
    return decorator

# Global cache instance
_global_cache: Optional[IntelligentCache] = None

def get_intelligent_cache(config: Optional[CacheConfig] = None) -> IntelligentCache:
    """Get global intelligent cache instance"""
    global _global_cache
    
    if _global_cache is None:
        if config is None:
            config = CacheConfig()
        _global_cache = IntelligentCache(config)
    
    return _global_cache

def initialize_intelligent_cache(config: CacheConfig) -> IntelligentCache:
    """Initialize global intelligent cache"""
    global _global_cache
    _global_cache = IntelligentCache(config)
    return _global_cache