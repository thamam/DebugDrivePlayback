/**
 * Safe Expression Evaluator - Replace dangerous eval() usage
 */

export interface FilterCondition {
  field: string;
  operator: 'equals' | 'greater' | 'less' | 'contains' | 'startsWith' | 'endsWith' | 'between';
  value: any;
  value2?: any; // For 'between' operator
}

export interface TransformOperation {
  field: string;
  operation: 'multiply' | 'add' | 'subtract' | 'divide' | 'round' | 'abs' | 'uppercase' | 'lowercase';
  value?: number;
}

export class SafeExpressionEvaluator {
  /**
   * Safely evaluate filter conditions without eval()
   */
  evaluateFilter(item: any, condition: FilterCondition): boolean {
    const { field, operator, value, value2 } = condition;
    const itemValue = this.getNestedValue(item, field);

    switch (operator) {
      case 'equals':
        return itemValue === value;
      
      case 'greater':
        return typeof itemValue === 'number' && typeof value === 'number' 
          ? itemValue > value 
          : String(itemValue) > String(value);
      
      case 'less':
        return typeof itemValue === 'number' && typeof value === 'number' 
          ? itemValue < value 
          : String(itemValue) < String(value);
      
      case 'contains':
        return String(itemValue).toLowerCase().includes(String(value).toLowerCase());
      
      case 'startsWith':
        return String(itemValue).toLowerCase().startsWith(String(value).toLowerCase());
      
      case 'endsWith':
        return String(itemValue).toLowerCase().endsWith(String(value).toLowerCase());
      
      case 'between':
        if (typeof itemValue === 'number' && typeof value === 'number' && typeof value2 === 'number') {
          return itemValue >= Math.min(value, value2) && itemValue <= Math.max(value, value2);
        }
        return false;
      
      default:
        console.warn(`Unknown filter operator: ${operator}`);
        return true;
    }
  }

  /**
   * Safely transform data without eval()
   */
  applyTransform(item: any, transform: TransformOperation): any {
    const { field, operation, value } = transform;
    const result = { ...item };
    const currentValue = this.getNestedValue(result, field);

    switch (operation) {
      case 'multiply':
        if (typeof currentValue === 'number' && typeof value === 'number') {
          this.setNestedValue(result, field, currentValue * value);
        }
        break;
      
      case 'add':
        if (typeof currentValue === 'number' && typeof value === 'number') {
          this.setNestedValue(result, field, currentValue + value);
        }
        break;
      
      case 'subtract':
        if (typeof currentValue === 'number' && typeof value === 'number') {
          this.setNestedValue(result, field, currentValue - value);
        }
        break;
      
      case 'divide':
        if (typeof currentValue === 'number' && typeof value === 'number' && value !== 0) {
          this.setNestedValue(result, field, currentValue / value);
        }
        break;
      
      case 'round':
        if (typeof currentValue === 'number') {
          const decimals = typeof value === 'number' ? value : 0;
          this.setNestedValue(result, field, Number(currentValue.toFixed(decimals)));
        }
        break;
      
      case 'abs':
        if (typeof currentValue === 'number') {
          this.setNestedValue(result, field, Math.abs(currentValue));
        }
        break;
      
      case 'uppercase':
        if (typeof currentValue === 'string') {
          this.setNestedValue(result, field, currentValue.toUpperCase());
        }
        break;
      
      case 'lowercase':
        if (typeof currentValue === 'string') {
          this.setNestedValue(result, field, currentValue.toLowerCase());
        }
        break;
      
      default:
        console.warn(`Unknown transform operation: ${operation}`);
    }

    return result;
  }

