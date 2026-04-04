import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useFetching } from "../../../hooks/useFetching";
import Loader from "../../../components/UI/loader/loader";
import educationService from "../../educations/API/EducationService";
import EducationBackLink from "../../educations/components/EducationBackLink";
import ChapterList from "../../educations/components/chapters/chapterList";
import MyModal from "../../../components/UI/MyModal/MyModal";
import iconCube from "../../../img/icon/cube.svg";

const ModerationCourseViewPage = () => {
    const { courseId } = useParams();
    const location     = useLocation();
    const navigate     = useNavigate();

    const courseFromState = location.state?.course;

    const [sectionId, setSectionId]     = useState(courseFromState?.section_id ?? null);
    const [course,    setCourse]        = useState(null);
    const [resolving, setResolving]     = useState(!sectionId);
    const [resolveError, setResolveError] = useState('');

    const backPath  = location.state?.from  || '/moderation';
    const backLabel = backPath === '/moderation' ? 'К модерации' : 'Назад';

    const [modLoading, setModLoading] = useState(false);
    const [modError,   setModError]   = useState('');
    const [modToast,   setModToast]   = useState('');

    const [rejectModalOpen, setRejectModalOpen] = useState(false);
    const [rejectComment, setRejectComment] = useState('');

    // Если sectionId нет в state — ищем курс в списке на модерацию
    useEffect(() => {
        if (sectionId) { setResolving(false); return; }
        const resolve = async () => {
            try {
                const r = await educationService.getModerationCoursesGlobal();
                const list = Array.isArray(r.data) ? r.data : (r.data?.results ?? []);
                const found = list.find(c => String(c.id) === String(courseId));
                if (found?.section_id) {
                    setSectionId(found.section_id);
                } else {
                    setResolveError('Не удалось определить раздел для этого курса');
                }
            } catch {
                setResolveError('Ошибка загрузки данных курса');
            } finally {
                setResolving(false);
            }
        };
        resolve();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [courseId]);

    const [fetchCourse, isCourseLoading, courseError] = useFetching(async (sId, cId) => {
        const response = await educationService.getCoursesById(sId, cId);
        setCourse(response.data);
    });

    useEffect(() => {
        if (sectionId != null && courseId != null) {
            fetchCourse(sectionId, courseId);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [sectionId, courseId]);

    // ── Действия модератора ─────────────────────────────────────
    const handleApprove = async () => {
        setModLoading(true);
        setModError('');
        try {
            await educationService.approveCourse(sectionId, courseId);
            setModToast('Курс одобрен и опубликован!');
            setTimeout(() => { navigate('/moderation'); }, 1600);
        } catch (e) {
            setModError(e?.response?.data?.detail || 'Ошибка при обработке');
        } finally {
            setModLoading(false);
        }
    };

    const openRejectModal = () => {
        setRejectComment('');
        setRejectModalOpen(true);
    };

    const confirmReject = async () => {
        setModLoading(true);
        setModError('');
        setRejectModalOpen(false);
        try {
            await educationService.rejectCourse(sectionId, courseId, rejectComment.trim() || undefined);
            setModToast('Курс отклонён.');
            setTimeout(() => { navigate('/moderation'); }, 1600);
        } catch (e) {
            setModError(e?.response?.data?.detail || 'Ошибка при обработке');
        } finally {
            setModLoading(false);
        }
    };

    // ── Навигация по урокам / тестам ────────────────────────────
    const modBackUrl = `/moderation/courses/${courseId}`;

    const handleLessonClick = (lesson, chapter) => {
        if (!lesson || !chapter) return;
        const lessonId  = lesson.id  ?? lesson.lesson_id;
        const chapterId = chapter.id ?? chapter.chapter_id;
        if (!lessonId || !chapterId) return;
        navigate(
            `/educations/${sectionId}/courses/${courseId}/chapters/${chapterId}/lessons/${lessonId}`,
            { state: { fromProgress: modBackUrl, fromModeration: true } }
        );
    };

    const handleQuizClick = (lesson, chapter) => {
        if (!lesson || !chapter) return;
        const lessonId  = lesson.id  ?? lesson.lesson_id;
        const chapterId = chapter.id ?? chapter.chapter_id;
        if (!lessonId || !chapterId) return;
        navigate(
            `/educations/${sectionId}/courses/${courseId}/chapters/${chapterId}/lessons/${lessonId}/quiz`,
            { state: { fromProgress: modBackUrl, fromModeration: true } }
        );
    };

    // ── Рендер загрузки / ошибки ────────────────────────────────
    const authorName = courseFromState?.created_by
        ? `${courseFromState.created_by.first_name ?? ''} ${courseFromState.created_by.last_name ?? ''}`.trim()
        : (courseFromState?.author_username ?? '');

    const isLoading = resolving || isCourseLoading;

    if (isLoading && !course) {
        return (
            <div className="page-wrapper section-page-wrapper">
                <div className="education-section-page">
                    <div className="education-back-link-wrap">
                        <EducationBackLink to={backPath}>{backLabel}</EducationBackLink>
                    </div>
                    <div className="education-block__loader"><Loader /></div>
                </div>
            </div>
        );
    }

    if ((courseError || resolveError) && !course) {
        return (
            <div className="page-wrapper section-page-wrapper">
                <div className="education-section-page">
                    <div className="education-back-link-wrap">
                        <EducationBackLink to={backPath}>{backLabel}</EducationBackLink>
                    </div>
                    <p className="education-block__error">
                        {resolveError || String(courseError)}
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="page-wrapper section-page-wrapper">
            <div className="education-section-page">
                <div className="education-back-link-wrap">
                    <EducationBackLink to={backPath}>{backLabel}</EducationBackLink>
                </div>

                {/* Панель модерации */}
                <div className="mod-bar">
                    <div className="mod-bar__info">
                        <span className="mod-bar__label">Режим модерации</span>
                        {authorName && (
                            <span className="mod-bar__author">Автор: {authorName}</span>
                        )}
                    </div>
                    <div className="mod-bar__actions">
                        {modError && <span className="mod-bar__error">{modError}</span>}
                        <button
                            className="mod-bar__btn mod-bar__btn--reject"
                            onClick={openRejectModal}
                            disabled={modLoading}
                        >
                            Отклонить
                        </button>
                        <button
                            className="mod-bar__btn mod-bar__btn--approve"
                            onClick={handleApprove}
                            disabled={modLoading}
                        >
                            {modLoading ? 'Обрабатываем...' : 'Одобрить'}
                        </button>
                    </div>
                </div>

                {/* Карточка курса — точь-в-точь как в CourseProgress */}
                <div className="course-page__card">
                    <div className="course-page__card-strip" aria-hidden="true" />

                    {/* Шапка */}
                    <div className="course-page__hero course-page__hero--inside">
                        <div className="course-page__hero-icon" aria-hidden="true">
                            <span
                                className="section-page-card__icon-img"
                                style={{ maskImage: `url(${iconCube})`, WebkitMaskImage: `url(${iconCube})` }}
                            />
                        </div>
                        <div className="course-page__hero-info">
                            <h1 className="course-page__hero-title">{course?.title ?? 'Курс'}</h1>
                            {course?.description && (
                                <p className="course-page__hero-desc">{course.description}</p>
                            )}
                        </div>
                    </div>

                    <div className="course-page__card-divider" />

                    {/* Программа курса */}
                    <div className="course-page__body">
                        <div className="course-page__curriculum">
                            <ChapterList
                                sectionId={sectionId}
                                courseId={courseId}
                                bypassLock={true}
                                onLessonClick={handleLessonClick}
                                onQuizClick={handleQuizClick}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {modToast && (
                <div className="mod-bar__toast">{modToast}</div>
            )}

            <MyModal
                visible={rejectModalOpen}
                setVisible={setRejectModalOpen}
                width="520px"
            >
                <div className="mod-reject-modal">
                    <h3 className="mod-reject-modal__title">Причина отклонения</h3>
                    <textarea
                        className="mod-reject-modal__textarea"
                        placeholder="Укажите причину отклонения (необязательно)..."
                        value={rejectComment}
                        onChange={(e) => setRejectComment(e.target.value)}
                        rows={4}
                    />
                    <div className="mod-reject-modal__actions">
                        <button
                            type="button"
                            className="mod-bar__btn mod-bar__btn--cancel"
                            onClick={() => setRejectModalOpen(false)}
                        >
                            Отмена
                        </button>
                        <button
                            type="button"
                            className="mod-bar__btn mod-bar__btn--reject"
                            onClick={confirmReject}
                        >
                            Отклонить
                        </button>
                    </div>
                </div>
            </MyModal>
        </div>
    );
};

export default ModerationCourseViewPage;
