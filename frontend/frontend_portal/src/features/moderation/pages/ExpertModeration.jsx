import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import PostService from '../../posts/API/PostService';
import PostGet from '../../posts/components/PostGet';
import EducationService from '../../educations/API/EducationService';
import Loader from '../../../components/UI/loader/loader';

/* ── Иконка курса ─────────────────────────────────────────────── */
const IconCourse = () => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M8 2L2 5l6 3 6-3-6-3z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
        <path d="M2 8l6 3 6-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M2 11l6 3 6-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
);

/* ── Карточка курса в очереди эксперта ────────────────────────── */
const CourseCard = ({ course }) => {
    const navigate = useNavigate();
    const authorName = course.created_by
        ? `${course.created_by.first_name ?? ''} ${course.created_by.last_name ?? ''}`.trim()
        : null;

    const open = () => navigate(
        `/moderation/courses/${course.id}`,
        { state: { course, from: '/moderation' } }
    );

    return (
        <div
            className="mcard mcard--link"
            onClick={open}
            role="button"
            tabIndex={0}
            onKeyDown={e => e.key === 'Enter' && open()}
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
                <span className="mcard__nav-label">Оценить</span>
                <span className="mcard__nav-arrow">→</span>
            </div>
        </div>
    );
};

/* ── Вкладка курсов ───────────────────────────────────────────── */
const ExpertCoursesTab = () => {
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState('');

    useEffect(() => {
        const load = async () => {
            try {
                const res = await EducationService.getCourseExpertQueue();
                const data = res.data;
                setCourses(Array.isArray(data) ? data : (data?.results ?? []));
            } catch (e) {
                setMessage('Не удалось загрузить очередь курсов');
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    if (loading) return <Loader />;

    return (
        <div className="mod-edu-list">
            {message && <p className="mod-edu-message">{message}</p>}
            {!message && courses.length === 0 && (
                <p className="mod-edu-empty">Нет курсов, ожидающих вашей оценки.</p>
            )}
            {courses.length > 0 && (
                <div className="mod-group">
                    <div className="mod-group__header">
                        <span className="mod-group__dot mod-group__dot--course" />
                        Курсы
                        <span className="mod-group__count">{courses.length}</span>
                    </div>
                    {courses.map(c => <CourseCard key={c.id} course={c} />)}
                </div>
            )}
        </div>
    );
};

/* ── Главная страница экспертной модерации ────────────────────── */
function ExpertModeration() {
    const [mode, setMode] = useState('articles');

    return (
        <div className="page-wrapper">
            <Helmet>
                <title>Экспертиза</title>
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
                                className={`mod-page__mode-btn${mode === 'courses' ? ' mod-page__mode-btn--active' : ''}`}
                                onClick={() => setMode('courses')}
                            >
                                Курсы
                            </button>
                        </div>
                    </div>

                    <div className="mod-page__card-body">
                        {mode === 'articles' && (
                            <PostGet
                                fetchMethod={PostService.getExpertQueue}
                                title="Статьи на экспертизе"
                                disableScroll="true"
                                typeList="moderation"
                                showHeader={false}
                            />
                        )}
                        {mode === 'courses' && <ExpertCoursesTab />}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ExpertModeration;
