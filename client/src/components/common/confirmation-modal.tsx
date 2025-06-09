import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  isLoading?: boolean;
  variant?: "default" | "destructive";
}

export default function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  isLoading = false,
  variant = "destructive",
}: ConfirmationModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader className="pb-4">
          <div className="flex items-center mb-4">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center mr-4 ${
              variant === "destructive" ? "bg-red-100" : "bg-amber-100"
            }`}>
              <AlertTriangle className={`h-6 w-6 ${
                variant === "destructive" ? "text-red-600" : "text-amber-600"
              }`} />
            </div>
            <div>
              <DialogTitle className="text-lg font-semibold text-slate-900">
                {title}
              </DialogTitle>
            </div>
          </div>
          <DialogDescription className="text-slate-600">
            {description}
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex justify-end space-x-3 pt-4">
          <Button 
            type="button" 
            variant="outline" 
            onClick={onClose}
            disabled={isLoading}
          >
            {cancelText}
          </Button>
          <Button 
            type="button"
            variant={variant}
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? "Processing..." : confirmText}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
