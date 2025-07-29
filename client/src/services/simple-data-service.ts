/**
 * Simple Data Service - Replaces complex signal fetching with straightforward API
 * Removes caching complexity and pre-fetching for now
 */

const BASE_TIMESTAMP_OFFSET = 1752570362.062682;

export class SimpleDataService {
  private static cache = new Map<number, any>();

  static async getSignalsAtTime(currentTime: number): Promise<any> {
    const roundedTime = Math.round(currentTime * 10) / 10;
    
    // Check cache first
    if (this.cache.has(roundedTime)) {
      return this.cache.get(roundedTime);
    }

    try {
      const absoluteTime = currentTime + BASE_TIMESTAMP_OFFSET;
      
      const response = await fetch('/api/python/data/timestamp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          timestamp: absoluteTime,
          signals: ['speed', 'steering', 'brake', 'throttle', 'driving_mode']
        }),
      });
      
      if (response.ok) {
        const signalData = await response.json();
        
        // Simple cache with size limit
        if (this.cache.size > 100) {
          const firstKey = this.cache.keys().next().value;
          if (firstKey !== undefined) {
            this.cache.delete(firstKey);
          }
        }
        
        this.cache.set(roundedTime, signalData);
        return signalData;
      }
    } catch (error) {
      console.error('Failed to fetch signal data:', error);
    }
    
    return null;
  }

  static clearCache() {
    this.cache.clear();
  }
}
