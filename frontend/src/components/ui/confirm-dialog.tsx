import { Button } from './button';
import { CustomModal } from './custom-modal';

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  description?: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
};

export function ConfirmDialog({
  open,
  title,
  description,
  onConfirm,
  onCancel,
  confirmText = 'Confirm',
}: ConfirmDialogProps) {
  return (
    <CustomModal
      open={open}
      onClose={onCancel}
      title={title}
      overlayBlur={4}
      overlayColor="rgba(0, 0, 0, 0.4)"
      zIndex={10000}
      footer={
        <>
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            className="bg-gradient-to-r from-blue-500 to-teal-500 text-white hover:opacity-90"
            onClick={onConfirm}
          >
            {confirmText}
          </Button>
        </>
      }
    >
      {description && (
        <p className="text-sm text-muted-foreground">
          {description}
        </p>
      )}
    </CustomModal>
  );
}
