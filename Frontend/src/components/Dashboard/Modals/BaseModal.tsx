// src/pages/Dashboard/components/Modals/BaseModal.tsx
import { type ReactNode, useEffect } from "react";
import { X } from "lucide-react";

interface BaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  showCloseButton?: boolean;
  closeOnOverlayClick?: boolean;
  className?: string;
  showHeader?: boolean;
  title?: string;
  description?: string;
  icon?: ReactNode;
  footer?: ReactNode;
}

const BaseModal = ({
  isOpen,
  onClose,
  children,
  showCloseButton = true,
  closeOnOverlayClick = true,
  className = "",
  showHeader = false,
  title,
  description,
  icon,
  footer,
}: BaseModalProps) => {
  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    document.addEventListener("keydown", handleEsc);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleEsc);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="modal-overlay"
      onClick={(event) => {
        if (closeOnOverlayClick && event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className={`modal ${className}`.trim()}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? "modal-title" : undefined}
      >
        {(showHeader || showCloseButton) && (
          <div className="modal-head">
            <div className="row">
              {icon && (
                <span className="stat-icon is-yellow" aria-hidden="true">
                  {icon}
                </span>
              )}
              <div>
                {title && (
                  <h2 className="modal-title" id="modal-title">
                    {title}
                  </h2>
                )}
                {description && <p className="card-text">{description}</p>}
              </div>
            </div>
            {showCloseButton && (
              <button
                type="button"
                className="icon-btn"
                onClick={onClose}
                aria-label="بستن"
              >
                <X className="icon" aria-hidden="true" />
              </button>
            )}
          </div>
        )}

        <div className="modal-body stack">{children}</div>

        {footer && <div className="modal-actions">{footer}</div>}
      </div>
    </div>
  );
};

export default BaseModal;
