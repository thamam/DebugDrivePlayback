/**
 * Widget Marketplace - Advanced widget distribution and management
 */

import type { AdvancedWidgetDefinition } from './widget-engine-v3';

export interface MarketplaceWidget {
  id: string;
  name: string;
  description: string;
  author: string;
  version: string;
  category: string;
  tags: string[];
  rating: number;
  downloads: number;
  screenshots: string[];
  documentation: string;
  sourceUrl?: string;
  licenseType: 'MIT' | 'Apache-2.0' | 'GPL-3.0' | 'Proprietary';
  pricing: {
    type: 'free' | 'paid' | 'subscription';
    price?: number;
    currency?: string;
  };
  compatibility: {
    minEngineVersion: string;
    maxEngineVersion?: string;
    requiredFeatures: string[];
  };
  definition: AdvancedWidgetDefinition;
  manifest: WidgetManifest;
}

export interface WidgetManifest {
  name: string;
  version: string;
  description: string;
  main: string;
  dependencies: Record<string, string>;
  devDependencies?: Record<string, string>;
  scripts?: Record<string, string>;
  keywords: string[];
  author: string;
  license: string;
  repository?: {
    type: string;
    url: string;
  };
  bugs?: {
    url: string;
  };
  homepage?: string;
}

export interface WidgetInstallation {
  widgetId: string;
  version: string;
  installedAt: Date;
  isActive: boolean;
  configuration?: Record<string, any>;
}

/**
 * Widget Marketplace Manager
 */
export class WidgetMarketplace {
  private baseUrl = '/api/marketplace';
  private installedWidgets: Map<string, WidgetInstallation> = new Map();
  private cache: Map<string, MarketplaceWidget[]> = new Map();

  constructor() {
    this.loadInstalledWidgets();
  }

