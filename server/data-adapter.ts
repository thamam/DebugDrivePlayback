/**
 * Real Data Adapter Layer
 * Handles loading and processing real vehicle data from CSV files
 */

import { promises as fs } from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';

export interface DataPoint {
  timestamp: number;
  value: number | string | boolean;
}

export interface Signal {
  name: string;
  type: 'numeric' | 'string' | 'boolean';
  units: string;
  description: string;
  data: DataPoint[];
  range?: [number, number];
  sampleRate?: number;
}

export interface TripData {
  id: string;
  name: string;
  path: string;
  duration: number;
  startTime: number;
  endTime: number;
  signals: Record<string, Signal>;
  metadata?: any;
}

export class DataAdapter {
  private cache = new Map<string, TripData>();
  private cacheExpiry = new Map<string, number>();
  private cacheTimeout = 5 * 60 * 1000; // 5 minutes

  /**
   * Load trip data from a directory containing CSV files
   */
  async loadTripData(tripPath: string): Promise<TripData> {
    const cacheKey = path.resolve(tripPath);
    
    // Check cache first
    if (this.cache.has(cacheKey)) {
      const expiry = this.cacheExpiry.get(cacheKey) || 0;
      if (Date.now() < expiry) {
        return this.cache.get(cacheKey)!;
      }
    }

    try {
      const fullPath = path.resolve(tripPath);
      const stats = await fs.stat(fullPath);
      
      if (!stats.isDirectory()) {
        throw new Error('Path must be a directory containing CSV files');
      }

      const files = await fs.readdir(fullPath);
      const csvFiles = files.filter(f => f.endsWith('.csv'));
      
      if (csvFiles.length === 0) {
        throw new Error('No CSV files found in directory');
      }

      // Load trip metadata if available
      const metadata = await this.loadTripMetadata(fullPath);

      // Load signals from CSV files
      const signals: Record<string, Signal> = {};
      let minTimestamp = Infinity;
      let maxTimestamp = -Infinity;

      for (const csvFile of csvFiles) {
        const signalName = csvFile.replace('.csv', '');
        
        try {
          const signal = await this.loadSignalFromCSV(
            path.join(fullPath, csvFile),
            signalName
          );
          
          signals[signalName] = signal;
          
          // Update time range
          if (signal.data.length > 0) {
            const firstTs = signal.data[0].timestamp;
            const lastTs = signal.data[signal.data.length - 1].timestamp;
            minTimestamp = Math.min(minTimestamp, firstTs);
            maxTimestamp = Math.max(maxTimestamp, lastTs);
          }
        } catch (error) {
          console.warn(`Failed to load signal ${signalName}:`, error);
        }
      }

      if (Object.keys(signals).length === 0) {
        throw new Error('No valid signals found in CSV files');
      }

      const tripData: TripData = {
        id: `trip-${Date.now()}`,
        name: metadata?.name || path.basename(tripPath),
        path: tripPath,
        duration: maxTimestamp - minTimestamp,
        startTime: minTimestamp,
        endTime: maxTimestamp,
        signals,
        metadata
      };

      // Cache the result
      this.cache.set(cacheKey, tripData);
      this.cacheExpiry.set(cacheKey, Date.now() + this.cacheTimeout);

      return tripData;
    } catch (error) {
      throw new Error(`Failed to load trip data from ${tripPath}: ${error instanceof Error ? error.message : error}`);
    }
  }

