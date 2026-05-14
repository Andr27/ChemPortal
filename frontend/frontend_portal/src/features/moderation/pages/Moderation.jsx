import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PostService from '../../posts/API/PostService';
import PostGet from '../../posts/components/PostGet';
import EducationService from '../../educations/API/EducationService';
import Loader from '../../../components/UI/loader/loader';
import {Helmet} from "react-helmet";
import RequestRole from "../components/RequestRole";

/* ── SVG-иконки ───────────────────────────────────────────────── */
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
        <path d="M2 8l6 3 6-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M2 11l6 3 6-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
);

/* ── Карточка раздела ─────────────────────────────────────────── */
const SectionCard = ({ section, onApprove, onReject, loading }) => {
    const authorName = section.created_by
        ? `${section.created_by.first_name ?? ''} ${section.created_by.last_name ?? ''}`.trim()
        : null;

    return (
        <div className="mcard">
            <div className="mcard__accent mcard__accent--section" />
            <div className="mcard__icon mcard__icon--section">
                <IconSection />
            </div>
            <div className="mcard__body">
                <div className="mcard__top">
                    <span className="mcard__badge mcard__badge--section">Раздел</span>
                    <span className="mcard__title">{section.title}</span>
                </div>
                <div className="mcard__meta">
                    {section.category_name && <span>Категория: {section.category_name}</span>}
                    {authorName && <span>Автор: {authorName}</span>}
                </div>
                {section.description && (
                    <p className="mcard__desc">{section.description}</p>
                )}
            </div>
            <div className="mcard__actions">
                <button
                    className="mcard__btn mcard__btn--approve"
                    onClick={() => onApprove(section.id)}
                    disabled={loading}
                >
                    Одобрить
                </button>
                <button
                    className="mcard__btn mcard__btn--reject"
                    onClick={() => onReject(section.id)}
                    disabled={loading}
                >
                    Отклонить
                </button>
            </div>
        </div>
    );
};

/* ── Карточка курса ───────────────────────────────────────────── */
const CourseCard = ({ course }) => {
    const navigate = useNavigate();
    const authorName = course.created_by
        ? `${course.created_by.first_name ?? ''} ${course.created_by.last_name ?? ''}`.trim()
        : null;

    const goToModeration = () => navigate(
        `/moderation/courses/${course.id}`,
        { state: { course, from: '/moderation' } }
    );

    return (
        <div
            className="mcard mcard--link"
            onClick={goToModeration}
            role="button"
            tabIndex={0}
            onKeyDown={e => e.key === 'Enter' && goToModeration()}
        >
            <div className="mcard__accent mcard__accent--course" />
            <div className="mcard__icon mcard__icon--course">
                <IconCourse />
            </div>
            <div className="mcard__body">
                <div className="mcard__top">
                    <span className="mcard__badge mcard__badge--course">Курс</span>
                    <span className="mcard__title">{course.title}</span>
                </div>
                <div className="mcard__meta">
                    {course.section_title && <span>Раздел: {course.section_title}</span>}
                    {authorName && <span>Автор: {authorName}</span>}
                </div>
                {course.description && (
                    <p className="mcard__desc">{course.description}</p>
                )}
            </div>
            <div className="mcard__nav">
                <span className="mcard__nav-label">Просмотреть</span>
                <span className="mcard__nav-arrow">→</span>
            </div>
        </div>
    );
};

