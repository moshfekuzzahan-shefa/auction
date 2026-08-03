import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from './Dialog';
import { Button } from './Button';

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  onConfirm: () => void;
  onCancel?: () => void;
  confirmText?: string;
  cancelText?: string;
  destructive?: boolean;
}

export const ConfirmDialog = ({
  open,
  onOpenChange,
  title = "Are you absolutely sure?",
  description = "This action cannot be undone. This will permanently delete your data from our servers.",
  onConfirm,
  onCancel,
  confirmText = "Confirm",
  cancelText = "Cancel",
  destructive = false
}: ConfirmDialogProps) => {

  const handleConfirm = () => {
    onConfirm();
    onOpenChange(false);
  };

  const handleCancel = () => {
    if (onCancel) onCancel();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent open={open} onOpenChange={onOpenChange}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>{cancelText}</Button>
          <Button variant={destructive ? 'destructive' : 'primary'} onClick={handleConfirm}>{confirmText}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
