// src/components/ui/Dialog.jsx
import React, { createContext, useContext, useState, useEffect } from "react";
import { createPortal } from "react-dom";

const DialogContext = createContext();

export function Dialog({ children, open: controlledOpen, onOpenChange }) {
  // allow controlled or uncontrolled usage
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = typeof controlledOpen === "boolean";
  const open = isControlled ? controlledOpen : internalOpen;

  useEffect(() => {
    if (!isControlled) return;
    // when controlled open changes, lock body scroll
    document.body.style.overflow = open ? "hidden" : "";
  }, [open, isControlled]);

  useEffect(() => {
    // cleanup on unmount
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  const setOpen = (val) => {
    if (isControlled) {
      onOpenChange?.(val);
    } else {
      setInternalOpen(val);
    }
  };

  return (
    <DialogContext.Provider value={{ open, setOpen }}>
      {children}
    </DialogContext.Provider>
  );
}

export function DialogTrigger({ children, asChild = false }) {
  const ctx = useContext(DialogContext);
  if (!ctx) {
    console.warn("DialogTrigger must be used inside a Dialog");
    return null;
  }

  const { setOpen } = ctx;

  // If asChild, render child and attach onClick; otherwise wrap in a button
  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, {
      onClick: (e) => {
        children.props.onClick?.(e);
        setOpen(true);
      }
    });
  }

  return (
    <button
      onClick={() => setOpen(true)}
      className="inline-flex items-center justify-center"
    >
      {children}
    </button>
  );
}

function Backdrop({ onClick }) {
  return (
    <div
      onClick={onClick}
      className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60]"
    />
  );
}

export function DialogContent({ children, className = "max-w-lg", ...rest }) {
  const ctx = useContext(DialogContext);
  if (!ctx) {
    console.warn("DialogContent must be used inside a Dialog");
    return null;
  }
  const { open, setOpen } = ctx;

  // ensure a portal root exists
  let portalRoot = document.getElementById("dialog-root");
  if (!portalRoot) {
    portalRoot = document.createElement("div");
    portalRoot.id = "dialog-root";
    document.body.appendChild(portalRoot);
  }

  if (!open) return null;

  return createPortal(
    <>
      <Backdrop onClick={() => setOpen(false)} />
      <div className="fixed inset-0 z-[70] flex items-start md:items-center justify-center p-4">
        <div
          role="dialog"
          aria-modal="true"
          className={`w-full ${className} bg-white rounded-2xl shadow-xl overflow-hidden transform transition-transform duration-200 mt-12 md:mt-0`}
          {...rest}
        >
          {children}
        </div>
      </div>
    </>,
    portalRoot
  );
}

/* Layout helpers */
export function DialogHeader({ children, className = "px-6 py-4 border-b", ...rest }) {
  return (
    <div className={className} {...rest}>
      {children}
    </div>
  );
}

export function DialogTitle({ children, className = "text-lg font-semibold flex items-center gap-2", ...rest }) {
  return (
    <h3 className={className} {...rest}>
      {children}
    </h3>
  );
}

export function DialogDescription({ children, className = "text-sm text-gray-500 mt-1", ...rest }) {
  return (
    <p className={className} {...rest}>
      {children}
    </p>
  );
}

export function DialogFooter({ children, className = "flex justify-end gap-2 px-6 py-4 border-t", ...rest }) {
  return (
    <div className={className} {...rest}>
      {children}
    </div>
  );
}
