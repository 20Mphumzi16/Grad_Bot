import { createPortal } from 'react-dom';
import { Button } from './button';

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
  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop - only this handles clicks to close */}
      <div className="absolute inset-0 bg-black/80" onClick={onCancel} />

      {/* Modal */}
      <div
        className="relative w-full max-w-md mx-4 bg-white rounded-lg p-6 shadow-xl z-10"
        onClick={(e) => e.stopPropagation()} // prevent close when clicking inside
      >
        <h3 className="text-lg font-semibold mb-2">{title}</h3>

        {description && (
          <p className="text-sm text-gray-600 mb-4">
            {description}
          </p>
        )}

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            className="bg-gradient-to-r from-blue-500 to-teal-500 text-white"
            onClick={onConfirm}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
}