  /**
   * Load a single signal from a CSV file
   */
  private async loadSignalFromCSV(csvPath: string, signalName: string): Promise<Signal> {
    const content = await fs.readFile(csvPath, 'utf-8');
    
    // Parse CSV
    const records = parse(content, {
      columns: true,
      skip_empty_lines: true,
      trim: true
    });

    if (records.length === 0) {
      throw new Error('CSV file is empty or has no data rows');
    }

    // Determine column names
    const columns = Object.keys(records[0]);
    let timestampCol = columns.find(col => 
      col.toLowerCase().includes('time') || 
      col.toLowerCase().includes('timestamp') ||
      col.toLowerCase() === 't'
    );
    
    let valueCol = columns.find(col => 
      col !== timestampCol && 
      !col.toLowerCase().includes('time')
    );

    // Fallback to first two columns if not found
    if (!timestampCol) timestampCol = columns[0];
    if (!valueCol) valueCol = columns[1] || columns[0];

    if (!timestampCol || !valueCol) {
      throw new Error('Could not determine timestamp and value columns');
    }

    // Parse data points
    const data: DataPoint[] = [];
    const values: number[] = [];
    
    for (const record of records) {
      const timestamp = parseFloat(record[timestampCol]);
      const rawValue = record[valueCol];
      
      if (isNaN(timestamp)) continue;

      let value: number | string | boolean;
      
      // Try to parse as number first
      const numValue = parseFloat(rawValue);
      if (!isNaN(numValue)) {
        value = numValue;
        values.push(numValue);
      } else {
        // Check if it's a boolean
        const lowerValue = rawValue.toLowerCase();
        if (lowerValue === 'true' || lowerValue === 'false') {
          value = lowerValue === 'true';
        } else {
          value = rawValue;
        }
      }

      data.push({ timestamp, value });
    }

    if (data.length === 0) {
      throw new Error('No valid data points found in CSV');
    }

    // Determine signal type
    let signalType: 'numeric' | 'string' | 'boolean' = 'string';
    if (values.length > 0) {
      signalType = 'numeric';
    } else if (data.every(d => typeof d.value === 'boolean')) {
      signalType = 'boolean';
    }

    // Calculate range for numeric signals
    let range: [number, number] | undefined;
    if (signalType === 'numeric' && values.length > 0) {
      range = [Math.min(...values), Math.max(...values)];
    }

    // Calculate sample rate
    let sampleRate: number | undefined;
    if (data.length > 1) {
      const totalTime = data[data.length - 1].timestamp - data[0].timestamp;
      sampleRate = data.length / totalTime;
    }

    return {
      name: signalName,
      type: signalType,
      units: this.getSignalUnits(signalName),
      description: this.getSignalDescription(signalName),
      data,
      range,
      sampleRate
    };
  }

  /**
   * Load trip metadata from trip_info.json
   */
  private async loadTripMetadata(tripDir: string): Promise<any> {
    try {
      const metadataPath = path.join(tripDir, 'trip_info.json');
      const content = await fs.readFile(metadataPath, 'utf-8');
      return JSON.parse(content);
    } catch {
      // Metadata file not found or invalid, return empty object
      return {};
    }
  }

  /**
   * Get signal data for a specific time range
   */
  async getSignalData(
    tripId: string,
    signalNames: string[],
    startTime: number,
    endTime: number,
    maxPoints: number = 1000
  ): Promise<Record<string, DataPoint[]>> {
    const tripData = Array.from(this.cache.values()).find(trip => trip.id === tripId);
    if (!tripData) {
      throw new Error(`Trip not found: ${tripId}`);
    }

    const result: Record<string, DataPoint[]> = {};

    for (const signalName of signalNames) {
      const signal = tripData.signals[signalName];
      if (!signal) {
        console.warn(`Signal not found: ${signalName}`);
        continue;
      }

      // Filter data points by time range
      let filteredData = signal.data.filter(
        point => point.timestamp >= startTime && point.timestamp <= endTime
      );

      // Downsample if needed
      if (filteredData.length > maxPoints) {
        const step = Math.ceil(filteredData.length / maxPoints);
        filteredData = filteredData.filter((_, index) => index % step === 0);
      }

      result[signalName] = filteredData;
    }

    return result;
  }

