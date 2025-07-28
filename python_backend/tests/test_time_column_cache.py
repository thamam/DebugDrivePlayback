import os
import pytest

from python_backend.plugins.vehicle_data_plugin import VehicleDataPlugin

TEST_DATA_PATH = os.path.join(
    os.path.dirname(__file__), "..", "test_data", "normal_driving.csv"
)


def test_time_column_cached_after_load():
    plugin = VehicleDataPlugin(TEST_DATA_PATH)
    assert plugin.load(), "plugin failed to load test data"

    first = plugin._time_column
    assert first is not None

    # call multiple plugin methods
    plugin.get_data_for_timestamp("vehicle_speed", 0.5)
    plugin.get_data_range("vehicle_speed", 0.0, 1.0)

    # _get_time_column should return the same value
    second = plugin._get_time_column()
    third = plugin._get_time_column()
    assert first == second == third