/* ── Объединённая вкладка образовательного раздела ───────────── */
const EduModerationTab = () => {
    const [sections, setSections]     = useState([]);
    const [courses,  setCourses]      = useState([]);
    const [loading,  setLoading]      = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [message,  setMessage]      = useState('');

    useEffect(() => {
        const load = async () => {
            try {
                const [sRes, cRes] = await Promise.allSettled([
                    EducationService.requestedSection(),
                    EducationService.getModerationCoursesGlobal(),
                ]);
                if (sRes.status === 'fulfilled') {
                    const sd = sRes.value.data;
                    setSections(Array.isArray(sd) ? sd : (sd?.results ?? []));
                }
                if (cRes.status === 'fulfilled') {
                    const cd = cRes.value.data;
                    setCourses(Array.isArray(cd) ? cd : (cd?.results ?? []));
                }
                if (sRes.status === 'rejected' && cRes.status === 'rejected') {
                    setMessage('Не удалось загрузить данные');
                }
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    const handleApprove = async (id) => {
        setActionLoading(true);
        try {
            await EducationService.approveSection(id);
            setSections(prev => prev.filter(s => s.id !== id));
            setMessage('Раздел одобрен');
        } catch (e) {
            setMessage(e?.response?.data?.detail || 'Ошибка при одобрении');
        } finally {
            setActionLoading(false);
        }
    };

    const handleReject = async (id) => {
        setActionLoading(true);
        try {
            await EducationService.rejectSection(id);
            setSections(prev => prev.filter(s => s.id !== id));
            setMessage('Раздел отклонён');
        } catch (e) {
            setMessage(e?.response?.data?.detail || 'Ошибка при отклонении');
        } finally {
            setActionLoading(false);
        }
    };

    if (loading) return <Loader />;

    const isEmpty = sections.length === 0 && courses.length === 0;

    return (
        <div className="mod-edu-list">
            {message && <p className="mod-edu-message">{message}</p>}
            {isEmpty && !message && (
                <p className="mod-edu-empty">Нет материалов, ожидающих проверки.</p>
            )}

            {sections.length > 0 && (
                <div className="mod-group">
                    <div className="mod-group__header">
                        <span className="mod-group__dot mod-group__dot--section" />
                        Разделы
                        <span className="mod-group__count">{sections.length}</span>
                    </div>
                    {sections.map(s => (
                        <SectionCard
                            key={s.id}
                            section={s}
                            onApprove={handleApprove}
                            onReject={handleReject}
                            loading={actionLoading}
                        />
                    ))}
                </div>
            )}

            {courses.length > 0 && (
                <div className="mod-group">
                    <div className="mod-group__header">
                        <span className="mod-group__dot mod-group__dot--course" />
                        Курсы
                        <span className="mod-group__count">{courses.length}</span>
                    </div>
                    {courses.map(c => (
                        <CourseCard key={c.id} course={c} />
                    ))}
                </div>
            )}
        </div>
    );
};

/* ── Главная страница модерации ──────────────────────────────── */
function Moderation() {
    const [mode, setMode] = useState('articles');

    return (
        <div className="page-wrapper">
            <Helmet>
                <title>Модерация</title>
            </Helmet>
            <div className="mod-page">
                <div className="mod-page__card">
                    <div className="mod-page__card-header">
                        <div className="mod-page__mode-toggle-inner">
                            <button
                                type="button"
                                className={`mod-page__mode-btn${mode === 'articles' ? ' mod-page__mode-btn--active' : ''}`}
                                onClick={() => setMode('articles')}
                            >
                                Статьи
                            </button>
                            <button
                                type="button"
                                className={`mod-page__mode-btn${mode === 'education' ? ' mod-page__mode-btn--active' : ''}`}
                                onClick={() => setMode('education')}
                            >
                                Образовательный раздел
                            </button>
                            <button
                                type="button"
                                className={`mod-page__mode-btn${mode === 'requests' ? ' mod-page__mode-btn--active' : ''}`}
                                onClick={() => setMode('requests')}
                            >
                                Заявки на роль
                            </button>
                        </div>
                    </div>

                    <div className="mod-page__card-body">
                        {mode === 'articles' && (
                            <PostGet
                                fetchMethod={PostService.getModerationList}
                                title="Статьи на модерации"
                                disableScroll="true"
                                typeList="moderation"
                                showHeader={false}
                            />
                        )}
                        {mode === 'education' && <EduModerationTab />}
                        {mode === 'requests' && <RequestRole />}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Moderation;
