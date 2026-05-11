import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useLocation, useNavigate } from 'react-router-dom';
import SearchService from '../API/SearchService';

const TYPES = [
    { id: 'all', label: 'Везде' },
    { id: 'posts', label: 'Статьи' },
    { id: 'courses', label: 'Курсы' },
    { id: 'sections', label: 'Разделы' },
    { id: 'tags', label: 'Теги' },
];

const POST_TYPE_LABELS = {
    article: 'Статья',
    news: 'Новость',
    video: 'Видео',
};

const formatAuthor = (a) => {
    if (!a) return '';
    return [a.first_name, a.last_name].filter(Boolean).join(' ').trim();
};

const formatDate = (raw) => {
    if (!raw) return '';
    const d = new Date(raw);
    if (Number.isNaN(d.getTime())) return '';
    return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' });
};

const PostRow = ({ post, onPick }) => (
    <button
        type="button"
        className="search-result search-result--post"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => onPick(`/posts/${post.id}`)}
    >
        <span className="search-result__kind">{POST_TYPE_LABELS[post.type] || 'Статья'}</span>
        <span className="search-result__title">{post.title || 'Без названия'}</span>
        <span className="search-result__meta">
            {formatAuthor(post.author) && <span>{formatAuthor(post.author)}</span>}
            {formatDate(post.created_at) && <span>· {formatDate(post.created_at)}</span>}
            {typeof post.score === 'number' && <span className="search-result__score">{Math.round(post.score * 100)}%</span>}
        </span>
    </button>
);

const CourseRow = ({ course, onPick }) => {
    const path = course?.section?.id != null
        ? `/educations/${course.section.id}/courses/${course.id}`
        : null;
    return (
        <button
            type="button"
            className="search-result search-result--course"
            disabled={!path}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => path && onPick(path)}
        >
            <span className="search-result__kind">Курс</span>
            <span className="search-result__title">{course.title || 'Без названия'}</span>
            <span className="search-result__meta">
                {course?.section?.title && <span>в разделе «{course.section.title}»</span>}
                {typeof course.rating === 'number' && course.rating > 0 && <span>· ★ {course.rating.toFixed(1)}</span>}
                {typeof course.score === 'number' && <span className="search-result__score">{Math.round(course.score * 100)}%</span>}
            </span>
        </button>
    );
};

const SectionRow = ({ section, onPick }) => (
    <button
        type="button"
        className="search-result search-result--section"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => onPick(`/educations/${section.id}`)}
    >
        <span className="search-result__kind">Раздел</span>
        <span className="search-result__title">{section.title || 'Без названия'}</span>
        <span className="search-result__meta">
            {formatAuthor(section.created_by) && <span>{formatAuthor(section.created_by)}</span>}
            {typeof section.rating === 'number' && section.rating > 0 && <span>· ★ {section.rating.toFixed(1)}</span>}
            {typeof section.score === 'number' && <span className="search-result__score">{Math.round(section.score * 100)}%</span>}
        </span>
    </button>
);

const TagRow = ({ tag, onPick }) => (
    <button
        type="button"
        className="search-result search-result--tag"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => onPick(`/tags/${tag.slug}`)}
    >
        <span className="search-result__kind">Тег</span>
        <span className="search-result__title">#{tag.name}</span>
    </button>
);

const ResultGroup = ({ title, count, children }) => (
    <section className="search-group">
        <header className="search-group__header">
            <h3 className="search-group__title">{title}</h3>
            <span className="search-group__count">{count}</span>
        </header>
        <div className="search-group__body">{children}</div>
    </section>
);

