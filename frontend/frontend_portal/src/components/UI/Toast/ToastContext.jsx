import React, { createContext, useContext, useState, useCallback, useRef, useMemo } from 'react';
import Toast from './Toast';

const ToastContext = createContext(null);

let idCounter = 0;

export const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);
    const timersRef = useRef({});

    const removeToast = useCallback((id) => {
        clearTimeout(timersRef.current[id]);
        delete timersRef.current[id];
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    const addToast = useCallback((message, type = 'info', duration = 3000) => {
        const id = ++idCounter;
        setToasts(prev => [...prev, { id, message, type }]);
        timersRef.current[id] = setTimeout(() => removeToast(id), duration);
        return id;
    }, [removeToast]);

    const toast = useMemo(() => {
        const fn = (msg, type, duration) => addToast(msg, type, duration);
        fn.success = (msg, duration) => addToast(msg, 'success', duration);
        fn.error = (msg, duration) => addToast(msg, 'error', duration);
        fn.info = (msg, duration) => addToast(msg, 'info', duration);
        fn.warning = (msg, duration) => addToast(msg, 'warning', duration);
        return fn;
    }, [addToast]);

    return (
        <ToastContext.Provider value={toast}>
            {children}
            <div className="toast-container">
                {toasts.map(t => (
                    <Toast key={t.id} {...t} onClose={() => removeToast(t.id)} />
                ))}
            </div>
        </ToastContext.Provider>
    );
};

export const useToast = () => {
    const ctx = useContext(ToastContext);
    if (!ctx) throw new Error('useToast must be used within ToastProvider');
    return ctx;
};
