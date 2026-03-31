import React, { useState } from 'react';
import './Toast.css';

const ICONS = {
    success: '✓',
    error: '✕',
    warning: '!',
    info: 'i',
};

const Toast = ({ message, type = 'info', onClose }) => {
    const [isExiting, setIsExiting] = useState(false);

    const handleClose = () => {
        setIsExiting(true);
        setTimeout(onClose, 250);
    };

    return (
        <div
            className={`toast toast--${type} ${isExiting ? 'toast--exit' : ''}`}
            onClick={handleClose}
        >
            <span className="toast__icon">{ICONS[type]}</span>
            <span className="toast__message">{message}</span>
        </div>
    );
};

export default Toast;
