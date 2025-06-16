import React from 'react';
import { Button } from '@/components/ui/button';
import { HelpCircle } from 'lucide-react';
import { useTour } from './tour-provider';

export function HelpButton() {
  const { startTour } = useTour();

  const startHelpTour = () => {
    // Clear the tour completion flag to allow re-running
    localStorage.removeItem('tour-completed');
    
    const helpSteps = [
      {
        id: 'welcome-back',
        target: 'body',
        title: 'Welcome to the Help Tour',
        content: 'This tour will guide you through the main features of PIPPS Maker Calc. You can restart this tour anytime by clicking the help button.',
        placement: 'bottom' as const
      },
      {
        id: 'dashboard-stats',
        target: '[data-tour="dashboard-stats"]',
        title: 'Dashboard Metrics',
        content: 'Monitor your business at a glance with key metrics including total materials, active formulations, vendor count, and profit margins.',
        placement: 'bottom' as const
      },
      {
        id: 'materials-preview',
        target: '[data-tour="materials-preview"]',
        title: 'Materials Management',
        content: 'View and manage your raw materials. Each material shows cost per unit, total quantity, and vendor information. Materials are the foundation of your formulations.',
        placement: 'top' as const
      },
      {
        id: 'navigation',
        target: '[data-tour="navigation"]',
        title: 'Navigation Menu',
        content: 'Access all features through the sidebar: Materials for ingredients, Formulations for recipes, Vendors for suppliers, and Import/Export for data management.',
        placement: 'right' as const
      },
      {
        id: 'refresh-data',
        target: '[data-tour="refresh-button"]',
        title: 'Data Refresh',
        content: 'Keep your data up-to-date with the refresh button. This updates all information and reflects any cost changes in your formulations.',
        placement: 'left' as const
      }
    ];
    
    startTour(helpSteps);
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={startHelpTour}
      className="text-slate-600 hover:text-slate-900"
      title="Start guided tour"
    >
      <HelpCircle className="h-4 w-4" />
    </Button>
  );
}