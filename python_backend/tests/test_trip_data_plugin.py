import sys
from pathlib import Path
import pandas as pd

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from plugins.trip_data_plugin import TripDataPlugin


def test_combine_dataframes_vectorized():
    plugin = TripDataPlugin('unused')
    dfs = {
        'brake': pd.DataFrame({'time_stamp': [1.0, 2.0], 'data_value': [0.1, None]}),
        'gps': pd.DataFrame({'time_stamp': [1.0, 2.0], 'lat': [10.0, 11.0], 'lon': [20.0, None]})
    }
    combined = plugin._combine_dataframes(dfs)
    assert list(combined.columns) == ['timestamp', 'signal', 'value']
    # brake contributes one row, gps contributes three rows after melt
    assert len(combined) == 4
    assert set(combined['signal']) == {'brake', 'gps_lat', 'gps_lon'}


def test_load_directory(tmp_path):
    brake = pd.DataFrame({'time_stamp': [0.0, 1.0], 'data_value': [5.0, 6.0]})
    gps = pd.DataFrame({'time_stamp': [0.0, 1.0], 'lat': [50.0, 51.0], 'lon': [8.0, 8.1]})
    brake.to_csv(tmp_path / 'brake.csv', index=False)
    gps.to_csv(tmp_path / 'gps.csv', index=False)

    plugin = TripDataPlugin(str(tmp_path))
    assert plugin.load()
    # two signals from gps (lat, lon) plus brake
    assert {'brake', 'gps_lat', 'gps_lon'}.issubset(plugin._signals.keys())
    assert len(plugin._data) == 6
