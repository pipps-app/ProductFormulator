import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Circle, ArrowRight, X } from 'lucide-react';
import { useTour } from './tour-provider';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  action?: () => void;
}

export function FirstTimeGuide() {
  const [isVisible, setIsVisible] = useState(false);
  const [steps, setSteps] = useState<OnboardingStep[]>([]);
  const { startTour } = useTour();

  useEffect(() => {
    const hasSeenGuide = localStorage.getItem('first-time-guide-seen');
    if (!hasSeenGuide) {
      setIsVisible(true);
      initializeSteps();
    }
  }, []);

  const initializeSteps = () => {
    const initialSteps: OnboardingStep[] = [
      {
        id: 'take-tour',
        title: 'Take the guided tour',
        description: 'Learn the basics with our interactive walkthrough',
        completed: !!localStorage.getItem('tour-completed'),
        action: () => {
          localStorage.removeItem('tour-completed');
          startDashboardTour();
        }
      },
      {
        id: 'add-material',
        title: 'Add your first material',
        description: 'Create a raw material to use in formulations',
        completed: false
      },
      {
        id: 'create-formulation',
        title: 'Create a formulation',
        description: 'Build your first product recipe',
        completed: false
      },
      {
        id: 'add-vendor',
        title: 'Add a vendor',
        description: 'Track your suppliers for better cost management',
        completed: false
      }
    ];
    setSteps(initialSteps);
  };

  const startDashboardTour = () => {
    const tourSteps = [
      {
        id: 'welcome',
        target: 'body',
        title: 'Welcome to Pipps Maker Calc!',
        content: 'This is your product formulation and cost management platform. Let\'s explore the key features together.',
        placement: 'bottom' as const
      },
      {
        id: 'dashboard-overview',
        target: '[data-tour="dashboard-stats"]',
        title: 'Business Overview',
        content: 'Monitor your business metrics including materials count, active formulations, vendor relationships, and profit margins.',
        placement: 'bottom' as const
      },
      {
        id: 'materials-section',
        target: '[data-tour="materials-preview"]',
        title: 'Materials Management',
        content: 'Materials are the ingredients for your products. Track costs, quantities, and supplier information here.',
        placement: 'top' as const
      },
      {
        id: 'navigation-menu',
        target: '[data-tour="navigation"]',
        title: 'Main Navigation',
        content: 'Access all features: Materials for ingredients, Formulations for recipes, Vendors for suppliers, and more.',
        placement: 'right' as const
      },
      {
        id: 'refresh-feature',
        target: '[data-tour="refresh-button"]',
        title: 'Keep Data Fresh',
        content: 'Use refresh to update your data. Formulation costs automatically update when material prices change.',
        placement: 'left' as const
      }
    ];
    
    startTour(tourSteps);
    markStepCompleted('take-tour');
  };

  const markStepCompleted = (stepId: string) => {
    setSteps(prev => prev.map(step => 
      step.id === stepId ? { ...step, completed: true } : step
    ));
    localStorage.setItem(`onboarding-${stepId}`, 'completed');
  };

  const dismissGuide = () => {
    setIsVisible(false);
    localStorage.setItem('first-time-guide-seen', 'true');
  };

  const completedSteps = steps.filter(step => step.completed).length;
  const progressPercentage = (completedSteps / steps.length) * 100;

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 w-80">
      <Card className="shadow-xl border-2 border-primary-200 bg-gradient-to-br from-primary-50 to-primary-100">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold text-primary-800">
              Getting Started
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={dismissGuide}
              className="h-8 w-8 p-0 text-primary-600 hover:text-primary-800"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="w-full bg-primary-200 rounded-full h-2">
            <div 
              className="bg-primary-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
          <p className="text-sm text-primary-700">
            {completedSteps} of {steps.length} steps completed
          </p>
        </CardHeader>
        
        <CardContent className="space-y-3">
          {steps.map((step) => (
            <div 
              key={step.id}
              className={`flex items-start space-x-3 p-3 rounded-lg transition-colors ${
                step.completed 
                  ? 'bg-green-50 border border-green-200' 
                  : 'bg-white border border-primary-200 hover:bg-primary-50'
              }`}
            >
              <div className="mt-0.5">
                {step.completed ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <Circle className="h-5 w-5 text-primary-400" />
                )}
              </div>
              
              <div className="flex-1">
                <h4 className={`font-medium text-sm ${
                  step.completed ? 'text-green-800' : 'text-slate-900'
                }`}>
                  {step.title}
                </h4>
                <p className={`text-xs mt-1 ${
                  step.completed ? 'text-green-600' : 'text-slate-600'
                }`}>
                  {step.description}
                </p>
                
                {!step.completed && step.action && (
                  <Button
                    size="sm"
                    onClick={step.action}
                    className="mt-2 h-7 text-xs bg-primary-600 hover:bg-primary-700"
                  >
                    Start
                    <ArrowRight className="h-3 w-3 ml-1" />
                  </Button>
                )}
              </div>
            </div>
          ))}
          
          <div className="pt-2 border-t border-primary-200">
            <p className="text-xs text-primary-600 text-center">
              Complete these steps to get the most out of Pipps Maker Calc
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}