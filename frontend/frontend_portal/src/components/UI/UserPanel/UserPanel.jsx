import React, { useCallback, useEffect, useRef, useState } from 'react';
import NotificationService from '../../../features/notifications/API/NotificationService';
import cl from './UserPanel.module.css';
import iconUser from '../../../img/icon/user.svg';

const POLL_MS   = 60_000;   // интервал опроса количества непрочитанных
const PAGE_SIZE = 20;       // уведомлений за один запрос

/* ── Вспомогательные функции ─────────────────────────────── */

const formatRelTime = (raw) => {
    if (!raw) return '';
    const d = new Date(raw);
    if (Number.isNaN(d.getTime())) return '';
    const diff = Date.now() - d.getTime();
    if (diff < 60_000)        return 'только что';
    if (diff < 3_600_000)     return `${Math.floor(diff / 60_000)} мин. назад`;
    if (diff < 86_400_000)    return `${Math.floor(diff / 3_600_000)} ч. назад`;
    return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
};

const getText = (n) =>
    n?.text || n?.message || n?.content || n?.title || 'Уведомление';

/* ── Компонент ───────────────────────────────────────────── */

/**
 * UserPanel — объединённый дропдаун профиля + уведомления.
 *
 * Props:
 *   onLogout            () => void
 *   onNavigateAccount   () => void
 */
const UserPanel = ({ onLogout, onNavigateAccount }) => {
    const [isOpen,       setIsOpen]       = useState(false);
    const [tab,          setTab]          = useState('notifs');
    const [unread,       setUnread]       = useState(0);
    const [notifications, setNotifications] = useState([]);
    const [loading,      setLoading]      = useState(false);
    const [totalCount,   setTotalCount]   = useState(0);
    const wrapperRef = useRef(null);

    /* -- Polling непрочитанных -------------------------------- */
    const fetchCount = useCallback(() => {
        NotificationService.getUnreadCount()
            .then(r => setUnread(r.data?.count ?? 0))
            .catch(() => {});
    }, []);

    useEffect(() => {
        fetchCount();
        const id = setInterval(fetchCount, POLL_MS);
        return () => clearInterval(id);
    }, [fetchCount]);

    /* -- Загрузка уведомлений при переключении на вкладку ---- */
    useEffect(() => {
        if (!isOpen || tab !== 'notifs') return;
        let cancelled = false;
        setLoading(true);
        NotificationService.getList({ limit: PAGE_SIZE })
            .then(r => {
                if (cancelled) return;
                const raw  = r.data;
                const list = Array.isArray(raw) ? raw : (raw?.results ?? []);
                setNotifications(list);
                setTotalCount(raw?.count ?? list.length);
            })
            .catch(() => { if (!cancelled) setNotifications([]); })
            .finally(() => { if (!cancelled) setLoading(false); });
        return () => { cancelled = true; };
    }, [isOpen, tab]);

    /* -- Закрытие по клику вне панели ------------------------ */
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

    /* -- Закрытие по Escape ---------------------------------- */
    useEffect(() => {
        if (!isOpen) return;
        const handler = (e) => { if (e.key === 'Escape') setIsOpen(false); };
        document.addEventListener('keydown', handler);
        return () => document.removeEventListener('keydown', handler);
    }, [isOpen]);

    /* -- Обработчики ----------------------------------------- */
    const handleToggle = () => {
        setIsOpen(prev => {
            if (!prev) setTab('notifs'); // при каждом открытии — уведомления
            return !prev;
        });
    };

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

    /* -- Рендер ---------------------------------------------- */
    return (
        <div className={cl.wrapper} ref={wrapperRef}>

            {/* Кнопка-триггер */}
            <button
                type="button"
                className={cl.trigger}
                onClick={handleToggle}
                aria-label="Профиль и уведомления"
                aria-haspopup="true"
                aria-expanded={isOpen}
            >
                <span
                    className={cl.userIcon}
                    style={{
                        maskImage: `url(${iconUser})`,
                        WebkitMaskImage: `url(${iconUser})`,
                    }}
                    aria-hidden="true"
                />
                {unread > 0 && (
                    <span className={cl.badge} aria-label={`${unread} непрочитанных уведомлений`}>
                        {unread > 99 ? '99+' : unread}
                    </span>
                )}
            </button>

            {/* Панель */}
            {isOpen && (
                <div className={cl.panel} role="dialog" aria-label="Меню пользователя">

                    {/* Табы */}
                    <div className={cl.tabs}>
                        <button
                            type="button"
                            className={`${cl.tab}${tab === 'profile' ? ` ${cl.tabActive}` : ''}`}
                            onMouseDown={e => e.preventDefault()}
                            onClick={() => setTab('profile')}
                        >
                            Профиль
                        </button>
                        <button
                            type="button"
                            className={`${cl.tab}${tab === 'notifs' ? ` ${cl.tabActive}` : ''}`}
                            onMouseDown={e => e.preventDefault()}
                            onClick={() => setTab('notifs')}
                        >
                            Уведомления
                            {unread > 0 && (
                                <span className={cl.tabBadge}>{unread > 99 ? '99+' : unread}</span>
                            )}
                        </button>
                    </div>

                    {/* ── Вкладка: Профиль ── */}
                    {tab === 'profile' && (
                        <div className={cl.profileSection}>
                            <button
                                type="button"
                                className={cl.profileItem}
                                onMouseDown={e => e.preventDefault()}
                                onClick={() => { setIsOpen(false); onNavigateAccount(); }}
                            >
                                Личный кабинет
                            </button>
                            <button
                                type="button"
                                className={`${cl.profileItem} ${cl.profileItemDanger}`}
                                onMouseDown={e => e.preventDefault()}
                                onClick={() => { setIsOpen(false); onLogout(); }}
                            >
                                Выход
                            </button>
                        </div>
                    )}

                    {/* ── Вкладка: Уведомления ── */}
                    {tab === 'notifs' && (
                        <div className={cl.notifsSection}>

                            {unread > 0 && (
                                <div className={cl.notifsToolbar}>
                                    <button
                                        type="button"
                                        className={cl.markAll}
                                        onMouseDown={e => e.preventDefault()}
                                        onClick={handleMarkAll}
                                    >
                                        Прочитать всё
                                    </button>
                                </div>
                            )}

                            <div className={cl.notifsList}>
                                {loading ? (
                                    <p className={cl.notifsEmpty}>Загрузка…</p>
                                ) : notifications.length === 0 ? (
                                    <p className={cl.notifsEmpty}>Нет уведомлений</p>
                                ) : (
                                    notifications.map(n => (
                                        <button
                                            key={n.id}
                                            type="button"
                                            className={`${cl.notifItem}${!n.is_read ? ` ${cl.notifItemUnread}` : ''}`}
                                            onMouseDown={e => e.preventDefault()}
                                            onClick={() => { if (!n.is_read) handleMarkOne(n.id); }}
                                        >
                                            {!n.is_read && (
                                                <span className={cl.notifDot} aria-hidden="true" />
                                            )}
                                            <span className={cl.notifText}>{getText(n)}</span>
                                            <span className={cl.notifTime}>{formatRelTime(n.created_at)}</span>
                                        </button>
                                    ))
                                )}
                            </div>

                            {/* Сноска когда уведомлений больше, чем загружено */}
                            {totalCount > PAGE_SIZE && (
                                <p className={cl.notifsMore}>
                                    Показаны последние {PAGE_SIZE} из {totalCount}
                                </p>
                            )}

                        </div>
                    )}

                </div>
            )}
        </div>
    );
};

export default UserPanel;
