import React from 'react';

export interface BasicModalProps {
  open: boolean;
  children: React.ReactNode;
  setOpen: (value: boolean) => void;
  withCloseButton?: boolean;
  contentMaxWidth?: number;
  minContentHeight?: number;
  contentHeight?: number;
  closeCallback?: () => void;
  disableEnforceFocus?: boolean;
  BackdropProps?: object;
}

export const BasicModal = ({
  open,
  setOpen,
  withCloseButton = true,
  contentMaxWidth = 420,
  contentHeight,
  children,
  closeCallback,
}: BasicModalProps) => {
  const handleClose = () => {
    if (closeCallback) closeCallback();
    setOpen(false);
  };

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      data-cy="Modal"
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.4)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '12px',
        zIndex: 1000,
      }}
      onClick={handleClose}
    >
      <div
        style={{
          background: '#fff',
          color: '#000',
          width: '100%',
          maxWidth: `${contentMaxWidth}px`,
          height: contentHeight ? `${contentHeight}px` : 'auto',
          maxHeight: contentHeight ? `${contentHeight}px` : 'calc(100vh - 24px)',
          overflowY: 'auto',
          padding: '16px',
          position: 'relative',
        }}
        onClick={(event) => event.stopPropagation()}
      >
        {withCloseButton && (
          <button
            type="button"
            onClick={handleClose}
            data-cy="close-button"
            style={{ position: 'absolute', top: 8, right: 8 }}
          >
            x
          </button>
        )}
        {children}
      </div>
    </div>
  );
};