const renderResults = (results, type, onPick) => {
    const groups = [];
    const posts = results?.posts ?? [];
    const courses = results?.courses ?? [];
    const sections = results?.sections ?? [];
    const tags = results?.tags ?? [];

    if ((type === 'all' || type === 'posts') && posts.length > 0) {
        groups.push(
            <ResultGroup key="posts" title="Статьи и видео" count={posts.length}>
                {posts.map(p => <PostRow key={p.id} post={p} onPick={onPick} />)}
            </ResultGroup>
        );
    }
    if ((type === 'all' || type === 'courses') && courses.length > 0) {
        groups.push(
            <ResultGroup key="courses" title="Курсы" count={courses.length}>
                {courses.map(c => <CourseRow key={c.id} course={c} onPick={onPick} />)}
            </ResultGroup>
        );
    }
    if ((type === 'all' || type === 'sections') && sections.length > 0) {
        groups.push(
            <ResultGroup key="sections" title="Разделы" count={sections.length}>
                {sections.map(s => <SectionRow key={s.id} section={s} onPick={onPick} />)}
            </ResultGroup>
        );
    }
    if ((type === 'all' || type === 'tags') && tags.length > 0) {
        groups.push(
            <ResultGroup key="tags" title="Теги" count={tags.length}>
                <div className="search-group__tags">
                    {tags.map(t => <TagRow key={t.id} tag={t} onPick={onPick} />)}
                </div>
            </ResultGroup>
        );
    }
    return groups;
};

const isResultsEmpty = (r) => {
    if (!r) return true;
    return ((r.posts?.length ?? 0) + (r.courses?.length ?? 0) + (r.sections?.length ?? 0) + (r.tags?.length ?? 0)) === 0;
};

