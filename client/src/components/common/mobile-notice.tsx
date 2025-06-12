import { useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Monitor, X, RotateCcw } from "lucide-react";

export default function MobileNotice() {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div className="block md:hidden">
      <Alert className="mb-4 border-amber-200 bg-amber-50">
        <Monitor className="h-4 w-4 text-amber-600" />
        <AlertDescription className="text-amber-800">
          <div className="flex items-start justify-between">
            <div className="flex-1 pr-2">
              <p className="font-medium mb-1">Best Experience on Desktop</p>
              <p className="text-sm">
                For optimal visibility of tables and charts, we recommend using a desktop computer or rotating your device to landscape mode.
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-amber-600 hover:text-amber-800 p-1 h-auto"
              onClick={() => setDismissed(true)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    </div>
  );
}

export function LandscapeNotice() {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div className="block sm:hidden">
      <Alert className="mb-4 border-blue-200 bg-blue-50">
        <RotateCcw className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-800">
          <div className="flex items-start justify-between">
            <div className="flex-1 pr-2">
              <p className="font-medium mb-1">Rotate for Better View</p>
              <p className="text-sm">
                Turn your device to landscape mode for the best experience with this page.
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-blue-600 hover:text-blue-800 p-1 h-auto"
              onClick={() => setDismissed(true)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    </div>
  );
}