"""
Central Plot Manager - Core coordinator for the Debug Player Framework.
Manages plugin registration, signal coordination, and data flow control.
"""

import asyncio
import logging
from typing import Dict, List, Optional, Any, Set, Callable
from dataclasses import dataclass, field
from concurrent.futures import ThreadPoolExecutor
import time
import threading
from pathlib import Path

from core.interfaces import IPlugin, SignalInfo, IPerformanceMonitor, IDataSource
from core.performance_monitor import PerformanceMonitor
from core.cache_handler import CacheHandler
from core.signal_validation import SignalValidator


@dataclass
class PlotConfiguration:
    """Configuration for plot assignments and settings."""
    signal_assignments: Dict[str, List[str]] = field(default_factory=dict)
    color_schemes: Dict[str, str] = field(default_factory=dict)
    axis_settings: Dict[str, tuple] = field(default_factory=dict)
    layout_preferences: Dict[str, Any] = field(default_factory=dict)


class PlotManager:
    """
    Central coordinator for the Debug Player Framework.
    Manages plugins, signals, and data flow orchestration.
    """
    
    def __init__(self):
        self.logger = logging.getLogger(__name__)
        self.plugins: Dict[str, IPlugin] = {}
        self.signals: Dict[str, SignalInfo] = {}
        self.plugin_signals: Dict[str, Set[str]] = {}
        self.signal_subscribers: Dict[str, Set[Callable]] = {}
        self.performance_monitor = PerformanceMonitor()
        self.cache = CacheHandler()
        self.validator = SignalValidator()
        self.executor = ThreadPoolExecutor(max_workers=4)
        self.current_timestamp = 0.0
        self.config = PlotConfiguration()
        self._lock = threading.RLock()
        
        # Event callbacks
        self.on_timestamp_change: Optional[Callable] = None
        self.on_plugin_loaded: Optional[Callable] = None
        self.on_plugin_unloaded: Optional[Callable] = None
        self.on_signal_registered: Optional[Callable] = None
        
        self.logger.info("PlotManager initialized")
    
    def register_plugin(self, plugin: IPlugin) -> bool:
        """
        Register a plugin with the plot manager.
        
        Args:
            plugin: Plugin instance to register
            
        Returns:
            True if successful, False otherwise
        """
        with self._lock:
            try:
                self.performance_monitor.start_timing("plugin_registration")
                
                if plugin.name in self.plugins:
                    self.logger.info(f"Plugin {plugin.name} already registered, updating...")
                    # Unregister the existing plugin first
                    self.unregister_plugin(plugin.name)
                
                if not plugin.load():
                    self.logger.error(f"Failed to load plugin {plugin.name}")
                    return False
                
                self.plugins[plugin.name] = plugin
                self.plugin_signals[plugin.name] = set()
                
                # Register all signals from this plugin
                plugin_signals = plugin.get_signals()
                for signal_name, signal_info in plugin_signals.items():
                    if self.validator.validate_signal_info(signal_info):
                        self.signals[signal_name] = signal_info
                        self.plugin_signals[plugin.name].add(signal_name)
                        
                        if self.on_signal_registered:
                            self.on_signal_registered(signal_name, signal_info)
                    else:
                        self.logger.warning(f"Invalid signal info for {signal_name}")
                
                duration = self.performance_monitor.end_timing("plugin_registration")
                self.logger.info(f"Plugin {plugin.name} registered successfully in {duration:.2f}ms")
                
                if self.on_plugin_loaded:
                    self.on_plugin_loaded(plugin.name)
                
                return True
                
            except Exception as e:
                self.logger.error(f"Error registering plugin {plugin.name}: {e}")
                return False
    
    def unregister_plugin(self, plugin_name: str) -> bool:
        """
        Unregister a plugin from the plot manager.
        
        Args:
            plugin_name: Name of plugin to unregister
            
        Returns:
            True if successful, False otherwise
        """
        with self._lock:
            try:
                if plugin_name not in self.plugins:
                    self.logger.warning(f"Plugin {plugin_name} not found")
                    return False
                
                plugin = self.plugins[plugin_name]
                
                # Remove all signals from this plugin
                if plugin_name in self.plugin_signals:
                    for signal_name in self.plugin_signals[plugin_name]:
                        if signal_name in self.signals:
                            del self.signals[signal_name]
                        if signal_name in self.signal_subscribers:
                            del self.signal_subscribers[signal_name]
                    
                    del self.plugin_signals[plugin_name]
                
                # Unload the plugin
                plugin.unload()
                del self.plugins[plugin_name]
                
                self.logger.info(f"Plugin {plugin_name} unregistered successfully")
                
                if self.on_plugin_unloaded:
                    self.on_plugin_unloaded(plugin_name)
                
                return True
                
            except Exception as e:
                self.logger.error(f"Error unregistering plugin {plugin_name}: {e}")
                return False
    
    def get_available_signals(self) -> Dict[str, SignalInfo]:
        """Get all available signals from all plugins."""
        with self._lock:
            return self.signals.copy()
    
    def get_plugin_signals(self, plugin_name: str) -> Set[str]:
        """Get signals provided by a specific plugin."""
        with self._lock:
            return self.plugin_signals.get(plugin_name, set()).copy()
    
    def has_signal(self, signal_name: str) -> bool:
        """Check if a signal is available."""
        with self._lock:
            return signal_name in self.signals
    
    def subscribe_to_signal(self, signal_name: str, callback: Callable) -> bool:
        """
        Subscribe to updates for a specific signal.
        
        Args:
            signal_name: Name of signal to subscribe to
            callback: Function to call when signal data is updated
            
        Returns:
            True if successful, False otherwise
        """
        with self._lock:
            if signal_name not in self.signals:
                self.logger.warning(f"Signal {signal_name} not available")
                return False
            
            if signal_name not in self.signal_subscribers:
                self.signal_subscribers[signal_name] = set()
            
            self.signal_subscribers[signal_name].add(callback)
            return True
    
    def unsubscribe_from_signal(self, signal_name: str, callback: Callable) -> bool:
        """
        Unsubscribe from updates for a specific signal.
        
        Args:
            signal_name: Name of signal to unsubscribe from
            callback: Function to remove from subscribers
            
        Returns:
            True if successful, False otherwise
        """
        with self._lock:
            if signal_name in self.signal_subscribers:
                self.signal_subscribers[signal_name].discard(callback)
                if not self.signal_subscribers[signal_name]:
                    del self.signal_subscribers[signal_name]
                return True
            return False
    
    def request_data_update(self, timestamp: float, signals: Optional[List[str]] = None) -> Dict[str, Any]:
        """
        Request data update for specified timestamp and signals.
        
        Args:
            timestamp: Timestamp to request data for
            signals: Optional list of specific signals to update
            
        Returns:
            Dictionary of signal data
        """
        with self._lock:
            try:
                self.performance_monitor.start_timing("data_update")
                
                # Check cache first
                cache_key = self.cache.create_key(timestamp, signals=sorted(signals or []))
                cached_data = self.cache.get(cache_key)
                if cached_data:
                    duration = self.performance_monitor.end_timing("data_update")
                    self.performance_monitor.record_metric("cache_hit_rate", 1.0)
                    return cached_data
                
                # Update current timestamp
                self.current_timestamp = timestamp
                
                # Determine which signals to update
                target_signals = signals or list(self.signals.keys())
                
                # Collect data from all plugins
                signal_data = {}
                futures = []
                
                for signal_name in target_signals:
                    if signal_name in self.signals:
                        # Find plugin that provides this signal
                        for plugin_name, plugin_signals in self.plugin_signals.items():
                            if signal_name in plugin_signals:
                                plugin = self.plugins[plugin_name]
                                future = self.executor.submit(
                                    plugin.get_data_for_timestamp, 
                                    signal_name, 
                                    timestamp
                                )
                                futures.append((signal_name, future))
                                break
                
                # Collect results
                for signal_name, future in futures:
                    try:
                        data = future.result(timeout=1.0)  # 1 second timeout
                        if data is not None:
                            signal_data[signal_name] = data
                    except Exception as e:
                        self.logger.error(f"Error getting data for signal {signal_name}: {e}")
                
                # Cache the result
                self.cache.set(cache_key, signal_data, ttl=300)  # 5 minute TTL
                
                # Notify subscribers
                self._notify_subscribers(signal_data)
                
                duration = self.performance_monitor.end_timing("data_update")
                self.performance_monitor.record_metric("data_update_duration", duration)
                
                if self.on_timestamp_change:
                    self.on_timestamp_change(timestamp, signal_data)
                
                return signal_data
                
            except Exception as e:
                self.logger.error(f"Error in data update: {e}")
                return {}
    
    def _notify_subscribers(self, signal_data: Dict[str, Any]) -> None:
        """Notify all subscribers of signal data updates."""
        for signal_name, data in signal_data.items():
            if signal_name in self.signal_subscribers:
                for callback in self.signal_subscribers[signal_name]:
                    try:
                        callback(signal_name, data, self.current_timestamp)
                    except Exception as e:
                        self.logger.error(f"Error in subscriber callback: {e}")
    
    def get_plugin_info(self) -> List[Dict[str, Any]]:
        """Get information about all registered plugins."""
        with self._lock:
            plugin_info = []
            for plugin_name, plugin in self.plugins.items():
                plugin_info.append({
                    "name": plugin.name,
                    "version": plugin.version,
                    "description": plugin.description,
                    "is_loaded": plugin.is_loaded,
                    "signals": list(self.plugin_signals.get(plugin_name, set()))
                })
            return plugin_info
    
    def get_performance_metrics(self) -> Dict[str, float]:
        """Get performance metrics from the performance monitor."""
        return self.performance_monitor.get_metrics()
    
    def clear_cache(self) -> bool:
        """Clear all cached data."""
        return self.cache.clear()
    
    def shutdown(self) -> None:
        """Shutdown the plot manager and clean up resources."""
        self.logger.info("Shutting down PlotManager")
        
        # Unload all plugins
        plugin_names = list(self.plugins.keys())
        for plugin_name in plugin_names:
            self.unregister_plugin(plugin_name)
        
        # Shutdown executor
        self.executor.shutdown(wait=True)
        
        # Clear cache
        self.cache.clear()
        
        self.logger.info("PlotManager shutdown complete")