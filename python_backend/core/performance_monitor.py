"""
Performance monitoring system for the Debug Player Framework.
Tracks timing, metrics, and system performance indicators.
"""

import time
import threading
from typing import Dict, Optional, List
from dataclasses import dataclass, field
from collections import defaultdict, deque
import logging


@dataclass
class PerformanceMetrics:
    """Container for performance metrics."""
    operation_times: Dict[str, deque] = field(default_factory=lambda: defaultdict(lambda: deque(maxlen=1000)))
    custom_metrics: Dict[str, float] = field(default_factory=dict)
    counters: Dict[str, int] = field(default_factory=lambda: defaultdict(int))


class PerformanceMonitor:
    """
    Performance monitoring system for tracking operation times and metrics.
    Thread-safe implementation with configurable history retention.
    """
    
    def __init__(self, max_history: int = 1000):
        self.logger = logging.getLogger(__name__)
        self.max_history = max_history
        self.metrics = PerformanceMetrics()
        self.active_timers: Dict[str, float] = {}
        self._lock = threading.RLock()
        self.start_time = time.time()
        
    def start_timing(self, operation: str) -> None:
        """
        Start timing an operation.
        
        Args:
            operation: Name of the operation to time
        """
        with self._lock:
            self.active_timers[operation] = time.perf_counter()
    
    def end_timing(self, operation: str) -> float:
        """
        End timing an operation and record the duration.
        
        Args:
            operation: Name of the operation to end timing for
            
        Returns:
            Duration in milliseconds
        """
        with self._lock:
            if operation not in self.active_timers:
                self.logger.warning(f"No active timer for operation: {operation}")
                return 0.0
            
            start_time = self.active_timers.pop(operation)
            duration_ms = (time.perf_counter() - start_time) * 1000.0
            
            self.metrics.operation_times[operation].append(duration_ms)
            self.metrics.counters[f"{operation}_count"] += 1
            
            return duration_ms
    
    def record_metric(self, metric: str, value: float) -> None:
        """
        Record a custom metric value.
        
        Args:
            metric: Name of the metric
            value: Value to record
        """
        with self._lock:
            self.metrics.custom_metrics[metric] = value
            self.metrics.counters[f"{metric}_updates"] += 1
    
    def increment_counter(self, counter: str, amount: int = 1) -> None:
        """
        Increment a counter metric.
        
        Args:
            counter: Name of the counter
            amount: Amount to increment by
        """
        with self._lock:
            self.metrics.counters[counter] += amount
    
    def get_metrics(self) -> Dict[str, float]:
        """
        Get all current metrics.
        
        Returns:
            Dictionary of all metrics
        """
        with self._lock:
            result = {}
            
            # Add operation timing statistics
            for operation, times in self.metrics.operation_times.items():
                if times:
                    result[f"{operation}_avg_ms"] = sum(times) / len(times)
                    result[f"{operation}_min_ms"] = min(times)
                    result[f"{operation}_max_ms"] = max(times)
                    result[f"{operation}_latest_ms"] = times[-1] if times else 0.0
                    result[f"{operation}_count"] = len(times)
            
            # Add custom metrics
            result.update(self.metrics.custom_metrics)
            
            # Add counters
            result.update({k: float(v) for k, v in self.metrics.counters.items()})
            
            # Add system metrics
            result["uptime_seconds"] = time.time() - self.start_time
            result["active_timers"] = len(self.active_timers)
            
            return result
    
    def get_operation_stats(self, operation: str) -> Optional[Dict[str, float]]:
        """
        Get statistics for a specific operation.
        
        Args:
            operation: Name of the operation
            
        Returns:
            Dictionary of statistics or None if operation not found
        """
        with self._lock:
            if operation not in self.metrics.operation_times:
                return None
            
            times = self.metrics.operation_times[operation]
            if not times:
                return None
            
            return {
                "count": len(times),
                "avg_ms": sum(times) / len(times),
                "min_ms": min(times),
                "max_ms": max(times),
                "latest_ms": times[-1],
                "total_ms": sum(times)
            }
    
    def get_recent_operations(self, operation: str, count: int = 10) -> List[float]:
        """
        Get recent operation times.
        
        Args:
            operation: Name of the operation
            count: Number of recent operations to return
            
        Returns:
            List of recent operation times in milliseconds
        """
        with self._lock:
            if operation not in self.metrics.operation_times:
                return []
            
            times = self.metrics.operation_times[operation]
            return list(times)[-count:]
    
    def clear_metrics(self) -> None:
        """Clear all recorded metrics."""
        with self._lock:
            self.metrics = PerformanceMetrics()
            self.active_timers.clear()
            self.start_time = time.time()
    
    def get_summary_report(self) -> Dict[str, any]:
        """
        Get a comprehensive summary report.
        
        Returns:
            Dictionary containing performance summary
        """
        with self._lock:
            report = {
                "timestamp": time.time(),
                "uptime_seconds": time.time() - self.start_time,
                "active_timers": len(self.active_timers),
                "total_operations": sum(len(times) for times in self.metrics.operation_times.values()),
                "operations": {},
                "custom_metrics": self.metrics.custom_metrics.copy(),
                "counters": dict(self.metrics.counters)
            }
            
            # Add operation summaries
            for operation, times in self.metrics.operation_times.items():
                if times:
                    report["operations"][operation] = {
                        "count": len(times),
                        "avg_ms": sum(times) / len(times),
                        "min_ms": min(times),
                        "max_ms": max(times),
                        "total_ms": sum(times)
                    }
            
            return report
    
    def log_performance_summary(self, level: int = logging.INFO) -> None:
        """
        Log a performance summary to the logger.
        
        Args:
            level: Logging level to use
        """
        summary = self.get_summary_report()
        
        self.logger.log(level, f"Performance Summary:")
        self.logger.log(level, f"  Uptime: {summary['uptime_seconds']:.1f}s")
        self.logger.log(level, f"  Total Operations: {summary['total_operations']}")
        self.logger.log(level, f"  Active Timers: {summary['active_timers']}")
        
        if summary["operations"]:
            self.logger.log(level, "  Operation Performance:")
            for op, stats in summary["operations"].items():
                self.logger.log(level, f"    {op}: {stats['count']} ops, "
                                      f"avg: {stats['avg_ms']:.1f}ms, "
                                      f"min: {stats['min_ms']:.1f}ms, "
                                      f"max: {stats['max_ms']:.1f}ms")
        
        if summary["custom_metrics"]:
            self.logger.log(level, "  Custom Metrics:")
            for metric, value in summary["custom_metrics"].items():
                self.logger.log(level, f"    {metric}: {value}")