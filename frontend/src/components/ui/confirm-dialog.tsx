import { useEffect, useState } from 'react';
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
  const [overlayVisible, setOverlayVisible] = useState(false);
  const [contentVisible, setContentVisible] = useState(false);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    if (open) {
      document.body.classList.add('logout-blur');
      setExiting(false);
      setOverlayVisible(false);
      setContentVisible(false);
      const t1 = setTimeout(() => setOverlayVisible(true), 60);
      const t2 = setTimeout(() => setContentVisible(true), 160);
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
        document.body.classList.remove('logout-blur');
        setOverlayVisible(false);
        setContentVisible(false);
        setExiting(false);
      };
    } else {
      document.body.classList.remove('logout-blur');
      setOverlayVisible(false);
      setContentVisible(false);
      setExiting(false);
    }
  }, [open]);

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0"
      style={{ zIndex: 1000000 }}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="absolute inset-0"
        style={{
          backgroundColor: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(12px)',
          opacity: overlayVisible && !exiting ? 1 : 0,
          transition: 'opacity 280ms cubic-bezier(0.22, 0.61, 0.36, 1)'
        }}
        onClick={() => {
          setExiting(true);
          setContentVisible(false);
          setOverlayVisible(false);
          setTimeout(() => {
            onCancel();
          }, 280);
        }}
      />

      <div
        className="fixed"
        style={{
          top: '50%',
          left: '50%',
          width: '100%',
          maxWidth: '28rem',
          padding: '1.5rem',
          borderRadius: '0.5rem',
          boxShadow: '0 16px 48px rgba(0,0,0,0.24)',
          backgroundColor: 'var(--background)',
          color: 'var(--foreground)',
          border: '1px solid var(--border)',
          zIndex: 1000001,
          opacity: contentVisible && !exiting ? 1 : 0,
          transformOrigin: '50% 50%',
          transition: 'opacity 320ms cubic-bezier(0.22, 0.61, 0.36, 1), transform 360ms cubic-bezier(0.22, 0.61, 0.36, 1)',
          transform: contentVisible && !exiting
            ? 'translate(-50%, -50%) scale(1) translateZ(0)'
            : 'translate(-50%, -50%) scale(0.98) translateZ(0)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '0.5rem' }}>
          {title}
        </h3>
        {description && (
          <p style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)', marginBottom: '1rem' }}>
            {description}
          </p>
        )}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            className="bg-gradient-to-r from-blue-500 to-teal-500 text-white"
            onClick={() => {
              setExiting(true);
              setContentVisible(false);
              setOverlayVisible(false);
              setTimeout(() => {
                onConfirm();
              }, 360);
            }}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
}