  /**
   * Parse simple condition expressions into FilterCondition objects
   */
  parseConditionExpression(expression: string): FilterCondition | null {
    // Simple parser for expressions like "speed > 50", "name contains 'test'"
    const patterns = [
      /(\w+)\s+(equals|==)\s+(.+)/,
      /(\w+)\s+(greater|>)\s+(\d+\.?\d*)/,
      /(\w+)\s+(less|<)\s+(\d+\.?\d*)/,
      /(\w+)\s+(contains)\s+['"](.+)['"]/,
      /(\w+)\s+(startsWith|starts_with)\s+['"](.+)['"]/,
      /(\w+)\s+(endsWith|ends_with)\s+['"](.+)['"]/,
      /(\w+)\s+(between)\s+(\d+\.?\d*)\s+and\s+(\d+\.?\d*)/
    ];

    for (const pattern of patterns) {
      const match = expression.match(pattern);
      if (match) {
        const [, field, operator, value, value2] = match;
        
        // Normalize operators
        const normalizedOperator = this.normalizeOperator(operator);
        
        return {
          field,
          operator: normalizedOperator,
          value: this.parseValue(value),
          value2: value2 ? this.parseValue(value2) : undefined
        };
      }
    }

    console.warn(`Could not parse expression: ${expression}`);
    return null;
  }

  /**
   * Parse transform expressions into TransformOperation objects
   */
  parseTransformExpression(expression: string): TransformOperation | null {
    const patterns = [
      /(\w+)\s*\*=\s*(\d+\.?\d*)/,  // field *= value
      /(\w+)\s*\+=\s*(\d+\.?\d*)/,  // field += value
      /(\w+)\s*-=\s*(\d+\.?\d*)/,   // field -= value
      /(\w+)\s*\/=\s*(\d+\.?\d*)/,  // field /= value
      /(\w+)\s*=\s*round\((\w+),?\s*(\d+)?\)/,  // field = round(field, decimals)
      /(\w+)\s*=\s*abs\((\w+)\)/,   // field = abs(field)
      /(\w+)\s*=\s*upper\((\w+)\)/,  // field = upper(field)
      /(\w+)\s*=\s*lower\((\w+)\)/   // field = lower(field)
    ];

    const operationMap = {
      '*=': 'multiply',
      '+=': 'add',
      '-=': 'subtract',
      '/=': 'divide',
      'round': 'round',
      'abs': 'abs',
      'upper': 'uppercase',
      'lower': 'lowercase'
    };

    for (const pattern of patterns) {
      const match = expression.match(pattern);
      if (match) {
        const [fullMatch, field] = match;
        
        if (fullMatch.includes('*=')) {
          return { field, operation: 'multiply', value: parseFloat(match[2]) };
        } else if (fullMatch.includes('+=')) {
          return { field, operation: 'add', value: parseFloat(match[2]) };
        } else if (fullMatch.includes('-=')) {
          return { field, operation: 'subtract', value: parseFloat(match[2]) };
        } else if (fullMatch.includes('/=')) {
          return { field, operation: 'divide', value: parseFloat(match[2]) };
        } else if (fullMatch.includes('round')) {
          return { field, operation: 'round', value: match[3] ? parseInt(match[3]) : 0 };
        } else if (fullMatch.includes('abs')) {
          return { field, operation: 'abs' };
        } else if (fullMatch.includes('upper')) {
          return { field, operation: 'uppercase' };
        } else if (fullMatch.includes('lower')) {
          return { field, operation: 'lowercase' };
        }
      }
    }

    console.warn(`Could not parse transform expression: ${expression}`);
    return null;
  }

  private normalizeOperator(operator: string): FilterCondition['operator'] {
    switch (operator.toLowerCase()) {
      case '==':
      case 'equals':
        return 'equals';
      case '>':
      case 'greater':
        return 'greater';
      case '<':
      case 'less':
        return 'less';
      case 'contains':
        return 'contains';
      case 'starts_with':
      case 'startswith':
        return 'startsWith';
      case 'ends_with':
      case 'endswith':
        return 'endsWith';
      case 'between':
        return 'between';
      default:
        return 'equals';
    }
  }

  private parseValue(value: string): any {
    // Remove quotes if present
    if ((value.startsWith('"') && value.endsWith('"')) || 
        (value.startsWith("'") && value.endsWith("'"))) {
      return value.slice(1, -1);
    }
    
    // Try to parse as number
    const numValue = parseFloat(value);
    if (!isNaN(numValue) && isFinite(numValue)) {
      return numValue;
    }
    
    // Try to parse as boolean
    if (value.toLowerCase() === 'true') return true;
    if (value.toLowerCase() === 'false') return false;
    
    return value;
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => 
      current && current[key] !== undefined ? current[key] : undefined, obj
    );
  }

  private setNestedValue(obj: any, path: string, value: any): void {
    const keys = path.split('.');
    const lastKey = keys.pop()!;
    const target = keys.reduce((current, key) => {
      if (!current[key]) current[key] = {};
      return current[key];
    }, obj);
    target[lastKey] = value;
  }
}

export const safeEvaluator = new SafeExpressionEvaluator();