import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";

interface CustomModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export  function CustomModal({
  open,
  onClose,
  title,
  children,
  footer,
}: CustomModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;

    // Save previously focused element
    previouslyFocused.current = document.activeElement as HTMLElement;

    // Lock body scroll
    document.body.style.overflow = "hidden";

    // Focus first focusable element
    const focusable = modalRef.current?.querySelector<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    focusable?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }

      if (e.key === "Tab") {
        const focusables = modalRef.current?.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (!focusables || focusables.length === 0) return;

        const first = focusables[0];
        const last = focusables[focusables.length - 1];

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", handleKeyDown);
      previouslyFocused.current?.focus();
    };
  }, [open, onClose]);

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
          backgroundColor: "rgba(0,0,0,0.6)",
          backdropFilter: "blur(12px)",
        }}
        onClick={onClose}
      />

      <div
        ref={modalRef}
        className="fixed"
        style={{
          top: "50%",
          left: "50%",
          width: "100%",
          maxWidth: "32rem",
          padding: "1.5rem",
          borderRadius: "0.75rem",
          boxShadow: "0 16px 48px rgba(0,0,0,0.24)",
          backgroundColor: "var(--background)",
          color: "var(--foreground)",
          border: "1px solid var(--border)",
          transform: "translate(-50%, -50%)",
        }}
      >
        {title && (
          <h2 className="mb-2 text-lg font-semibold">
            {title}
          </h2>
        )}

        <div className="space-y-4">{children}</div>

        {footer && (
          <div className="mt-6 flex justify-end gap-2">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
