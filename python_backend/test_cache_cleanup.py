import time
import os
import sys

sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from core.plot_manager import PlotManager

def test_cache_cleanup_thread():
    pm = PlotManager(cache_cleanup_interval=0.1)
    try:
        pm.cache.set("foo", "bar", ttl=0.2)
        assert pm.cache.get("foo") == "bar"
        time.sleep(0.35)
        assert pm.cache.get("foo") is None
    finally:
        pm.shutdown()
    assert not pm._cache_cleaner_thread.is_alive()
