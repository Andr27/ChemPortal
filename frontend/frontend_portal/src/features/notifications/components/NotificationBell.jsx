import React, { useCallback, useEffect, useRef, useState } from 'react';
import NotificationService from '../API/NotificationService';
import cl from '../../../components/UI/navbar/navbar.module.css';

const POLL_INTERVAL = 60_000; // 1 мин

const formatDate = (raw) => {
    if (!raw) return '';
    const d = new Date(raw);
    if (Number.isNaN(d.getTime())) return '';
    const now = new Date();
    const diff = now - d;
    if (diff < 60_000) return 'только что';
    if (diff < 3_600_000) return `${Math.floor(diff / 60_000)} мин. назад`;
    if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)} ч. назад`;
    return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
};

const getText = (n) => n?.text || n?.message || n?.content || n?.title || 'Уведомление';

const NotificationBell = ({ isAuth }) => {
    const [unread, setUnread] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(false);
    const wrapperRef = useRef(null);

    // Периодический опрос количества непрочитанных
    const fetchCount = useCallback(() => {
        NotificationService.getUnreadCount()
            .then(r => setUnread(r.data?.count ?? 0))
            .catch(() => {});
    }, []);

    useEffect(() => {
        if (!isAuth) return;
        fetchCount();
        const id = setInterval(fetchCount, POLL_INTERVAL);
        return () => clearInterval(id);
    }, [isAuth, fetchCount]);

    // Загрузка списка при открытии панели
    useEffect(() => {
        if (!isOpen || !isAuth) return;
        let cancelled = false;
        setLoading(true);
        NotificationService.getList()
            .then(r => {
                if (cancelled) return;
                const raw = r.data;
                const list = Array.isArray(raw) ? raw : (raw?.results ?? []);
                setNotifications(list);
            })
            .catch(() => { if (!cancelled) setNotifications([]); })
            .finally(() => { if (!cancelled) setLoading(false); });
        return () => { cancelled = true; };
    }, [isOpen, isAuth]);

    // Закрытие по клику вне панели
    useEffect(() => {
        if (!isOpen) return;
        const handler = (e) => {
            if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [isOpen]);

    // Закрытие по Esc
    useEffect(() => {
        if (!isOpen) return;
        const handler = (e) => { if (e.key === 'Escape') setIsOpen(false); };
        document.addEventListener('keydown', handler);
        return () => document.removeEventListener('keydown', handler);
    }, [isOpen]);

    const handleMarkAll = () => {
        NotificationService.markAllRead()
            .then(() => {
                setUnread(0);
                setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
            })
            .catch(() => {});
    };

    const handleMarkOne = (id) => {
        NotificationService.markRead(id)
            .then(() => {
                setNotifications(prev =>
                    prev.map(n => n.id === id ? { ...n, is_read: true } : n)
                );
                setUnread(prev => Math.max(0, prev - 1));
            })
            .catch(() => {});
    };

    if (!isAuth) return null;

    return (
        <div className={cl.navbar__notifWrapper} ref={wrapperRef}>
            <button
                type="button"
                className={cl.navbar__notifBtn}
                onClick={() => setIsOpen(prev => !prev)}
                aria-label="Уведомления"
                aria-haspopup="true"
                aria-expanded={isOpen}
            >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                     stroke="currentColor" strokeWidth="2"
                     strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
                {unread > 0 && (
                    <span className={cl.navbar__notifBadge} aria-label={`${unread} непрочитанных`}>
                        {unread > 99 ? '99+' : unread}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className={cl.navbar__notifPanel} role="dialog" aria-label="Уведомления">
                    <div className={cl.navbar__notifHeader}>
                        <span>Уведомления</span>
                        {unread > 0 && (
                            <button
                                type="button"
                                className={cl.navbar__notifMarkAll}
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={handleMarkAll}
                            >
                                Прочитать всё
                            </button>
                        )}
                    </div>

                    <div className={cl.navbar__notifList}>
                        {loading ? (
                            <p className={cl.navbar__notifEmpty}>Загрузка…</p>
                        ) : notifications.length === 0 ? (
                            <p className={cl.navbar__notifEmpty}>Нет уведомлений</p>
                        ) : (
                            notifications.map(n => (
                                <button
                                    key={n.id}
                                    type="button"
                                    className={`${cl.navbar__notifItem}${!n.is_read ? ` ${cl['navbar__notifItem--unread']}` : ''}`}
                                    onMouseDown={(e) => e.preventDefault()}
                                    onClick={() => { if (!n.is_read) handleMarkOne(n.id); }}
                                >
                                    {!n.is_read && <span className={cl.navbar__notifDot} aria-hidden="true" />}
                                    <span className={cl.navbar__notifText}>{getText(n)}</span>
                                    <span className={cl.navbar__notifTime}>{formatDate(n.created_at)}</span>
                                </button>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotificationBell;
