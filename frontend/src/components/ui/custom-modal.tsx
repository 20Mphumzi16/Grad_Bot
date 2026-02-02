import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

interface CustomModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  overlayOpacity?: number;
  overlayBlur?: number;
  overlayColor?: string;
  zIndex?: number;
  className?: string;
}

export  function CustomModal({
  open,
  onClose,
  title,
  children,
  footer,
  overlayOpacity = 0.6,
  overlayBlur = 12,
  overlayColor = "rgba(0,0,0,0.6)",
  zIndex = 9999,
  className = "",
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
      className="fixed inset-0 flex items-center justify-center p-4 sm:p-6"
      style={{ zIndex, position: 'fixed', left: 0, top: 0, width: '100vw', height: '100vh' }}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="absolute inset-0"
        style={{
          backgroundColor: overlayColor,
          backdropFilter: overlayBlur > 0 ? `blur(${overlayBlur}px)` : "none",
          opacity: overlayVisible && !exiting ? overlayOpacity : 0,
          transition: "opacity 260ms cubic-bezier(0.22, 0.61, 0.36, 1)",
          width: '100%',
          height: '100%'
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
        className={`relative w-full max-w-lg p-6 rounded-xl shadow-2xl bg-background text-foreground border border-border ${className}`}
        style={{
          opacity: contentVisible && !exiting ? 1 : 0,
          transform: contentVisible && !exiting ? "scale(1)" : "scale(0.96)",
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
