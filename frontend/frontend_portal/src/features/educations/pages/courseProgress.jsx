import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useFetching } from "../../../hooks/useFetching";
import Loader from "../../../components/UI/loader/loader";
import educationService from "../API/EducationService";
import EducationBackLink from "../components/EducationBackLink";
import ChapterList from "../components/chapters/chapterList";
import { useUser } from "../../../hooks/useUser";
import iconCube from "../../../img/icon/cube.svg";
import CoursesReview from "../components/courses/Review/coursesReview";
import CoursesStats from "../components/courses/coursesStats";
import {Helmet} from "react-helmet";

const getCourseBackLabel = (fromPath) => {
    if (!fromPath) return 'К разделу';
    if (fromPath === '/account') return 'В аккаунт';
    if (fromPath === '/educations/my-courses') return 'Мои курсы';
    if (fromPath.includes('/courses')) return 'К курсам';
    return 'К разделу';
};

const CourseProgress = () => {
    const params = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const { user } = useUser();

    const sectionId = params.id;
    const courseId = params.courseId;
    const enrollmentIdFromParams = params.enrollmentId || params.enrollId || params.enrollment_id;
    const enrollmentIdFromState = location.state?.enrollmentId || location.state?.enrollment_id;
    const enrollmentId = enrollmentIdFromParams || enrollmentIdFromState || null;

    const backPath = location.state?.from || (sectionId ? `/educations/${sectionId}` : '/educations');
    const backLabel = getCourseBackLabel(backPath);
    const role = useMemo(() => localStorage.getItem('role') || 'user', []);

    const [course, setCourse] = useState(null);
    const [fetchCourse, isCourseLoading, courseError] = useFetching(async (sId, cId) => {
        const response = await educationService.getCoursesById(sId, cId);
        setCourse(response.data);
    });

    const [progress, setProgress] = useState(null);
    const [isProgressLoading, setIsProgressLoading] = useState(false);

    useEffect(() => {
        if (sectionId != null && courseId != null) {
            fetchCourse(sectionId, courseId);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [sectionId, courseId]);

    useEffect(() => {
        const fetchProgress = async () => {
            if (!enrollmentId) {
                setProgress(null);
                return;
            }
            try {
                setIsProgressLoading(true);
                const response = await educationService.getProgressMyCourses(enrollmentId);
                setProgress(response.data);
            } catch (error) {
                console.error('Failed to load enrollment progress', error);
            } finally {
                setIsProgressLoading(false);
            }
        };
        fetchProgress();
    }, [enrollmentId]);

    const lessonProgressMap = useMemo(() => {
        const map = {};
        if (progress && Array.isArray(progress.chapter_progresses)) {
            for (const ch of progress.chapter_progresses) {
                if (Array.isArray(ch.lesson_progresses)) {
                    for (const lp of ch.lesson_progresses) {
                        if (lp.lesson_id != null) map[lp.lesson_id] = lp;
                    }
                }
            }
        }
        return map;
    }, [progress]);

    const chapterProgressMap = useMemo(() => {
        const map = {};
        if (progress && Array.isArray(progress.chapter_progresses)) {
            for (const ch of progress.chapter_progresses) {
                if (ch.chapter_id != null) map[ch.chapter_id] = ch;
            }
        }
        return map;
    }, [progress]);

    const quizCompletionBuckets = useMemo(() => {
        if (!progress || !Array.isArray(progress.chapter_progresses)) {
            return { buckets: [], maxCount: 0 };
        }

        const days = 30;
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const buckets = [];
        const indexByKey = {};

        const toLocalKey = (date) => {
            const y = date.getFullYear();
            const m = String(date.getMonth() + 1).padStart(2, '0');
            const d = String(date.getDate()).padStart(2, '0');
            return `${y}-${m}-${d}`;
        };

        for (let i = days - 1; i >= 0; i -= 1) {
            const d = new Date(today);
            d.setDate(d.getDate() - i);
            const key = toLocalKey(d);
            const bucket = { key, date: d, count: 0 };
            indexByKey[key] = buckets.length;
            buckets.push(bucket);
        }

        for (const ch of progress.chapter_progresses) {
            if (!Array.isArray(ch.lesson_progresses)) continue;
            for (const lp of ch.lesson_progresses) {
                if (!lp.is_completed || !lp.completed_at) continue;
                const completedDate = new Date(lp.completed_at);
                const key = toLocalKey(completedDate);
                const idx = indexByKey[key];
                if (idx != null) buckets[idx].count += 1;
            }
        }

        const maxCount = buckets.reduce((max, b) => (b.count > max ? b.count : max), 0);
        return { buckets, maxCount };
    }, [progress]);

    const rawProgressPercent = progress?.progress_percent ?? 0;
    const clampedProgressPercent = Math.max(0, Math.min(100, Math.round(rawProgressPercent)));
    const progressAngle = (clampedProgressPercent / 100) * 360;
    const circleBackground =
        clampedProgressPercent === 0
            ? 'conic-gradient(rgba(148, 163, 184, 0.25) 0deg 360deg)'
            : `conic-gradient(var(--color-primary) 0deg ${progressAngle}deg, rgba(148, 163, 184, 0.25) ${progressAngle}deg 360deg)`;

    const isLoading = isCourseLoading || isProgressLoading;

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

    if (courseError && !course) {
        return (
            <div className="page-wrapper section-page-wrapper">
                <div className="education-section-page">
                    <div className="education-back-link-wrap">
                        <EducationBackLink to={backPath}>{backLabel}</EducationBackLink>
                    </div>
                    <p className="education-block__error">Ошибка: {String(courseError)}</p>
                </div>
            </div>
        );
    }

    const handleLessonClick = (lesson, chapter) => {
        if (!lesson || !chapter) return;
        const lessonId = lesson.id ?? lesson.lesson_id;
        const chapterId = chapter.id ?? chapter.chapter_id;
        if (!lessonId || !chapterId) return;
        navigate(`/educations/${sectionId}/courses/${courseId}/chapters/${chapterId}/lessons/${lessonId}`, {
            state: { enrollmentId },
        });
    };

    const handleQuizClick = (lesson, chapter) => {
        if (!lesson || !chapter) return;
        const lessonId = lesson.id ?? lesson.lesson_id;
        const chapterId = chapter.id ?? chapter.chapter_id;
        if (!lessonId || !chapterId) return;
        navigate(`/educations/${sectionId}/courses/${courseId}/chapters/${chapterId}/lessons/${lessonId}/quiz`, {
            state: {
                enrollmentId,
                fromProgress: `/educations/${sectionId}/courses/${courseId}/progress/${enrollmentId}`,
            },
        });
    };

    const handleContinue = () => {
        if (!progress || !Array.isArray(progress.chapter_progresses)) return;
        const flat = [];
        for (const ch of progress.chapter_progresses) {
            if (!Array.isArray(ch.lesson_progresses)) continue;
            for (const lp of ch.lesson_progresses) {
                flat.push({ chapter_id: ch.chapter_id, chapter_order: ch.chapter_order ?? 0, ...lp });
            }
        }
        if (flat.length === 0) return;
        flat.sort((a, b) => {
            if (a.chapter_order !== b.chapter_order) return a.chapter_order - b.chapter_order;
            return (a.lesson_order ?? 0) - (b.lesson_order ?? 0);
        });
        let target = flat.find(item => !item.is_completed);
        if (!target) target = flat[flat.length - 1];
        if (!target) return;
        navigate(`/educations/${sectionId}/courses/${courseId}/chapters/${target.chapter_id}/lessons/${target.lesson_id}`, {
            state: { enrollmentId },
        });
    };

    // Считаем кол-во завершённых и общее кол-во уроков
    const totalLessons = Object.keys(lessonProgressMap).length;
    const doneLessons = Object.values(lessonProgressMap).filter(lp => lp.is_completed).length;

    const ownerId = course?.created_by?.id ?? course?.created_by_id ?? course?.author?.id ?? course?.user?.id;
    const canEdit = role === 'admin' || (ownerId != null && user?.id != null && Number(ownerId) === Number(user.id));
    const openEdit = () =>
        navigate(
            `/educations/${sectionId}/courses/${courseId}/edit`,
            { state: { from: location.state?.from || location.pathname } }
        );

    return (
        <div className="page-wrapper section-page-wrapper">
            <Helmet>
                <title>{course?.title}</title>
            </Helmet>
            <div className="education-section-page">
                <div className="education-back-link-wrap">
                    <EducationBackLink to={backPath}>{backLabel}</EducationBackLink>
                </div>

                {/* Единый белый блок */}
                <div className="course-page__card">
                    <div className="course-page__card-strip" aria-hidden="true" />

                    {/* Шапка */}
                    <div className="course-page__hero course-page__hero--inside">
                        <div className="course-page__hero-icon course-page__hero-icon--circle" aria-hidden="true">
                            {progress ? (
                                <div
                                    className="course-progress-circle"
                                    aria-label={`Прогресс курса: ${clampedProgressPercent}%`}
                                >
                                    <div
                                        className="course-progress-circle__ring"
                                        style={{ background: circleBackground }}
                                    />
                                    <div className="course-progress-circle__inner">
                                        <span className="course-progress-circle__value">
                                            {clampedProgressPercent}%
                                        </span>
                                    </div>
                                </div>
                            ) : (
                                <span
                                    className="section-page-card__icon-img"
                                    style={{ maskImage: `url(${iconCube})`, WebkitMaskImage: `url(${iconCube})` }}
                                />
                            )}
                        </div>
                        <div className="course-page__hero-info">
                            <h1 className="course-page__hero-title">{course?.title ?? 'Курс'}</h1>
                            {course?.description && (
                                <p className="course-page__hero-desc">{course.description}</p>
                            )}
                            {totalLessons > 0 && (
                                <p className="course-page__hero-stat">
                                    Пройдено {doneLessons} из {totalLessons} уроков
                                </p>
                            )}
                        </div>
                        <CoursesStats sectionId={sectionId} courseId={courseId} />
                            {canEdit && (
                                <button
                                    type="button"
                                    className="edu-create__save-btn edu-create__save-btn--draft"
                                    onClick={openEdit}
                                >
                                    Редактировать
                                </button>
                            )}
                            {progress && (
                                <button
                                    type="button"
                                    className="course-page__btn course-page__btn--primary"
                                    onClick={handleContinue}
                                >
                                    Продолжить →
                                </button>
                            )}
                    </div>

                    <div className="course-page__card-divider" />

                    {/* Основной контент: главы + диаграмма */}
                    <div className="course-page__body course-page__body--with-sidebar">
                        <div className="course-page__curriculum">
                            <ChapterList
                                sectionId={sectionId}
                                courseId={courseId}
                                chapterProgressMap={chapterProgressMap}
                                lessonProgressMap={lessonProgressMap}
                                onLessonClick={(lesson, chapter) => handleLessonClick(lesson, chapter)}
                                onQuizClick={(lesson, chapter) => handleQuizClick(lesson, chapter)}
                            />
                        </div>

                        {/* Боковая панель с диаграммой */}
                        <aside className="course-page__sidebar">
                            <div className="course-page__chart-card">
                                <div className="course-page__chart-title">
                                    30-дневный отчёт по задачам
                                </div>
                                <div className="course-progress-chart">
                                    {quizCompletionBuckets.buckets.slice().reverse().map((bucket) => {
                                        const max = quizCompletionBuckets.maxCount || 1;
                                        const ratio = bucket.count / max;
                                        const height = 8 + ratio * 40;
                                        return (
                                            <div
                                                key={bucket.key}
                                                className="course-progress-chart__bar-wrap"
                                            >
                                                <div
                                                    className="course-progress-chart__bar"
                                                    style={{
                                                        height: `${height}px`,
                                                        opacity: bucket.count ? 1 : 0.25,
                                                    }}
                                                    title={`${bucket.key}: ${bucket.count || 0} тест(ов)`}
                                                />
                                            </div>
                                        );
                                    })}
                                </div>
                                <div className="course-progress-chart__axis">
                                    <span>Сегодня</span>
                                    <span>30 дн</span>
                                </div>
                            </div>
                        </aside>
                    </div>
                </div>
                <CoursesReview courseId={courseId} addReview={true}/>
            </div>
        </div>
    );
};

export default CourseProgress;
