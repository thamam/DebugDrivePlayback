import { Activity, Map, Layers, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TabPanels } from './tab-panels';

interface VisualizationAreaProps {
  selectedTab: string;
  vehicleData: any[];
  activeSignals: Record<string, boolean>;
  currentTime: number;
  currentData: any;
  collisionViolations: Array<{ time: number; margin: number; severity: string }>;
  formatTime: (seconds: number) => string;
  onTabChange: (tab: string) => void;
}

export function VisualizationArea({
  selectedTab,
  vehicleData,
  activeSignals,
  currentTime,
  currentData,
  collisionViolations,
  formatTime,
  onTabChange
}: VisualizationAreaProps) {
  const tabs = [
    { id: 'temporal', label: 'Temporal Analysis', icon: Activity },
    { id: 'spatial', label: 'Spatial Analysis', icon: Map },
    { id: 'integrated', label: 'Integrated View', icon: Layers },
    { id: 'collision', label: 'Collision Analysis', icon: AlertTriangle }
  ];

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Tab Navigation */}
      <div className="dark-panel border-b px-4">
        <div className="flex space-x-1">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <Button
                key={tab.id}
                variant="ghost"
                onClick={() => onTabChange(tab.id)}
                className={`tab-button ${selectedTab === tab.id ? 'active' : ''}`}
              >
                <Icon size={16} className="mr-2" />
                {tab.label}
              </Button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      <TabPanels
        selectedTab={selectedTab}
        vehicleData={vehicleData}
        activeSignals={activeSignals}
        currentTime={currentTime}
        currentData={currentData}
        collisionViolations={collisionViolations}
        formatTime={formatTime}
      />
    </div>
  );
}
