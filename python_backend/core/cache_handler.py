"""
Cache management system for the Debug Player Framework.
Provides efficient data caching with TTL and memory management.
"""

import time
import threading
from typing import Dict, Optional, Any, Tuple
from dataclasses import dataclass
import logging
import pickle
import hashlib
from collections import OrderedDict


@dataclass
class CacheEntry:
    """Cache entry with value and metadata."""
    value: Any
    timestamp: float
    ttl: Optional[float] = None
    access_count: int = 0
    size_bytes: int = 0


class CacheHandler:
    """
    Thread-safe cache handler with TTL support and memory management.
    Implements LRU eviction policy when memory limits are reached.
    """
    
    def __init__(self, max_size_mb: int = 512, default_ttl: int = 300):
        self.logger = logging.getLogger(__name__)
        self.max_size_bytes = max_size_mb * 1024 * 1024
        self.default_ttl = default_ttl
        self.cache: OrderedDict[str, CacheEntry] = OrderedDict()
        self.current_size = 0
        self._lock = threading.RLock()
        self.stats = {
            "hits": 0,
            "misses": 0,
            "evictions": 0,
            "expired": 0
        }
        
        self.logger.info(f"Cache initialized with {max_size_mb}MB limit")
    
    def get(self, key: str) -> Optional[Any]:
        """
        Get value from cache.
        
        Args:
            key: Cache key
            
        Returns:
            Cached value or None if not found/expired
        """
        with self._lock:
            if key not in self.cache:
                self.stats["misses"] += 1
                return None
            
            entry = self.cache[key]
            
            # Check if expired
            if entry.ttl is not None:
                if time.time() - entry.timestamp > entry.ttl:
                    self.delete(key)
                    self.stats["expired"] += 1
                    self.stats["misses"] += 1
                    return None
            
            # Move to end (most recently used)
            self.cache.move_to_end(key)
            entry.access_count += 1
            self.stats["hits"] += 1
            
            return entry.value
    
    def set(self, key: str, value: Any, ttl: Optional[int] = None) -> bool:
        """
        Set value in cache.
        
        Args:
            key: Cache key
            value: Value to cache
            ttl: Time to live in seconds
            
        Returns:
            True if successful, False otherwise
        """
        with self._lock:
            try:
                # Calculate size
                size_bytes = self._calculate_size(value)
                
                # Check if value is too large
                if size_bytes > self.max_size_bytes:
                    self.logger.warning(f"Value too large for cache: {size_bytes} bytes")
                    return False
                
                # If key exists, remove old entry first
                if key in self.cache:
                    self.delete(key)
                
                # Make room if needed
                while (self.current_size + size_bytes > self.max_size_bytes and 
                       len(self.cache) > 0):
                    self._evict_lru()
                
                # Add new entry
                entry = CacheEntry(
                    value=value,
                    timestamp=time.time(),
                    ttl=ttl or self.default_ttl,
                    size_bytes=size_bytes
                )
                
                self.cache[key] = entry
                self.current_size += size_bytes
                
                return True
                
            except Exception as e:
                self.logger.error(f"Error setting cache value: {e}")
                return False
    
    def delete(self, key: str) -> bool:
        """
        Delete value from cache.
        
        Args:
            key: Cache key
            
        Returns:
            True if deleted, False if not found
        """
        with self._lock:
            if key in self.cache:
                entry = self.cache.pop(key)
                self.current_size -= entry.size_bytes
                return True
            return False
    
    def clear(self) -> bool:
        """
        Clear all cached data.
        
        Returns:
            True if successful
        """
        with self._lock:
            self.cache.clear()
            self.current_size = 0
            self.stats = {
                "hits": 0,
                "misses": 0,
                "evictions": 0,
                "expired": 0
            }
            return True
    
    def _evict_lru(self) -> None:
        """Evict least recently used entry."""
        if self.cache:
            key, entry = self.cache.popitem(last=False)
            self.current_size -= entry.size_bytes
            self.stats["evictions"] += 1
            self.logger.debug(f"Evicted LRU cache entry: {key}")
    
    def _calculate_size(self, value: Any) -> int:
        """Calculate approximate size of value in bytes."""
        try:
            return len(pickle.dumps(value, protocol=pickle.HIGHEST_PROTOCOL))
        except Exception:
            # Fallback estimation
            if isinstance(value, (str, bytes)):
                return len(value)
            elif isinstance(value, (int, float)):
                return 8
            elif isinstance(value, dict):
                return sum(self._calculate_size(k) + self._calculate_size(v) 
                          for k, v in value.items())
            elif isinstance(value, (list, tuple)):
                return sum(self._calculate_size(item) for item in value)
            else:
                return 64  # Default estimate
    
    def cleanup_expired(self) -> int:
        """
        Clean up expired entries.
        
        Returns:
            Number of entries cleaned up
        """
        with self._lock:
            current_time = time.time()
            expired_keys = []
            
            for key, entry in self.cache.items():
                if entry.ttl is not None:
                    if current_time - entry.timestamp > entry.ttl:
                        expired_keys.append(key)
            
            for key in expired_keys:
                self.delete(key)
                self.stats["expired"] += 1
            
            return len(expired_keys)
    
    def get_stats(self) -> Dict[str, Any]:
        """
        Get cache statistics.
        
        Returns:
            Dictionary of cache statistics
        """
        with self._lock:
            total_requests = self.stats["hits"] + self.stats["misses"]
            hit_rate = self.stats["hits"] / total_requests if total_requests > 0 else 0
            
            return {
                "size_bytes": self.current_size,
                "size_mb": self.current_size / (1024 * 1024),
                "max_size_mb": self.max_size_bytes / (1024 * 1024),
                "entry_count": len(self.cache),
                "hit_rate": hit_rate,
                "hits": self.stats["hits"],
                "misses": self.stats["misses"],
                "evictions": self.stats["evictions"],
                "expired": self.stats["expired"],
                "memory_usage_percent": (self.current_size / self.max_size_bytes) * 100
            }
    
    def get_cache_info(self) -> Dict[str, Any]:
        """
        Get detailed cache information.
        
        Returns:
            Dictionary of cache information
        """
        with self._lock:
            entries_info = []
            current_time = time.time()
            
            for key, entry in self.cache.items():
                age = current_time - entry.timestamp
                ttl_remaining = entry.ttl - age if entry.ttl else None
                
                entries_info.append({
                    "key": key,
                    "size_bytes": entry.size_bytes,
                    "age_seconds": age,
                    "ttl_remaining": ttl_remaining,
                    "access_count": entry.access_count
                })
            
            return {
                "entries": entries_info,
                "stats": self.get_stats()
            }
    
    def create_key(self, *args, **kwargs) -> str:
        """
        Create a cache key from arguments.
        
        Args:
            *args: Arguments to include in key
            **kwargs: Keyword arguments to include in key
            
        Returns:
            Hash-based cache key
        """
        key_data = str(args) + str(sorted(kwargs.items()))
        return hashlib.md5(key_data.encode()).hexdigest()