import React from 'react';
import { Button } from '@/components/ui/button';
import { HelpCircle } from 'lucide-react';
import { Link } from 'wouter';

export function HelpButton() {

  return (
    <Link href="/help#getting-started">
      <Button
        variant="ghost"
        size="sm"
        className="text-slate-600 hover:text-slate-900"
        title="Getting Started Help"
      >
        <HelpCircle className="h-4 w-4" />
      </Button>
    </Link>
  );
}