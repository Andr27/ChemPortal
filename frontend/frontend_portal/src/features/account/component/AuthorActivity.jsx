import React, { useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';

const formatDate = (raw) => {
    if (!raw) return '';
    const dt = new Date(raw);
    if (Number.isNaN(dt.getTime())) return '';
    return dt.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' });
};

const TYPE_CONFIG = {
    post: {
        label: 'Статья',
        icon: (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                 strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
            </svg>
        ),
    },
    news: {
        label: 'Новость',
        icon: (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                 strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2" />
                <path d="M18 14h-8M15 18h-5M10 6h8v4h-8z" />
            </svg>
        ),
    },
    video: {
        label: 'Видео',
        icon: (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                 strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="23 7 16 12 23 17 23 7" />
                <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
            </svg>
        ),
    },
    course: {
        label: 'Курс',
        icon: (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                 strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                <path d="M6 12v5c0 1.1 2.7 3 6 3s6-1.9 6-3v-5" />
            </svg>
        ),
    },
    section: {
        label: 'Раздел',
        icon: (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                 strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 7h18M3 12h18M3 17h18" />
            </svg>
        ),
    },
};

const buildItems = (activity) => {
    const posts = (activity?.posts ?? []).map(p => ({
        id: `post-${p.id}`,
        kind: p.type === 'news' ? 'news' : p.type === 'video' ? 'video' : 'post',
        title: p.title || 'Без названия',
        createdAt: p.created_at,
        to: `/posts/${p.id}`,
    }));

    const courses = (activity?.courses ?? []).map(c => ({
        id: `course-${c.id}`,
        kind: 'course',
        title: c.title || 'Без названия',
        createdAt: c.created_at,
        to: c.section_id != null
            ? `/educations/${c.section_id}/courses/${c.id}`
            : null,
    }));

    const sections = (activity?.sections ?? []).map(s => ({
        id: `section-${s.id}`,
        kind: 'section',
        title: s.title || 'Без названия',
        createdAt: s.created_at,
        to: `/educations/${s.id}`,
    }));

    return [...posts, ...courses, ...sections]
        .sort((a, b) => {
            const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            return tb - ta;
        });
};

const AuthorActivityRow = ({ item, fromPath }) => {
    const cfg = TYPE_CONFIG[item.kind] || TYPE_CONFIG.post;
    const dateStr = formatDate(item.createdAt);

    const inner = (
        <>
            <span className={`author-activity__icon author-activity__icon--${item.kind}`} aria-hidden="true">
                {cfg.icon}
            </span>
            <div className="author-activity__row-body">
                <div className="author-activity__row-meta">
                    <span className="author-activity__type">{cfg.label}</span>
                    {dateStr && <span className="author-activity__date">{dateStr}</span>}
                </div>
                <div className="author-activity__row-title">{item.title}</div>
            </div>
        </>
    );

    if (item.to) {
        return (
            <Link
                className="author-activity__row author-activity__row--link"
                to={item.to}
                state={{ from: fromPath }}
            >
                {inner}
            </Link>
        );
    }
    return <div className="author-activity__row">{inner}</div>;
};

const AuthorActivity = ({ activity, isLoading }) => {
    const location = useLocation();
    const items = useMemo(() => buildItems(activity).slice(0, 8), [activity]);

    return (
        <section className="author-activity">
            <h2 className="author-activity__title">Активность</h2>
            {isLoading ? (
                <p className="author-activity__placeholder">Загрузка…</p>
            ) : items.length === 0 ? (
                <p className="author-activity__placeholder">Пока нет публикаций.</p>
            ) : (
                <ul className="author-activity__list">
                    {items.map(item => (
                        <li key={item.id} className="author-activity__item">
                            <AuthorActivityRow item={item} fromPath={location.pathname} />
                        </li>
                    ))}
                </ul>
            )}
        </section>
    );
};

export default AuthorActivity;
