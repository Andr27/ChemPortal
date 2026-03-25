import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import EducationService from '../../educations/API/EducationService';
import Loader from '../../../components/UI/loader/loader';

/* ── Иконки ───────────────────────────────────────────────────── */
const IconSection = () => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <rect x="2" y="2" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="1.5"/>
        <line x1="5" y1="5.5" x2="11" y2="5.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
        <line x1="5" y1="8"   x2="11" y2="8"   stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
        <line x1="5" y1="10.5" x2="8" y2="10.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
    </svg>
);

const IconCourse = () => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M8 2L2 5l6 3 6-3-6-3z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
        <path d="M2 8l6 3 6-3"  stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M2 11l6 3 6-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
);

const IconEdit = () => (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
        <path d="M11 2l3 3-9 9H2v-3l9-9z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
    </svg>
);

/* ── Бейдж статуса ───────────────────────────────────────────── */
const STATUS_LABELS = {
    draft:      { label: 'Черновик',     cls: 'edu-status--draft'     },
    pending:    { label: 'На модерации', cls: 'edu-status--pending'   },
    moderation: { label: 'На модерации', cls: 'edu-status--pending'   },
    published:  { label: 'Опубликовано', cls: 'edu-status--published' },
    rejected:   { label: 'Отклонено',   cls: 'edu-status--rejected'  },
};

const StatusBadge = ({ status }) => {
    const info = STATUS_LABELS[status] || { label: status, cls: '' };
    return <span className={`edu-status-badge ${info.cls}`}>{info.label}</span>;
};