  /**
   * Search widgets in marketplace
   */
  async searchWidgets(query: {
    search?: string;
    category?: string;
    tags?: string[];
    author?: string;
    priceType?: 'free' | 'paid' | 'subscription';
    sortBy?: 'name' | 'rating' | 'downloads' | 'updated';
    sortOrder?: 'asc' | 'desc';
    limit?: number;
    offset?: number;
  }): Promise<{ widgets: MarketplaceWidget[]; total: number }> {
    const cacheKey = JSON.stringify(query);
    
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey)!;
      return { widgets: cached, total: cached.length };
    }

    try {
      const params = new URLSearchParams();
      Object.entries(query).forEach(([key, value]) => {
        if (value !== undefined) {
          if (Array.isArray(value)) {
            value.forEach(v => params.append(key, v.toString()));
          } else {
            params.append(key, value.toString());
          }
        }
      });

      const response = await fetch(`${this.baseUrl}/search?${params}`);
      if (!response.ok) {
        throw new Error(`Marketplace search failed: ${response.statusText}`);
      }

      const result = await response.json();
      this.cache.set(cacheKey, result.widgets);
      
      return result;
    } catch (error) {
      console.error('Failed to search marketplace:', error);
      return { widgets: this.getFallbackWidgets(), total: 0 };
    }
  }

  /**
   * Get widget details
   */
  async getWidget(widgetId: string): Promise<MarketplaceWidget | null> {
    try {
      const response = await fetch(`${this.baseUrl}/widgets/${widgetId}`);
      if (!response.ok) {
        throw new Error(`Failed to get widget: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to get widget details:', error);
      return null;
    }
  }

  /**
   * Install widget from marketplace
   */
  async installWidget(widgetId: string, version?: string): Promise<boolean> {
    try {
      const widget = await this.getWidget(widgetId);
      if (!widget) {
        throw new Error(`Widget not found: ${widgetId}`);
      }

      // Check compatibility
      await this.checkCompatibility(widget);

      // Download and install
      const response = await fetch(`${this.baseUrl}/install`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          widgetId,
          version: version || widget.version
        })
      });

      if (!response.ok) {
        throw new Error(`Installation failed: ${response.statusText}`);
      }

      // Register installation
      const installation: WidgetInstallation = {
        widgetId,
        version: version || widget.version,
        installedAt: new Date(),
        isActive: true
      };

      this.installedWidgets.set(widgetId, installation);
      await this.saveInstalledWidgets();

      console.log(`Widget ${widgetId} installed successfully`);
      return true;
    } catch (error) {
      console.error('Widget installation failed:', error);
      return false;
    }
  }

  /**
   * Uninstall widget
   */
  async uninstallWidget(widgetId: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/uninstall`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ widgetId })
      });

      if (!response.ok) {
        throw new Error(`Uninstallation failed: ${response.statusText}`);
      }

      this.installedWidgets.delete(widgetId);
      await this.saveInstalledWidgets();

      console.log(`Widget ${widgetId} uninstalled successfully`);
      return true;
    } catch (error) {
      console.error('Widget uninstallation failed:', error);
      return false;
    }
  }

  /**
   * Update widget to latest version
   */
  async updateWidget(widgetId: string): Promise<boolean> {
    try {
      const widget = await this.getWidget(widgetId);
      if (!widget) {
        throw new Error(`Widget not found: ${widgetId}`);
      }

      const installation = this.installedWidgets.get(widgetId);
      if (!installation) {
        throw new Error(`Widget not installed: ${widgetId}`);
      }

      if (installation.version === widget.version) {
        console.log(`Widget ${widgetId} is already up to date`);
        return true;
      }

      // Uninstall old version and install new
      await this.uninstallWidget(widgetId);
      return await this.installWidget(widgetId, widget.version);
    } catch (error) {
      console.error('Widget update failed:', error);
      return false;
    }
  }

  /**
   * Get installed widgets
   */
  getInstalledWidgets(): WidgetInstallation[] {
    return Array.from(this.installedWidgets.values());
  }

  /**
   * Check for widget updates
   */
  async checkForUpdates(): Promise<Array<{ widgetId: string; currentVersion: string; latestVersion: string }>> {
    const updates: Array<{ widgetId: string; currentVersion: string; latestVersion: string }> = [];

    for (const [widgetId, installation] of this.installedWidgets.entries()) {
      try {
        const widget = await this.getWidget(widgetId);
        if (widget && widget.version !== installation.version) {
          updates.push({
            widgetId,
            currentVersion: installation.version,
            latestVersion: widget.version
          });
        }
      } catch (error) {
        console.error(`Failed to check updates for ${widgetId}:`, error);
      }
    }

    return updates;
  }

  /**
   * Publish widget to marketplace
   */
  async publishWidget(widget: MarketplaceWidget): Promise<boolean> {
    try {
      // Validate widget
      await this.validateWidget(widget);

      const response = await fetch(`${this.baseUrl}/publish`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(widget)
      });

      if (!response.ok) {
        throw new Error(`Publishing failed: ${response.statusText}`);
      }

      console.log(`Widget ${widget.id} published successfully`);
      return true;
    } catch (error) {
      console.error('Widget publishing failed:', error);
      return false;
    }
  }

  /**
   * Rate and review widget
   */
  async rateWidget(widgetId: string, rating: number, review?: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/widgets/${widgetId}/rate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ rating, review })
      });

      if (!response.ok) {
        throw new Error(`Rating failed: ${response.statusText}`);
      }

      return true;
    } catch (error) {
      console.error('Widget rating failed:', error);
      return false;
    }
  }

  // Private methods

  private async loadInstalledWidgets(): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/installed`);
      if (response.ok) {
        const installations = await response.json();
        installations.forEach((installation: WidgetInstallation) => {
          this.installedWidgets.set(installation.widgetId, {
            ...installation,
            installedAt: new Date(installation.installedAt)
          });
        });
      }
    } catch (error) {
      console.warn('Failed to load installed widgets:', error);
    }
  }

  private async saveInstalledWidgets(): Promise<void> {
    try {
      const installations = Array.from(this.installedWidgets.values());
      await fetch(`${this.baseUrl}/installed`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(installations)
      });
    } catch (error) {
      console.warn('Failed to save installed widgets:', error);
    }
  }

  private async checkCompatibility(widget: MarketplaceWidget): Promise<void> {
    const { compatibility } = widget;
    
    // Check engine version
    const currentVersion = '3.0.0'; // Current widget engine version
    
    if (!this.isVersionCompatible(currentVersion, compatibility.minEngineVersion, compatibility.maxEngineVersion)) {
      throw new Error(`Widget requires engine version ${compatibility.minEngineVersion}${compatibility.maxEngineVersion ? ` - ${compatibility.maxEngineVersion}` : '+'}, but current version is ${currentVersion}`);
    }

    // Check required features
    const availableFeatures = ['persistence', 'communication', 'monitoring', 'streaming'];
    const missingFeatures = compatibility.requiredFeatures.filter(
      feature => !availableFeatures.includes(feature)
    );

    if (missingFeatures.length > 0) {
      throw new Error(`Widget requires unavailable features: ${missingFeatures.join(', ')}`);
    }
  }

  private isVersionCompatible(current: string, min: string, max?: string): boolean {
    const compareVersions = (a: string, b: string): number => {
      const [aMajor, aMinor, aPatch] = a.split('.').map(Number);
      const [bMajor, bMinor, bPatch] = b.split('.').map(Number);

      if (aMajor !== bMajor) return aMajor - bMajor;
      if (aMinor !== bMinor) return aMinor - bMinor;
      return aPatch - bPatch;
    };

    const minCheck = compareVersions(current, min) >= 0;
    const maxCheck = !max || compareVersions(current, max) <= 0;

    return minCheck && maxCheck;
  }

  private async validateWidget(widget: MarketplaceWidget): Promise<void> {
    // Validate widget structure
    if (!widget.id || !widget.name || !widget.definition) {
      throw new Error('Widget missing required fields');
    }

    // Validate manifest
    if (!widget.manifest || !widget.manifest.name || !widget.manifest.version) {
      throw new Error('Widget manifest incomplete');
    }

    // Validate definition
    if (!widget.definition.implementation) {
      throw new Error('Widget definition missing implementation');
    }

    // Security checks
    if (widget.definition.permissions?.includes('system-admin')) {
      throw new Error('Widgets cannot request system admin permissions');
    }
  }

  private getFallbackWidgets(): MarketplaceWidget[] {
    // Return some built-in demo widgets when marketplace is unavailable
    return [
      {
        id: 'demo-chart',
        name: 'Demo Chart Widget',
        description: 'A simple demonstration chart widget',
        author: 'Debug Drive Team',
        version: '1.0.0',
        category: 'visualization',
        tags: ['chart', 'demo'],
        rating: 4.5,
        downloads: 100,
        screenshots: [],
        documentation: 'Simple chart widget for demonstration',
        licenseType: 'MIT',
        pricing: { type: 'free' },
        compatibility: {
          minEngineVersion: '1.0.0',
          requiredFeatures: []
        },
        definition: {} as AdvancedWidgetDefinition,
        manifest: {
          name: 'demo-chart',
          version: '1.0.0',
          description: 'Demo chart widget',
          main: 'index.js',
          dependencies: {},
          keywords: ['chart', 'demo'],
          author: 'Debug Drive Team',
          license: 'MIT'
        }
      }
    ];
  }
}

// Global marketplace instance
export const widgetMarketplace = new WidgetMarketplace();