const GlobalSearchInline = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const [q, setQ] = useState('');
    const [debouncedQ, setDebouncedQ] = useState('');
    const [type, setType] = useState('all');
    const [isOpen, setIsOpen] = useState(false);
    const [ftsResults, setFtsResults] = useState(null);
    const [semResults, setSemResults] = useState(null);
    const [ftsLoading, setFtsLoading] = useState(false);
    const [semLoading, setSemLoading] = useState(false);
    const [ftsError, setFtsError] = useState(null);

    const containerRef = useRef(null);
    const popoverRef = useRef(null);
    const [popoverRect, setPopoverRect] = useState(null);

    // Закрытие по клику вне (учитывает портал — popoverRef сейчас в body)
    useEffect(() => {
        if (!isOpen) return;
        const onMouseDown = (e) => {
            const insideContainer = containerRef.current && containerRef.current.contains(e.target);
            const insidePopover = popoverRef.current && popoverRef.current.contains(e.target);
            if (!insideContainer && !insidePopover) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', onMouseDown);
        return () => document.removeEventListener('mousedown', onMouseDown);
    }, [isOpen]);

    // Вычисление позиции popover для портала
    const updateRect = useCallback(() => {
        if (!containerRef.current) return;
        const r = containerRef.current.getBoundingClientRect();
        setPopoverRect({ top: r.bottom + 6, left: r.left, width: r.width });
    }, []);

    useLayoutEffect(() => {
        if (!isOpen) return;
        updateRect();
        const onUpdate = () => updateRect();
        window.addEventListener('resize', onUpdate);
        window.addEventListener('scroll', onUpdate, true); // capture, чтобы ловить скролл `.layout__content`
        return () => {
            window.removeEventListener('resize', onUpdate);
            window.removeEventListener('scroll', onUpdate, true);
        };
    }, [isOpen, updateRect]);

    // Esc
    useEffect(() => {
        if (!isOpen) return;
        const onKey = (e) => { if (e.key === 'Escape') setIsOpen(false); };
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [isOpen]);

    // Дебаунс
    useEffect(() => {
        const t = setTimeout(() => setDebouncedQ(q.trim()), 300);
        return () => clearTimeout(t);
    }, [q]);

    // Параллельные запросы FTS + Semantic
    useEffect(() => {
        if (!isOpen) return;
        if (debouncedQ.length < 2) {
            setFtsResults(null);
            setSemResults(null);
            setFtsError(null);
            return;
        }

        let cancelled = false;
        setFtsLoading(true);
        setFtsError(null);
        SearchService.globalSearch({ q: debouncedQ, type, mode: 'fts', limit: 5 })
            .then(r => { if (!cancelled) setFtsResults(r.data?.results ?? {}); })
            .catch(e => { if (!cancelled) setFtsError(e?.message || 'Ошибка поиска'); })
            .finally(() => { if (!cancelled) setFtsLoading(false); });

        if (type !== 'tags') {
            setSemLoading(true);
            SearchService.globalSearch({ q: debouncedQ, type, mode: 'semantic', limit: 5 })
                .then(r => { if (!cancelled) setSemResults(r.data?.results ?? {}); })
                .catch(() => { if (!cancelled) setSemResults(null); })
                .finally(() => { if (!cancelled) setSemLoading(false); });
        } else {
            setSemResults(null);
            setSemLoading(false);
        }

        return () => { cancelled = true; };
    }, [isOpen, debouncedQ, type]);

    const handlePick = (path) => {
        setIsOpen(false);
        navigate(path, { state: { from: location.pathname } });
    };

    const ftsGroups = useMemo(
        () => renderResults(ftsResults, type, handlePick),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [ftsResults, type]
    );
    const semGroups = useMemo(
        () => renderResults(semResults, type, handlePick),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [semResults, type]
    );

    const showSemanticBlock = type !== 'tags' && (semLoading || (semResults && !isResultsEmpty(semResults)));
    const ftsEmpty = ftsResults && isResultsEmpty(ftsResults);

    return (
        <div ref={containerRef} className="global-search-inline">
            <div className={`global-search-inline__input-wrap${isOpen ? ' global-search-inline__input-wrap--open' : ''}`}>
                <span className="global-search-inline__icon" aria-hidden="true">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                         strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="11" cy="11" r="7" />
                        <line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                </span>
                <input
                    type="search"
                    className="global-search-inline__input"
                    placeholder="Поиск..."
                    value={q}
                    onChange={(e) => { setQ(e.target.value); setIsOpen(true); }}
                    onFocus={() => setIsOpen(true)}
                    autoComplete="off"
                    spellCheck="false"
                />
                {q && (
                    <button
                        type="button"
                        className="global-search-inline__clear"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => { setQ(''); }}
                        aria-label="Очистить"
                    >
                        ×
                    </button>
                )}
            </div>

            {isOpen && popoverRect && createPortal(
                <div
                    ref={popoverRef}
                    className="global-search-inline__popover"
                    role="listbox"
                    style={{ top: popoverRect.top, left: popoverRect.left, width: popoverRect.width }}
                >
                    <div className="global-search-inline__tabs">
                        {TYPES.map(t => (
                            <button
                                key={t.id}
                                type="button"
                                className={`global-search-inline__tab${type === t.id ? ' global-search-inline__tab--active' : ''}`}
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => setType(t.id)}
                            >
                                {t.label}
                            </button>
                        ))}
                    </div>

                    <div className="global-search-inline__body">
                        {debouncedQ.length < 2 ? (
                            <p className="global-search-inline__placeholder">
                                Введите минимум 2 символа.
                            </p>
                        ) : ftsLoading && !ftsResults ? (
                            <p className="global-search-inline__placeholder">Ищем…</p>
                        ) : ftsError ? (
                            <p className="global-search-inline__placeholder global-search-inline__placeholder--error">
                                {ftsError}
                            </p>
                        ) : (
                            <>
                                {ftsGroups.length > 0 ? (
                                    <div className="global-search-inline__section">
                                        {ftsGroups}
                                    </div>
                                ) : (
                                    !showSemanticBlock && ftsEmpty && (
                                        <p className="global-search-inline__placeholder">
                                            Ничего не найдено.
                                        </p>
                                    )
                                )}

                                {showSemanticBlock && (
                                    <div className="global-search-inline__section">
                                        <h2 className="global-search-inline__section-title">Похожее по смыслу</h2>
                                        {semLoading && !semResults ? (
                                            <p className="global-search-inline__placeholder">Ищем похожее…</p>
                                        ) : semGroups.length > 0 ? (
                                            semGroups
                                        ) : (
                                            <p className="global-search-inline__placeholder">Похожих материалов нет.</p>
                                        )}
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};

export default GlobalSearchInline;
