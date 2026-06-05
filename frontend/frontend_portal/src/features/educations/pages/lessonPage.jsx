import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useFetching } from "../../../hooks/useFetching";
import Loader from "../../../components/UI/loader/loader";
import ArticleViewer from "../../../components/UI/MyEditor/ArticleViewer";
import educationService from "../API/EducationService";
import {Helmet} from "react-helmet";
import LessonCommentsList from "../components/lessons/LessonCommentsList";

const plainTextToDoc = (text) => {
    if (text == null || text === '') return null;
    if (typeof text !== 'string') return text;
    try {
        const parsed = JSON.parse(text);
        if (parsed && typeof parsed === 'object') return parsed;
    } catch (_) {}
    return {
        type: 'doc',
        content: [{ type: 'paragraph', content: [{ type: 'text', text }] }]
    };
};

const LessonPage = () => {
    const params = useParams();
    const location = useLocation();
    const navigate = useNavigate();

    const sectionId = params.id;
    const courseId = params.courseId;
    const chapterId = params.chapterId;
    const lessonId = params.lessonId;

    const enrollmentIdFromState = location.state?.enrollmentId || location.state?.enrollment_id;
    const enrollmentId = enrollmentIdFromState || null;
    const fromModeration = location.state?.fromModeration === true;

    const backPath =
        location.state?.fromProgress ||
        (sectionId && courseId && enrollmentId
            ? `/educations/${sectionId}/courses/${courseId}/progress/${enrollmentId}`
            : (sectionId ? `/educations/${sectionId}` : '/educations'));

    const backLabel = fromModeration
        ? 'К модерации'
        : (enrollmentId ? 'Назад к прогрессу' : 'Назад');

    const [lesson, setLesson] = useState(null);
    const [fetchLesson, isLessonLoading, lessonError] = useFetching(async () => {
        const response = await educationService.getLessonsById(sectionId, courseId, chapterId, lessonId);
        setLesson(response.data);
    });

    const [isFinishing, setIsFinishing] = useState(false);
    const [progress, setProgress] = useState(null);

    useEffect(() => {
        if (sectionId != null && courseId != null && chapterId != null && lessonId != null) {
            fetchLesson();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [sectionId, courseId, chapterId, lessonId]);

    useEffect(() => {
        const loadProgress = async () => {
            if (!enrollmentId) {
                setProgress(null);
                return;
            }
            try {
                const resp = await educationService.getProgressMyCourses(enrollmentId);
                setProgress(resp.data);
            } catch (e) {
                // прогресс не критичен для отображения лекции
                // eslint-disable-next-line no-console
                console.error('Failed to load lesson progress', e);
            }
        };
        loadProgress();
    }, [enrollmentId]);

    const contentForViewer = plainTextToDoc(lesson?.content ?? '');

    const goBackToProgress = () => {
        if (sectionId && courseId && enrollmentId) {
            navigate(`/educations/${sectionId}/courses/${courseId}/progress/${enrollmentId}`, {
                state: { enrollmentId },
            });
        } else {
            navigate(backPath);
        }
    };

    const getFlatLessonsFromProgress = (prog) => {
        if (!prog || !Array.isArray(prog.chapter_progresses)) {
            return [];
        }

        const flat = [];
        for (const ch of prog.chapter_progresses) {
            if (!Array.isArray(ch.lesson_progresses)) continue;
            for (const lp of ch.lesson_progresses) {
                flat.push({
                    chapter_id: ch.chapter_id,
                    chapter_order: ch.chapter_order ?? 0,
                    ...lp,
                });
            }
        }
        flat.sort((a, b) => {
            if (a.chapter_order !== b.chapter_order) {
                return a.chapter_order - b.chapter_order;
            }
            return (a.lesson_order ?? 0) - (b.lesson_order ?? 0);
        });
        return flat;
    };

    const navigateToNextFromProgress = (prog) => {
        const flat = getFlatLessonsFromProgress(prog);
        if (flat.length === 0) {
            goBackToProgress();
            return;
        }
        let target = flat.find(item => !item.is_completed);
        if (!target) {
            target = flat[flat.length - 1];
        }

        navigate(
            `/educations/${sectionId}/courses/${courseId}/chapters/${target.chapter_id}/lessons/${target.lesson_id}`,
            {
                state: {
                    enrollmentId,
                    fromProgress: `/educations/${sectionId}/courses/${courseId}/progress/${enrollmentId}`,
                },
            }
        );
    };

    const finishAndGoNext = async () => {
        if (!enrollmentId || !lessonId) {
            return;
        }

        try {
            setIsFinishing(true);
            await educationService.completeLessons(enrollmentId, Number(lessonId));

            const progressResponse = await educationService.getProgressMyCourses(enrollmentId);
            const newProgress = progressResponse.data;
            setProgress(newProgress);
            navigateToNextFromProgress(newProgress);
        } catch (error) {
            // eslint-disable-next-line no-console
            console.error('Failed to complete lesson or navigate to next', error);
        } finally {
            setIsFinishing(false);
        }
    };

    const goNextIfCompleted = async () => {
        if (!enrollmentId) {
            return;
        }

        if (progress) {
            navigateToNextFromProgress(progress);
            return;
        }

        try {
            setIsFinishing(true);
            const resp = await educationService.getProgressMyCourses(enrollmentId);
            const fresh = resp.data;
            setProgress(fresh);
            navigateToNextFromProgress(fresh);
        } catch (error) {
            // eslint-disable-next-line no-console
            console.error('Failed to navigate to next lesson', error);
        } finally {
            setIsFinishing(false);
        }
    };

    const { isCurrentCompleted, isEndOfCourse } = (() => {
        if (!progress || !Array.isArray(progress.chapter_progresses)) {
            return { isCurrentCompleted: false, isEndOfCourse: false };
        }
        const currentLessonId = Number(lessonId);
        const flat = getFlatLessonsFromProgress(progress);
        if (flat.length === 0) {
            return { isCurrentCompleted: false, isEndOfCourse: false };
        }
        const currentIndex = flat.findIndex(l => Number(l.lesson_id) === currentLessonId);
        const current = currentIndex !== -1 ? flat[currentIndex] : null;
        const anyNotCompleted = flat.some(l => !l.is_completed);
        const isLastIndex = currentIndex !== -1 && currentIndex === flat.length - 1;

        const currentCompleted = !!current?.is_completed;
        const endOfCourse = currentCompleted && !anyNotCompleted && isLastIndex;

        return { isCurrentCompleted: currentCompleted, isEndOfCourse: endOfCourse };
    })();

    if (isLessonLoading && !lesson) {
        return (
            <div className="page-wrapper section-page-wrapper">
                <div className="education-section-page">
                    {sectionId && (
                        <div className="education-back-link-wrap">
                            <button
                                type="button"
                                className="education-back-link"
                                onClick={goBackToProgress}
                            >
                                <span className="education-back-link__icon" aria-hidden="true">←</span>
                                {backLabel}
                            </button>
                        </div>
                    )}
                    <div className="education-block__loader">
                        <Loader />
                    </div>
                </div>
            </div>
        );
    }

    if (lessonError && !lesson) {
        return (
            <div className="page-wrapper section-page-wrapper">
                <div className="education-section-page">
                    {sectionId && (
                        <div className="education-back-link-wrap">
                            <button
                                type="button"
                                className="education-back-link"
                                onClick={goBackToProgress}
                            >
                                <span className="education-back-link__icon" aria-hidden="true">←</span>
                                {backLabel}
                            </button>
                        </div>
                    )}
                    <p className="education-block__error">Ошибка: {String(lessonError)}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="page-wrapper section-page-wrapper">
            <Helmet>
                <title>{lesson?.title || 'Лекция'}</title>
            </Helmet>
            <div className="education-section-page">
                {sectionId && (
                    <div className="education-back-link-wrap">
                        <button
                            type="button"
                            className="education-back-link"
                            onClick={goBackToProgress}
                        >
                            <span className="education-back-link__icon" aria-hidden="true">←</span>
                            {backLabel}
                        </button>
                    </div>
                )}
                <div className="section-page-card">
                    <div className="section-page-card__strip" aria-hidden="true" />
                    <div className="section-page-card__body">
                        <div className="section-page-card__head">
                            <div className="section-page-card__icon" aria-hidden="true">
                                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                     strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                                    <polyline points="14 2 14 8 20 8"/>
                                    <line x1="16" y1="13" x2="8" y2="13"/>
                                    <line x1="16" y1="17" x2="8" y2="17"/>
                                    <polyline points="10 9 9 9 8 9"/>
                                </svg>
                            </div>
                            <h1 className="section-page-card__title">
                                {lesson?.title || 'Лекция'}
                            </h1>
                        </div>
                    </div>
                    <div className="section-page-card__content section-page-card__content--lecture">
                        <div className="post-article-card">
                            <ArticleViewer
                                articleTitle=""
                                articleContent={contentForViewer != null ? contentForViewer : ''}
                                images={[]}
                            />
                        </div>

                        {enrollmentId && (
                            <div className="section-page-card__actions">
                                {lesson?.has_quiz ? (
                                    <button
                                        type="button"
                                        className="course-progress__continue-btn"
                                        onClick={() => navigate(
                                            `/educations/${sectionId}/courses/${courseId}/chapters/${chapterId}/lessons/${lessonId}/quiz`,
                                            { state: { enrollmentId } }
                                        )}
                                    >
                                        Пройти тест
                                    </button>
                                ) : (
                                    <button
                                        type="button"
                                        className="course-progress__continue-btn"
                                        onClick={
                                            isEndOfCourse
                                                ? goBackToProgress
                                                : (isCurrentCompleted ? goNextIfCompleted : finishAndGoNext)
                                        }
                                        disabled={isFinishing}
                                    >
                                        {isFinishing
                                            ? 'Завершаем...'
                                            : isEndOfCourse
                                                ? 'Завершить курс'
                                                : (isCurrentCompleted ? 'Следующий урок' : 'Завершить урок')}
                                    </button>
                                )}
                            </div>
                        )}

                    </div>
                </div>

                {!fromModeration && (
                    <div className="section-page-card" style={{ marginTop: '16px' }}>
                        <div className="section-page-card__content">
                            <LessonCommentsList
                                sectionId={sectionId}
                                courseId={courseId}
                                chapterId={chapterId}
                                lessonId={lessonId}
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default LessonPage;

