/**
 * Integration tests for Widget Wizard
 * Tests the complete widget creation workflow
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import WidgetWizard from '../widget-wizard';
import { widgetEngine } from '../../../lib/widget-engine';

// Mock the widget engine
jest.mock('../../../lib/widget-engine', () => ({
  widgetEngine: {
    createWidget: jest.fn(),
    getDefinitions: jest.fn(),
    getInstances: jest.fn()
  }
}));

// Mock the widget templates
jest.mock('../../../lib/widget-templates', () => ({
  widgetTemplates: [
    {
      id: 'test-template',
      name: 'Test Template',
      category: 'visualization',
      inputs: [
        {
          name: 'test_input',
          type: 'signal',
          dataType: 'number',
          required: true,
          description: 'Test input'
        }
      ],
      outputs: [
        {
          name: 'test_output',
          type: 'chart',
          dataType: 'object',
          description: 'Test output'
        }
      ],
      configSchema: {
        testConfig: {
          type: 'string',
          default: 'test_value',
          description: 'Test configuration'
        },
        testBoolean: {
          type: 'boolean',
          default: true,
          description: 'Test boolean'
        },
        testSelect: {
          type: 'select',
          options: ['option1', 'option2'],
          default: 'option1',
          description: 'Test select'
        }
      }
    }
  ]
}));

describe('WidgetWizard', () => {
  const mockCreateWidget = widgetEngine.createWidget as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockCreateWidget.mockResolvedValue({
      id: 'test-instance',
      name: 'Test Widget',
      status: 'active'
    });
  });

  describe('Widget Template Selection', () => {
    it('should display available widget templates', () => {
      render(<WidgetWizard />);
      
      // Click to open the dialog
      fireEvent.click(screen.getByText('Add Widget'));
      
      // Check if template is displayed
      expect(screen.getByText('Test Template')).toBeInTheDocument();
      expect(screen.getByText('Test input')).toBeInTheDocument();
    });

    it('should allow template selection', () => {
      render(<WidgetWizard />);
      
      // Open dialog
      fireEvent.click(screen.getByText('Add Widget'));
      
      // Select template
      fireEvent.click(screen.getByText('Test Template'));
      
      // Should navigate to configuration step
      expect(screen.getByText('Configuration')).toBeInTheDocument();
    });

    it('should show template details correctly', () => {
      render(<WidgetWizard />);
      
      // Open dialog
      fireEvent.click(screen.getByText('Add Widget'));
      
      // Check template details
      expect(screen.getByText('Inputs:')).toBeInTheDocument();
      expect(screen.getByText('test_input')).toBeInTheDocument();
      expect(screen.getByText('Outputs:')).toBeInTheDocument();
      expect(screen.getByText('test_output')).toBeInTheDocument();
    });
  });

  describe('Widget Configuration', () => {
    beforeEach(() => {
      render(<WidgetWizard />);
      fireEvent.click(screen.getByText('Add Widget'));
      fireEvent.click(screen.getByText('Test Template'));
    });

    it('should display configuration fields', () => {
      expect(screen.getByText('Widget Name')).toBeInTheDocument();
      expect(screen.getByText('Test Configuration')).toBeInTheDocument();
      expect(screen.getByText('Test Boolean')).toBeInTheDocument();
      expect(screen.getByText('Test Select')).toBeInTheDocument();
    });

    it('should handle string configuration fields', () => {
      const input = screen.getByDisplayValue('test_value');
      fireEvent.change(input, { target: { value: 'updated_value' } });
      
      expect(input).toHaveValue('updated_value');
    });

    it('should handle boolean configuration fields', () => {
      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).toBeChecked(); // Default is true
      
      fireEvent.click(checkbox);
      expect(checkbox).not.toBeChecked();
    });

    it('should handle select configuration fields', () => {
      const select = screen.getByRole('combobox');
      fireEvent.click(select);
      
      fireEvent.click(screen.getByText('option2'));
      expect(select).toHaveTextContent('option2');
    });

    it('should allow widget name customization', () => {
      const nameInput = screen.getByDisplayValue('Test Template');
      fireEvent.change(nameInput, { target: { value: 'My Custom Widget' } });
      
      expect(nameInput).toHaveValue('My Custom Widget');
    });
  });

  describe('Widget Preview and Creation', () => {
    beforeEach(() => {
      render(<WidgetWizard />);
      fireEvent.click(screen.getByText('Add Widget'));
      fireEvent.click(screen.getByText('Test Template'));
      fireEvent.click(screen.getByText('Preview'));
    });

    it('should display widget preview', () => {
      expect(screen.getByText('Widget Preview')).toBeInTheDocument();
      expect(screen.getByText('Name:')).toBeInTheDocument();
      expect(screen.getByText('Template:')).toBeInTheDocument();
      expect(screen.getByText('Configuration:')).toBeInTheDocument();
    });

    it('should create widget on confirmation', async () => {
      fireEvent.click(screen.getByText('Create Widget'));
      
      await waitFor(() => {
        expect(mockCreateWidget).toHaveBeenCalledWith(
          'test-template',
          expect.stringMatching(/^widget_\d+_[a-z0-9]+$/),
          'Test Template',
          expect.objectContaining({
            testConfig: 'test_value',
            testBoolean: true,
            testSelect: 'option1'
          })
        );
      });
    });

    it('should handle widget creation errors', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      mockCreateWidget.mockRejectedValue(new Error('Creation failed'));
      
      fireEvent.click(screen.getByText('Create Widget'));
      
      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          'Error creating widget:',
          expect.any(Error)
        );
      });
      
      consoleErrorSpy.mockRestore();
    });

    it('should reset form after successful creation', async () => {
      fireEvent.click(screen.getByText('Create Widget'));
      
      await waitFor(() => {
        expect(mockCreateWidget).toHaveBeenCalled();
      });
      
      // Dialog should close (not visible)
      expect(screen.queryByText('Widget Preview')).not.toBeInTheDocument();
    });
  });

  describe('Navigation Between Steps', () => {
    beforeEach(() => {
      render(<WidgetWizard />);
      fireEvent.click(screen.getByText('Add Widget'));
      fireEvent.click(screen.getByText('Test Template'));
    });

    it('should navigate back to template selection', () => {
      fireEvent.click(screen.getByText('Back'));
      
      expect(screen.getByText('Test Template')).toBeInTheDocument();
      expect(screen.queryByText('Configuration')).not.toBeInTheDocument();
    });

    it('should navigate to preview step', () => {
      fireEvent.click(screen.getByText('Preview'));
      
      expect(screen.getByText('Widget Preview')).toBeInTheDocument();
    });

    it('should navigate back from preview to configuration', () => {
      fireEvent.click(screen.getByText('Preview'));
      fireEvent.click(screen.getByText('Back'));
      
      expect(screen.getByText('Configuration')).toBeInTheDocument();
      expect(screen.queryByText('Widget Preview')).not.toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    beforeEach(() => {
      render(<WidgetWizard />);
      fireEvent.click(screen.getByText('Add Widget'));
      fireEvent.click(screen.getByText('Test Template'));
    });

    it('should require widget name', () => {
      const nameInput = screen.getByDisplayValue('Test Template');
      fireEvent.change(nameInput, { target: { value: '' } });
      
      fireEvent.click(screen.getByText('Preview'));
      
      // Should still be on configuration step
      expect(screen.getByText('Configuration')).toBeInTheDocument();
    });

    it('should validate configuration fields', () => {
      // This would depend on specific validation rules
      // For now, just ensure the form doesn't break
      const nameInput = screen.getByDisplayValue('Test Template');
      expect(nameInput).toBeInTheDocument();
    });
  });
});