  /**
   * Get signal value at a specific timestamp (with interpolation)
   */
  async getSignalValueAtTime(
    tripId: string,
    signalName: string,
    timestamp: number
  ): Promise<number | string | boolean | null> {
    const tripData = Array.from(this.cache.values()).find(trip => trip.id === tripId);
    if (!tripData) {
      throw new Error(`Trip not found: ${tripId}`);
    }

    const signal = tripData.signals[signalName];
    if (!signal) {
      return null;
    }

    const data = signal.data;
    if (data.length === 0) {
      return null;
    }

    // Find surrounding data points
    let beforeIndex = -1;
    let afterIndex = -1;

    for (let i = 0; i < data.length; i++) {
      if (data[i].timestamp <= timestamp) {
        beforeIndex = i;
      }
      if (data[i].timestamp >= timestamp && afterIndex === -1) {
        afterIndex = i;
        break;
      }
    }

    // Exact match
    if (beforeIndex !== -1 && data[beforeIndex].timestamp === timestamp) {
      return data[beforeIndex].value;
    }

    // Interpolate for numeric values
    if (beforeIndex !== -1 && afterIndex !== -1 && 
        beforeIndex !== afterIndex && 
        signal.type === 'numeric') {
      
      const before = data[beforeIndex];
      const after = data[afterIndex];
      
      if (typeof before.value === 'number' && typeof after.value === 'number') {
        const ratio = (timestamp - before.timestamp) / (after.timestamp - before.timestamp);
        return before.value + (after.value - before.value) * ratio;
      }
    }

    // Return nearest value
    if (beforeIndex !== -1) {
      return data[beforeIndex].value;
    }
    if (afterIndex !== -1) {
      return data[afterIndex].value;
    }

    return null;
  }

  /**
   * Get available trips (scan data directory)
   */
  async getAvailableTrips(dataDir: string = 'data/trips'): Promise<string[]> {
    try {
      const fullPath = path.resolve(dataDir);
      const entries = await fs.readdir(fullPath, { withFileTypes: true });
      
      const tripDirs = entries
        .filter(entry => entry.isDirectory())
        .map(entry => path.join(dataDir, entry.name));

      // Filter directories that contain CSV files
      const validTrips: string[] = [];
      
      for (const tripDir of tripDirs) {
        try {
          const files = await fs.readdir(tripDir);
          const hasCsvFiles = files.some(file => file.endsWith('.csv'));
          if (hasCsvFiles) {
            validTrips.push(tripDir);
          }
        } catch {
          // Skip directories we can't read
        }
      }

      return validTrips;
    } catch {
      return [];
    }
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
    this.cacheExpiry.clear();
  }

  /**
   * Get signal units based on signal name
   */
  private getSignalUnits(signalName: string): string {
    const unitMap: Record<string, string> = {
      'vehicle_speed': 'km/h',
      'speed': 'km/h',
      'wheel_speed_fl': 'rpm',
      'wheel_speed_fr': 'rpm',
      'wheel_speed_rl': 'rpm',
      'wheel_speed_rr': 'rpm',
      'throttle_pedal': '%',
      'throttle': '%',
      'brake_pedal': '%',
      'brake': '%',
      'steering_wheel_angle': 'degrees',
      'steering': 'degrees',
      'gps_latitude': 'degrees',
      'gps_longitude': 'degrees',
      'latitude': 'degrees',
      'longitude': 'degrees',
      'acceleration': 'm/s²',
      'yaw_rate': 'degrees/s',
      'temperature': '°C',
      'pressure': 'bar',
      'voltage': 'V',
      'current': 'A'
    };
    
    return unitMap[signalName.toLowerCase()] || 'unknown';
  }

  /**
   * Get signal description based on signal name
   */
  private getSignalDescription(signalName: string): string {
    const descriptionMap: Record<string, string> = {
      'vehicle_speed': 'Vehicle speed from CAN bus',
      'speed': 'Vehicle speed',
      'wheel_speed_fl': 'Front left wheel speed',
      'wheel_speed_fr': 'Front right wheel speed',
      'wheel_speed_rl': 'Rear left wheel speed',
      'wheel_speed_rr': 'Rear right wheel speed',
      'throttle_pedal': 'Throttle pedal position',
      'brake_pedal': 'Brake pedal position',
      'steering_wheel_angle': 'Steering wheel angle',
      'gps_latitude': 'GPS latitude coordinate',
      'gps_longitude': 'GPS longitude coordinate',
      'acceleration': 'Vehicle acceleration',
      'yaw_rate': 'Vehicle yaw rate'
    };
    
    return descriptionMap[signalName.toLowerCase()] || `${signalName} signal`;
  }
}

// Export singleton instance
export const dataAdapter = new DataAdapter();