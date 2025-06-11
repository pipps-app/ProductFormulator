import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { X, HelpCircle, Lightbulb } from 'lucide-react';

interface TooltipData {
  id: string;
  title: string;
  content: string;
  trigger?: 'hover' | 'click' | 'auto';
  delay?: number;
  showOnce?: boolean;
}

interface ContextualTooltipProps {
  id: string;
  title: string;
  content: string;
  trigger?: 'hover' | 'click' | 'auto';
  delay?: number;
  showOnce?: boolean;
  children: React.ReactNode;
  className?: string;
}

export function ContextualTooltip({
  id,
  title,
  content,
  trigger = 'hover',
  delay = 500,
  showOnce = false,
  children,
  className = ''
}: ContextualTooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [hasBeenShown, setHasBeenShown] = useState(false);
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (showOnce) {
      const shown = localStorage.getItem(`tooltip-shown-${id}`);
      setHasBeenShown(!!shown);
    }
  }, [id, showOnce]);

  useEffect(() => {
    if (trigger === 'auto' && !hasBeenShown) {
      const timer = setTimeout(() => {
        setIsVisible(true);
        if (showOnce) {
          localStorage.setItem(`tooltip-shown-${id}`, 'true');
          setHasBeenShown(true);
        }
      }, delay);
      return () => clearTimeout(timer);
    }
  }, [trigger, delay, hasBeenShown, showOnce, id]);

  const handleMouseEnter = () => {
    if (trigger === 'hover' && (!showOnce || !hasBeenShown)) {
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, delay);
      setTimeoutId(timer);
    }
  };

  const handleMouseLeave = () => {
    if (trigger === 'hover') {
      if (timeoutId) {
        clearTimeout(timeoutId);
        setTimeoutId(null);
      }
      setIsVisible(false);
    }
  };

  const handleClick = () => {
    if (trigger === 'click' && (!showOnce || !hasBeenShown)) {
      setIsVisible(!isVisible);
    }
  };

  const handleClose = () => {
    setIsVisible(false);
    if (showOnce) {
      localStorage.setItem(`tooltip-shown-${id}`, 'true');
      setHasBeenShown(true);
    }
  };

  if (showOnce && hasBeenShown && trigger !== 'click') {
    return <>{children}</>;
  }

  return (
    <div 
      className={`relative inline-block ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
    >
      {children}
      
      {isVisible && (
        <>
          <div className="absolute z-50 w-80 mt-2 -ml-40 left-1/2">
            <Card className="shadow-lg border-2 border-amber-200 bg-amber-50">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <Lightbulb className="h-4 w-4 text-amber-600" />
                    <h4 className="font-semibold text-amber-800">{title}</h4>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClose}
                    className="h-6 w-6 p-0 text-amber-600 hover:text-amber-800"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
                <p className="text-sm text-amber-700 leading-relaxed">
                  {content}
                </p>
              </CardContent>
              
              {/* Arrow pointer */}
              <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                <div className="w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent border-b-amber-200"></div>
                <div className="w-0 h-0 border-l-3 border-r-3 border-b-3 border-transparent border-b-amber-50 absolute -top-px left-1/2 transform -translate-x-1/2"></div>
              </div>
            </Card>
          </div>
          
          {/* Backdrop for click-outside */}
          {trigger === 'click' && (
            <div 
              className="fixed inset-0 z-40" 
              onClick={handleClose}
            />
          )}
        </>
      )}
    </div>
  );
}

// Helper component for help icons with tooltips
export function HelpTooltip({ 
  title, 
  content, 
  className = '' 
}: { 
  title: string; 
  content: string; 
  className?: string; 
}) {
  return (
    <ContextualTooltip
      id={`help-${title.toLowerCase().replace(/\s+/g, '-')}`}
      title={title}
      content={content}
      trigger="hover"
      delay={300}
      className={className}
    >
      <HelpCircle className="h-4 w-4 text-slate-400 hover:text-slate-600 cursor-help" />
    </ContextualTooltip>
  );
}