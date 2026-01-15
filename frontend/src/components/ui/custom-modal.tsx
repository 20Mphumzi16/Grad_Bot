import { useEffect, useRef, useState } from "react";
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
  const [overlayVisible, setOverlayVisible] = useState(false);
  const [contentVisible, setContentVisible] = useState(false);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    if (!open) {
      document.body.style.overflow = "";
      previouslyFocused.current?.focus();
      setOverlayVisible(false);
      setContentVisible(false);
      setExiting(false);
      return;
    }

    previouslyFocused.current = document.activeElement as HTMLElement;
    document.body.style.overflow = "hidden";

    setExiting(false);
    setOverlayVisible(false);
    setContentVisible(false);

    const t1 = window.setTimeout(() => setOverlayVisible(true), 40);
    const t2 = window.setTimeout(() => setContentVisible(true), 120);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setExiting(true);
        setOverlayVisible(false);
        setContentVisible(false);
        window.setTimeout(() => {
          onClose();
        }, 260);
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
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      document.body.style.overflow = "";
      document.removeEventListener("keydown", handleKeyDown);
      previouslyFocused.current?.focus();
      setOverlayVisible(false);
      setContentVisible(false);
      setExiting(false);
    };
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
          backgroundColor: "rgba(0,0,0,0.6)",
          backdropFilter: "blur(12px)",
          opacity: overlayVisible && !exiting ? 1 : 0,
          transition: "opacity 260ms cubic-bezier(0.22, 0.61, 0.36, 1)",
        }}
        onClick={() => {
          setExiting(true);
          setOverlayVisible(false);
          setContentVisible(false);
          window.setTimeout(() => {
            onClose();
          }, 260);
        }}
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
          opacity: contentVisible && !exiting ? 1 : 0,
          transform: contentVisible && !exiting
            ? "translate(-50%, -50%) scale(1)"
            : "translate(-50%, -50%) scale(0.96)",
          transformOrigin: "50% 50%",
          transition:
            "opacity 260ms cubic-bezier(0.22, 0.61, 0.36, 1), transform 300ms cubic-bezier(0.22, 0.61, 0.36, 1)",
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
