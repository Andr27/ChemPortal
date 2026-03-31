import React, { useContext, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useFetching } from "../../../hooks/useFetching";
import Loader from "../../../components/UI/loader/loader";
import educationService from "../API/EducationService";
import EducationBackLink from "../components/EducationBackLink";
import ChapterList from "../components/chapters/chapterList";
import { AuthContext } from "../../../context";
import { useUser } from "../../../hooks/useUser";
import iconCube from "../../../img/icon/cube.svg";
import CoursesReview from "../components/courses/Review/coursesReview";
import StarRating from "../components/starRating";
import CoursesStats from "../components/courses/coursesStats";
import {useToast} from "../../../components/UI/Toast/ToastContext";
import {Helmet} from "react-helmet";

const getCourseBackLabel = (fromPath) => {
    if (!fromPath) return 'К разделу';
    if (fromPath === '/account') return 'В аккаунт';
    if (fromPath.includes('/courses')) return 'К курсам';
    return 'К разделу';
};

const CoursePage = () => {
    const params = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const { isAuth } = useContext(AuthContext);
    const { user } = useUser();
    const sectionId = params.id;
    const courseId = params.courseId;
    const backPath = location.state?.from || (sectionId ? `/educations/${sectionId}` : '/educations');
    const backLabel = getCourseBackLabel(backPath);
    const toast = useToast();
    const [course, setCourse] = useState(null);
    const [fetchCourse, isCourseLoading, courseError] = useFetching(async (sId, cId) => {
        const response = await educationService.getCoursesById(sId, cId);
        setCourse(response.data);
    });

    const [isEnrolled, setIsEnrolled] = useState(false);
    const [enrollmentId, setEnrollmentId] = useState(null);
    const [loading, setLoading] = useState(false);
    const role = useMemo(() => localStorage.getItem('role') || 'user', []);

    useEffect(() => {
        const checkEnrollment = async () => {
            if (!courseId) return;
            try {
                setLoading(true);
                const response = await educationService.getMyEnrollments();
                const data = response.data;
                const list = Array.isArray(data) ? data : (data?.results ?? []);
                const enrollment = list.find((enr) => {
                    const enrolledCourseId = enr.course_id ?? enr.course?.id ?? enr.course;
                    return String(enrolledCourseId) === String(courseId);
                });
                if (enrollment) {
                    setIsEnrolled(true);
                    setEnrollmentId(enrollment.id);
                } else {
                    setIsEnrolled(false);
                    setEnrollmentId(null);
                }
            } catch (error) {
                console.error('Failed to check course enrollment', error);
            } finally {
                setLoading(false);
            }
        };
        checkEnrollment();
    }, [sectionId, courseId]);

    const enrollCourse = async () => {
        if (!course && !courseId) return;
        try {
            setLoading(true);
            await educationService.enrollCourse(course?.id ?? Number(courseId));
            const response = await educationService.getMyEnrollments();
            const data = response.data;
            const list = Array.isArray(data) ? data : (data?.results ?? []);
            const enrollment = list.find((enr) => {
                const enrolledCourseId = enr.course_id ?? enr.course?.id ?? enr.course;
                return String(enrolledCourseId) === String(courseId);
            });
            if (enrollment) {
                setIsEnrolled(true);
                setEnrollmentId(enrollment.id);
                toast.success('Вы записаны на курс!');
                navigate(`/educations/${sectionId}/courses/${courseId}/progress/${enrollment.id}`, {
                    state: { from: location.pathname, enrollmentId: enrollment.id }
                });
            } else {
                setIsEnrolled(true);
                toast.success('Вы записаны на курс!');
            }
        } catch (error) {
            toast.error('Не удалось записаться на курс');
        } finally {
            setLoading(false);
        }
    };

    const handleContinue = () => {
        if (!enrollmentId) return;
        navigate(`/educations/${sectionId}/courses/${courseId}/progress/${enrollmentId}`, {
            state: { from: backPath, enrollmentId }
        });
    };

    useEffect(() => {
        if (isEnrolled && enrollmentId) {
            handleContinue();
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isEnrolled, enrollmentId]);

    useEffect(() => {
        if (sectionId != null && courseId != null) {
            fetchCourse(sectionId, courseId);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [sectionId, courseId]);

    if (isCourseLoading && !course) {
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

    const ownerId = course?.created_by?.id ?? course?.created_by_id ?? course?.author?.id ?? course?.user?.id;
    const canEdit = role === 'admin' || (ownerId != null && user?.id != null && Number(ownerId) === Number(user.id));
    const openEdit = () => navigate(
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

                <div className="course-page__card">
                    <div className="course-page__card-strip" aria-hidden="true" />

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
                            <StarRating rating={course?.rating} />
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
                        <div className="course-page__hero-action">
                            {isAuth ? (
                                isEnrolled ? (
                                    <button
                                        type="button"
                                        className="course-page__btn course-page__btn--primary"
                                        disabled={loading || !enrollmentId}
                                        onClick={handleContinue}
                                    >
                                        Продолжить курс →
                                    </button>
                                ) : (
                                    <button
                                        type="button"
                                        className="course-page__btn course-page__btn--enroll"
                                        onClick={enrollCourse}
                                        disabled={loading}
                                    >
                                        {loading ? 'Записываем...' : 'Записаться на курс'}
                                    </button>
                                )
                            ) : (
                                <span className="course-page__auth-hint">
                                    Авторизируйтесь, чтобы начать курс
                                </span>
                            )}


                        </div>
                    </div>

                    {course?.status !== 'published' && course?.reject_comment && (
                        <div className="reject-comment-banner" style={{ margin: '0 24px' }}>
                            <span className="reject-comment-banner__icon">⚠</span>
                            <div className="reject-comment-banner__body">
                                <span className="reject-comment-banner__title">Причина отклонения</span>
                                <span className="reject-comment-banner__text">{course.reject_comment}</span>
                            </div>
                        </div>
                    )}

                    <div className="course-page__card-divider" />

                    <div className="course-page__body">
                        <div className="course-page__curriculum">
                            <ChapterList sectionId={sectionId} courseId={courseId} hideLockUI={true} />
                        </div>
                    </div>
                </div>
                <CoursesReview courseId={courseId} addReview={false}/>
            </div>
        </div>
    );
};

export default CoursePage;
