import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { X, ArrowLeft, ArrowRight, SkipForward } from 'lucide-react';
import { useTour } from './tour-provider';

interface TooltipPosition {
  top: number;
  left: number;
  width: number;
  height: number;
}

export function TourTooltip() {
  const { isActive, currentStep, steps, nextStep, prevStep, skipTour } = useTour();
  const [position, setPosition] = useState<TooltipPosition | null>(null);
  const [arrowClass, setArrowClass] = useState('');

  useEffect(() => {
    if (!isActive || !steps[currentStep]) return;

    const updatePosition = () => {
      const step = steps[currentStep];
      const target = document.querySelector(step.target) as HTMLElement;
      
      if (!target) return;

      const rect = target.getBoundingClientRect();
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;

      let top = rect.top + scrollTop;
      let left = rect.left + scrollLeft;
      
      const placement = step.placement || 'bottom';
      const tooltipWidth = 320;
      const tooltipHeight = 200;
      const offset = 10;

      switch (placement) {
        case 'top':
          top -= tooltipHeight + offset;
          left += (rect.width - tooltipWidth) / 2;
          setArrowClass('arrow-bottom');
          break;
        case 'bottom':
          top += rect.height + offset;
          left += (rect.width - tooltipWidth) / 2;
          setArrowClass('arrow-top');
          break;
        case 'left':
          left -= tooltipWidth + offset;
          top += (rect.height - tooltipHeight) / 2;
          setArrowClass('arrow-right');
          break;
        case 'right':
          left += rect.width + offset;
          top += (rect.height - tooltipHeight) / 2;
          setArrowClass('arrow-left');
          break;
      }

      // Keep tooltip within viewport
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      
      if (left < 10) left = 10;
      if (left + tooltipWidth > viewportWidth - 10) left = viewportWidth - tooltipWidth - 10;
      if (top < 10) top = 10;
      if (top + tooltipHeight > viewportHeight - 10) top = viewportHeight - tooltipHeight - 10;

      setPosition({ top, left, width: tooltipWidth, height: tooltipHeight });

      // Highlight target element
      target.style.position = 'relative';
      target.style.zIndex = '9999';
      target.style.boxShadow = '0 0 0 4px rgba(59, 130, 246, 0.3), 0 0 20px rgba(59, 130, 246, 0.2)';
      target.style.borderRadius = '8px';
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition);

    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition);
      
      // Remove highlight from all elements
      document.querySelectorAll('[style*="z-index: 9999"]').forEach(el => {
        const element = el as HTMLElement;
        element.style.position = '';
        element.style.zIndex = '';
        element.style.boxShadow = '';
        element.style.borderRadius = '';
      });
    };
  }, [isActive, currentStep, steps]);

  if (!isActive || !steps[currentStep] || !position) return null;

  const step = steps[currentStep];
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === steps.length - 1;

  return (
    <>
      {/* Backdrop overlay */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-[9998]"
        onClick={skipTour}
      />
      
      {/* Tooltip */}
      <Card 
        className="fixed z-[10000] shadow-xl border-2 border-primary-500 bg-white"
        style={{
          top: position.top,
          left: position.left,
          width: position.width,
          maxHeight: position.height
        }}
      >
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold text-primary-700">
              {step.title}
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={skipTour}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="pt-0">
          <p className="text-slate-600 mb-4 leading-relaxed">
            {step.content}
          </p>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-slate-500">
                {currentStep + 1} of {steps.length}
              </span>
              <div className="flex space-x-1">
                {steps.map((_, index) => (
                  <div
                    key={index}
                    className={`w-2 h-2 rounded-full ${
                      index === currentStep 
                        ? 'bg-primary-500' 
                        : index < currentStep 
                          ? 'bg-primary-300' 
                          : 'bg-slate-200'
                    }`}
                  />
                ))}
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={skipTour}
                className="text-slate-600"
              >
                <SkipForward className="h-4 w-4 mr-1" />
                Skip
              </Button>
              
              {!isFirstStep && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={prevStep}
                >
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  Back
                </Button>
              )}
              
              <Button
                size="sm"
                onClick={nextStep}
                className="bg-primary-600 hover:bg-primary-700"
              >
                {isLastStep ? 'Finish' : 'Next'}
                {!isLastStep && <ArrowRight className="h-4 w-4 ml-1" />}
              </Button>
            </div>
          </div>
        </CardContent>
        
        {/* Arrow pointer */}
        <div className={`absolute ${arrowClass}`} />
      </Card>
      
      <style>{`
        .arrow-top {
          top: -8px;
          left: 50%;
          transform: translateX(-50%);
          width: 0;
          height: 0;
          border-left: 8px solid transparent;
          border-right: 8px solid transparent;
          border-bottom: 8px solid white;
        }
        .arrow-bottom {
          bottom: -8px;
          left: 50%;
          transform: translateX(-50%);
          width: 0;
          height: 0;
          border-left: 8px solid transparent;
          border-right: 8px solid transparent;
          border-top: 8px solid white;
        }
        .arrow-left {
          left: -8px;
          top: 50%;
          transform: translateY(-50%);
          width: 0;
          height: 0;
          border-top: 8px solid transparent;
          border-bottom: 8px solid transparent;
          border-right: 8px solid white;
        }
        .arrow-right {
          right: -8px;
          top: 50%;
          transform: translateY(-50%);
          width: 0;
          height: 0;
          border-top: 8px solid transparent;
          border-bottom: 8px solid transparent;
          border-left: 8px solid white;
        }
      `}</style>
    </>
  );
}