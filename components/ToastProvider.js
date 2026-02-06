'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { 
  CheckCircleIcon, 
  XCircleIcon, 
  ExclamationTriangleIcon, 
  InformationCircleIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

const ToastContext = createContext(null);

const toastStyles = {
  success: {
    bg: 'bg-green-50',
    border: 'border-green-200',
    text: 'text-green-800',
    icon: CheckCircleIcon,
    iconColor: 'text-green-500'
  },
  error: {
    bg: 'bg-red-50',
    border: 'border-red-200',
    text: 'text-red-800',
    icon: XCircleIcon,
    iconColor: 'text-red-500'
  },
  warning: {
    bg: 'bg-orange-50',
    border: 'border-orange-200',
    text: 'text-orange-800',
    icon: ExclamationTriangleIcon,
    iconColor: 'text-orange-500'
  },
  info: {
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    text: 'text-blue-800',
    icon: InformationCircleIcon,
    iconColor: 'text-blue-500'
  }
};

const positions = {
  'top-right': 'top-4 right-4',
  'top-center': 'top-4 left-1/2 -translate-x-1/2',
  'top-left': 'top-4 left-4',
  'bottom-right': 'bottom-4 right-4',
  'bottom-center': 'bottom-4 left-1/2 -translate-x-1/2',
  'bottom-left': 'bottom-4 left-4'
};

export function ToastProvider({ children, position = 'top-right', maxToasts = 5 }) {
  const [toasts, setToasts] = useState([]);
  const timeoutsRef = useRef(new Map());
  const fallbackCounterRef = useRef(0);

  useEffect(() => {
    return () => {
      timeoutsRef.current.forEach((timeoutId) => clearTimeout(timeoutId));
      timeoutsRef.current.clear();
    };
  }, []);

  const removeToast = useCallback((id) => {
    const timeoutId = timeoutsRef.current.get(id);
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutsRef.current.delete(id);
    }
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const addToast = useCallback((message, options = {}) => {
    const { 
      type = 'info',
      duration,
      action,
      persistent = false,
      icon
    } = options;
    
    const resolvedDuration = duration ?? (type === 'error' ? 6000 : 4000);
    const id = typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `${Date.now()}-${fallbackCounterRef.current++}`;
    
    const newToast = { id, message, type, action, icon };
    
    setToasts((prev) => {
      const updated = [...prev, newToast];
      // Limit number of toasts
      return updated.slice(-maxToasts);
    });
    
    if (!persistent && resolvedDuration > 0) {
      const timeoutId = setTimeout(() => removeToast(id), resolvedDuration);
      timeoutsRef.current.set(id, timeoutId);
    }
    
    return id;
  }, [removeToast, maxToasts]);

  const value = useMemo(() => ({ 
    addToast,
    success: (message, options) => addToast(message, { ...options, type: 'success' }),
    error: (message, options) => addToast(message, { ...options, type: 'error' }),
    warning: (message, options) => addToast(message, { ...options, type: 'warning' }),
    info: (message, options) => addToast(message, { ...options, type: 'info' }),
    removeToast
  }), [addToast, removeToast]);

  const hasErrorToast = toasts.some((toast) => toast.type === 'error');

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className={`fixed z-50 flex flex-col gap-3 w-full max-w-sm px-4 sm:px-0 ${positions[position]}`}
        aria-live={hasErrorToast ? 'assertive' : 'polite'}
        aria-relevant="additions text"
        aria-atomic="true"
      >
        {toasts.map((toast) => {
          const style = toastStyles[toast.type];
          const IconComponent = toast.icon || style.icon;
          
          return (
            <div
              key={toast.id}
              className={`flex items-start gap-3 p-4 rounded-lg border shadow-lg ${style.bg} ${style.border} ${style.text} animate-slideIn`}
              role={toast.type === 'error' ? 'alert' : 'status'}
            >
              {/* Icon */}
              <IconComponent className={`h-5 w-5 flex-shrink-0 ${style.iconColor}`} aria-hidden="true" />
              
              {/* Content */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{toast.message}</p>
                
                {/* Action button */}
                {toast.action && (
                  <button
                    type="button"
                    onClick={() => {
                      toast.action.onClick();
                      removeToast(toast.id);
                    }}
                    className={`mt-2 text-xs font-semibold underline hover:no-underline ${style.text}`}
                  >
                    {toast.action.label}
                  </button>
                )}
              </div>
              
              {/* Close button */}
              <button
                type="button"
                onClick={() => removeToast(toast.id)}
                className={`flex-shrink-0 ${style.text} hover:opacity-70 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-current rounded`}
                aria-label="Dismiss notification"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
