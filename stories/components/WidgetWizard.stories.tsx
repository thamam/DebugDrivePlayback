import type { Meta, StoryObj } from '@storybook/react';
import WidgetWizard from '../../client/src/components/widget-wizard/widget-wizard';

const meta: Meta<typeof WidgetWizard> = {
  title: 'Components/WidgetWizard',
  component: WidgetWizard,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Widget creation wizard that allows users to create custom data visualization and analysis widgets.',
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const TemplateSelection: Story = {
  parameters: {
    docs: {
      description: {
        story: 'The first step of the wizard showing available widget templates.',
      },
    },
  },
  play: async ({ canvasElement }) => {
    // Auto-open the dialog for demonstration
    const button = canvasElement.querySelector('button');
    if (button) {
      button.click();
    }
  },
};

export const ConfigurationStep: Story = {
  parameters: {
    docs: {
      description: {
        story: 'The configuration step where users customize widget settings.',
      },
    },
  },
  play: async ({ canvasElement }) => {
    // Auto-open dialog and select a template
    const button = canvasElement.querySelector('button');
    if (button) {
      button.click();
    }
    
    // Wait a bit then click on a template card
    setTimeout(() => {
      const templateCard = canvasElement.querySelector('[role="dialog"] .cursor-pointer');
      if (templateCard) {
        (templateCard as HTMLElement).click();
      }
    }, 500);
  },
};

export const PreviewStep: Story = {
  parameters: {
    docs: {
      description: {
        story: 'The final preview step before creating the widget.',
      },
    },
  },
};