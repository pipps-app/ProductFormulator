import React, { createContext, useContext, useState, useEffect } from 'react';
import { useUser } from '@/hooks/use-user';

interface TourStep {
  id: string;
  target: string;
  title: string;
  content: string;
  placement?: 'top' | 'bottom' | 'left' | 'right';
  showNext?: boolean;
  showPrev?: boolean;
  action?: () => void;
}

interface TourContextType {
  isActive: boolean;
  currentStep: number;
  steps: TourStep[];
  startTour: (tourSteps: TourStep[]) => void;
  nextStep: () => void;
  prevStep: () => void;
  skipTour: () => void;
  completeTour: () => void;
}

const TourContext = createContext<TourContextType | null>(null);

export function useTour() {
  const context = useContext(TourContext);
  if (!context) {
    throw new Error('useTour must be used within a TourProvider');
  }
  return context;
}

export function TourProvider({ children }: { children: React.ReactNode }) {
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [steps, setSteps] = useState<TourStep[]>([]);
  const { data: user } = useUser();

  // Auto-start tour disabled - only manual start through Help Tour button

  const startTour = (tourSteps: TourStep[]) => {
    setSteps(tourSteps);
    setCurrentStep(0);
    setIsActive(true);
    document.body.style.overflow = 'hidden';
  };

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      completeTour();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const skipTour = () => {
    setIsActive(false);
    document.body.style.overflow = 'auto';
    localStorage.setItem('tour-completed', 'true');
  };

  const completeTour = () => {
    setIsActive(false);
    document.body.style.overflow = 'auto';
    localStorage.setItem('tour-completed', 'true');
  };

  const startDashboardTour = () => {
    const dashboardSteps: TourStep[] = [
      {
        id: 'welcome',
        target: 'body',
        title: 'Welcome to PIPPS Maker Calc!',
        content: 'This guided tour will show you the key features to help you manage your product formulations and costs effectively.',
        placement: 'bottom'
      },
      {
        id: 'dashboard-stats',
        target: '[data-tour="dashboard-stats"]',
        title: 'Dashboard Overview',
        content: 'Your dashboard shows important metrics like total materials, active formulations, and profit margins at a glance.',
        placement: 'bottom'
      },
      {
        id: 'materials-preview',
        target: '[data-tour="materials-preview"]',
        title: 'Recent Materials',
        content: 'Here you can see your recently added materials with their costs and stock information. Materials are the building blocks of your formulations.',
        placement: 'top'
      },
      {
        id: 'navigation',
        target: '[data-tour="navigation"]',
        title: 'Main Navigation',
        content: 'Use these menu items to navigate between Materials, Formulations, Vendors, and other features.',
        placement: 'right'
      },
      {
        id: 'refresh-button',
        target: '[data-tour="refresh-button"]',
        title: 'Refresh Data',
        content: 'Click the refresh button to update your data and see the latest changes across all screens.',
        placement: 'left'
      }
    ];
    startTour(dashboardSteps);
  };

  return (
    <TourContext.Provider
      value={{
        isActive,
        currentStep,
        steps,
        startTour,
        nextStep,
        prevStep,
        skipTour,
        completeTour
      }}
    >
      {children}
    </TourContext.Provider>
  );
}