/* ── Карточка отклонённого раздела (с редактированием) ────────── */
const RejectedSectionCard = ({ section, onResubmit }) => {
    const [editing,     setEditing]     = useState(false);
    const [title,       setTitle]       = useState(section.title       || '');
    const [description, setDescription] = useState(section.description || '');
    const [saving,      setSaving]      = useState(false);
    const [error,       setError]       = useState('');

    const handleSave = async () => {
        if (!title.trim()) { setError('Введите название'); return; }
        setSaving(true);
        setError('');
        try {
            await EducationService.changeSection(section.id, { title, description });
            await EducationService.suggestSection(section.id);
            onResubmit(section.id);
        } catch (e) {
            setError(e?.response?.data?.detail || 'Ошибка при отправке');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="eap-card eap-card--rejected">
            <div className="eap-card__accent eap-card__accent--section" />
            <div className="eap-card__icon eap-card__icon--section">
                <IconSection />
            </div>

            {editing ? (
                <div className="eap-card__edit-body">
                    <input
                        className="eap-card__edit-input"
                        value={title}
                        onChange={e => setTitle(e.target.value)}
                        placeholder="Название раздела"
                    />
                    <textarea
                        className="eap-card__edit-textarea"
                        value={description}
                        onChange={e => setDescription(e.target.value)}
                        placeholder="Описание (необязательно)"
                        rows={2}
                    />
                    {error && <p className="eap-card__edit-error">{error}</p>}
                    <div className="eap-card__edit-actions">
                        <button
                            className="eap-card__btn eap-card__btn--primary"
                            onClick={handleSave}
                            disabled={saving}
                        >
                            {saving ? 'Отправляем...' : 'Сохранить и отправить'}
                        </button>
                        <button
                            className="eap-card__btn eap-card__btn--ghost"
                            onClick={() => { setEditing(false); setError(''); }}
                            disabled={saving}
                        >
                            Отмена
                        </button>
                    </div>
                </div>
            ) : (
                <div className="eap-card__body">
                    <div className="eap-card__top">
                        <span className="eap-card__badge eap-card__badge--section">Раздел</span>
                        <span className="eap-card__title">{section.title}</span>
                        <StatusBadge status={section.status || 'rejected'} />
                    </div>
                    {section.description && (
                        <p className="eap-card__desc">{section.description}</p>
                    )}
                </div>
            )}

            {!editing && (
                <button
                    className="eap-card__btn eap-card__btn--edit"
                    onClick={() => setEditing(true)}
                    title="Редактировать и переотправить"
                >
                    <IconEdit />
                    Изменить
                </button>
            )}
        </div>
    );
};

/* ── Карточка курса ───────────────────────────────────────────── */
const CourseCard = ({ course }) => {
    const navigate  = useNavigate();
    const sectionId = course.section_id ?? course.section;
    const openCourse = () => sectionId && navigate(
        `/educations/${sectionId}/courses/${course.id}`,
        { state: { from: '/account' } }
    );

    return (
        <div
            className="eap-card eap-card--link"
            onClick={openCourse}
            role="button"
            tabIndex={0}
            onKeyDown={e => e.key === 'Enter' && openCourse()}
        >
            <div className="eap-card__accent eap-card__accent--course" />
            <div className="eap-card__icon eap-card__icon--course">
                <IconCourse />
            </div>
            <div className="eap-card__body">
                <div className="eap-card__top">
                    <span className="eap-card__badge eap-card__badge--course">Курс</span>
                    <span className="eap-card__title">{course.title}</span>
                    {course.status && <StatusBadge status={course.status} />}
                </div>
                {course.description && (
                    <p className="eap-card__desc">{course.description}</p>
                )}
            </div>
            <span className="eap-card__nav-arrow">→</span>
        </div>
    );
};

/* ── EduAccountPanel ─────────────────────────────────────────── */
const EduAccountPanel = () => {
    const [tab,      setTab]      = useState('drafts');
    const [sections, setSections] = useState([]);   // отклонённые разделы (только для черновиков)
    const [courses,  setCourses]  = useState([]);
    const [loading,  setLoading]  = useState(false);

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        setSections([]);
        setCourses([]);

        const run = async () => {
            try {
                // 1. Получаем разделы пользователя для section_id
                const [draftSecRes, pubSecRes, rejSecRes] = await Promise.allSettled([
                    EducationService.getMyDraftSections(),
                    EducationService.getMyPublishedSections(),
                    EducationService.getMyRejectedSections(),
                ]);

                const extract = res =>
                    res.status === 'fulfilled'
                        ? (Array.isArray(res.value.data)
                            ? res.value.data
                            : (res.value.data?.results ?? []))
                        : [];

                const draftSecs  = extract(draftSecRes);
                const pubSecs    = extract(pubSecRes);
                const rejSecs    = extract(rejSecRes);
                const allSecs    = [...draftSecs, ...pubSecs, ...rejSecs];

                if (cancelled) return;

                // 2. Показываем отклонённые разделы только на вкладке черновиков
                if (tab === 'drafts') {
                    setSections(rejSecs);
                }

                // 3. Получаем курсы из всех разделов
                const courseMethod = tab === 'drafts'
                    ? (id) => Promise.allSettled([
                          EducationService.myDraftCourses(id),
                          EducationService.myRejectedCourses(id),
                      ]).then(([d, r]) => [
                          ...(extract(d)),
                          ...(extract(r)),
                      ])
                    : (id) => EducationService.myPublishedCourses(id)
                          .then(r => extract({ status: 'fulfilled', value: r }));

                const courseResults = await Promise.allSettled(
                    allSecs.map(s => courseMethod(s.id).then(list =>
                        list.map(c => ({ ...c, section_id: c.section_id ?? c.section ?? s.id }))
                    ))
                );

                if (cancelled) return;

                const flat = courseResults
                    .filter(r => r.status === 'fulfilled')
                    .flatMap(r => r.value);

                // Убираем дубли по id
                const seen = new Set();
                const unique = flat.filter(c => {
                    if (seen.has(c.id)) return false;
                    seen.add(c.id);
                    return true;
                });

                setCourses(unique);
            } catch {
                // silent
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        run();
        return () => { cancelled = true; };
    }, [tab]);

    const handleResubmit = (sectionId) => {
        setSections(prev => prev.filter(s => s.id !== sectionId));
    };

    const isEmpty = sections.length === 0 && courses.length === 0;

    return (
        <div className="edu-account-panel">
            {/* Под-табы */}
            <div className="account-panel__tabs">
                <button
                    type="button"
                    className={`account-panel__tab${tab === 'drafts' ? ' account-panel__tab--active' : ''}`}
                    onClick={() => setTab('drafts')}
                >
                    Черновики
                </button>
                <button
                    type="button"
                    className={`account-panel__tab${tab === 'published' ? ' account-panel__tab--active' : ''}`}
                    onClick={() => setTab('published')}
                >
                    Мои публикации
                </button>
            </div>

            <div className="account-panel__content edu-account-panel__content">
                {loading && <div style={{ padding: '40px 0', display: 'flex', justifyContent: 'center' }}><Loader /></div>}

                {!loading && isEmpty && (
                    <p className="edu-account-panel__empty">
                        {tab === 'drafts' ? 'Нет черновиков.' : 'Нет опубликованного контента.'}
                    </p>
                )}

                {!loading && sections.length > 0 && (
                    <div className="eap-group">
                        <div className="eap-group__header">
                            <span className="eap-group__dot eap-group__dot--section" />
                            Отклонённые разделы
                            <span className="eap-group__count">{sections.length}</span>
                        </div>
                        {sections.map(s => (
                            <RejectedSectionCard key={s.id} section={s} onResubmit={handleResubmit} />
                        ))}
                    </div>
                )}

                {!loading && courses.length > 0 && (
                    <div className="eap-group">
                        <div className="eap-group__header">
                            <span className="eap-group__dot eap-group__dot--course" />
                            {tab === 'drafts' ? 'Черновики курсов' : 'Опубликованные курсы'}
                            <span className="eap-group__count">{courses.length}</span>
                        </div>
                        {courses.map(c => (
                            <CourseCard key={c.id} course={c} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default EduAccountPanel;
