import React, { useState, useEffect } from 'react';

interface ToastProps {
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  duration?: number;
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ message, type, duration = 5000, onClose }) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsExiting(true);
      setTimeout(onClose, 300); // Время для анимации выхода
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(onClose, 300);
  };

  const icons = {
    info: '💡',
    warning: '⚠️',
    success: '✅',
    error: '❌',
  };

  const colors = {
    info: 'bg-blue-500',
    warning: 'bg-orange-500',
    success: 'bg-green-500',
    error: 'bg-red-500',
  };

  const bgColors = {
    info: 'bg-blue-50 border-blue-200',
    warning: 'bg-orange-50 border-orange-200',
    success: 'bg-green-50 border-green-200',
    error: 'bg-red-50 border-red-200',
  };

  if (!isVisible) return null;

  return (
    <div
      className={`fixed top-4 right-4 z-50 max-w-md transform transition-all duration-300 ${
        isExiting ? 'translate-x-full opacity-0' : 'translate-x-0 opacity-100'
      }`}
    >
      <div className={`${bgColors[type]} border-2 rounded-lg shadow-lg p-4 flex items-start gap-3`}>
        <div className={`${colors[type]} text-white rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0`}>
          {icons[type]}
        </div>
        <div className="flex-1">
          <p className="text-gray-800 text-sm font-medium">{message}</p>
        </div>
        <button
          onClick={handleClose}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          ✕
        </button>
      </div>
    </div>
  );
};

// Toast Container для управления несколькими уведомлениями
interface ToastNotification {
  id: number;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
}

let toastId = 0;
const toastListeners: ((notification: ToastNotification) => void)[] = [];

export const showToast = (message: string, type: 'info' | 'warning' | 'success' | 'error' = 'info') => {
  const notification: ToastNotification = {
    id: toastId++,
    message,
    type,
  };
  
  toastListeners.forEach(listener => listener(notification));
};

export const ToastContainer: React.FC = () => {
  const [toasts, setToasts] = useState<ToastNotification[]>([]);

  useEffect(() => {
    const addToast = (notification: ToastNotification) => {
      setToasts(prev => [...prev, notification]);
    };

    toastListeners.push(addToast);

    return () => {
      const index = toastListeners.indexOf(addToast);
      if (index > -1) {
        toastListeners.splice(index, 1);
      }
    };
  }, []);

  const removeToast = (id: number) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toasts.map(toast => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </div>
  );
};
