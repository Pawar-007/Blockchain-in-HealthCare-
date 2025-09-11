// src/components/ui/use-toast.jsx
import React, { createContext, useContext, useState, useCallback } from "react";

const ToastContext = createContext();

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const toast = useCallback(({ title, description, variant = "default" }) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, title, description, variant }]);

    // Auto-remove after 3s
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      {/* Toast Container */}
      <div className="fixed top-4 right-4 space-y-3 z-50">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`rounded-lg shadow-lg px-4 py-3 text-sm text-white ${
              t.variant === "destructive"
                ? "bg-red-600"
                : "bg-gradient-to-r from-blue-600 to-purple-600"
            }`}
          >
            <p className="font-semibold">{t.title}</p>
            {t.description && (
              <p className="text-xs opacity-90">{t.description}</p>
            )}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  return useContext(ToastContext);
};
