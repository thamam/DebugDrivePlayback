/**
 * Simple Widget Registry - Replaces complex widget engine with React components
 * Reduces 813 lines of complexity to simple component registration
 */
import React from 'react';

export interface SimpleWidget {
  id: string;
  name: string;
  category: 'visualization' | 'analysis' | 'export';
  component: React.ComponentType<any>;
  defaultProps?: Record<string, any>;
}

class SimpleWidgetRegistry {
  private widgets = new Map<string, SimpleWidget>();

  register(widget: SimpleWidget) {
    this.widgets.set(widget.id, widget);
  }

  get(id: string): SimpleWidget | undefined {
    return this.widgets.get(id);
  }

  getAll(): SimpleWidget[] {
    return Array.from(this.widgets.values());
  }

  getByCategory(category: SimpleWidget['category']): SimpleWidget[] {
    return this.getAll().filter(w => w.category === category);
  }
}

export const widgetRegistry = new SimpleWidgetRegistry();
