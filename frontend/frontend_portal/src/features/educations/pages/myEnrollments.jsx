import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMyEnrollments } from "../hooks/useMyEnrollments";
import Loader from "../../../components/UI/loader/loader";
import iconCube from "../../../img/icon/cube.svg";
import EducationService from "../API/EducationService";

const MyEnrollmentsPage = () => {
    const navigate = useNavigate();
    const { enrollments, isLoading, error } = useMyEnrollments();

    const [activeTab, setActiveTab] = useState('in_progress');
    const [certificates, setCertificates] = useState([]);

    const inProgress = enrollments.filter(e => e.status !== 'completed');
    const completed = enrollments.filter(e => e.status === 'completed');

    useEffect(() => {
        const loadCertificates = async () => {
            try {
                const resp = await EducationService.getMyCertificates();
                const data = resp.data;
                const list = Array.isArray(data) ? data : (data?.results ?? []);
                setCertificates(list || []);
            } catch (e) {
                // сертификаты — необязательная часть UI, поэтому ошибку не показываем
                // eslint-disable-next-line no-console
                console.error('Failed to load certificates', e);
            }
        };

        loadCertificates();
    }, []);

    const getCertificateNumberForEnrollment = (enrollment) => {
        if (!enrollment) return null;
        const course = enrollment.course || {};
        const courseId = enrollment.course_id || course.id;
        if (!courseId || !certificates.length) return null;
        const cert = certificates.find((c) => Number(c.course_id) === Number(courseId));
        return cert?.certificate_number || null;
    };

    const findSectionIdForCourse = async (courseId) => {
        try {
            // загружаем список разделов (берём побольше лимит)
            const sectionsResp = await EducationService.getSection(100, 1);
            const sectionsData = sectionsResp.data;
            const sections = Array.isArray(sectionsData) ? sectionsData : (sectionsData?.results ?? []);

            for (const section of sections) {
                const sectionId = section.id;
                if (!sectionId) continue;

                const coursesResp = await EducationService.getSectionCourses(100, 1, sectionId);
                const coursesData = coursesResp.data;
                const courses = Array.isArray(coursesData) ? coursesData : (coursesData?.results ?? []);

                if (courses.some(c => c.id === courseId)) {
                    return sectionId;
                }
            }
        } catch (e) {
            // eslint-disable-next-line no-console
            console.error('Failed to resolve section for course', e);
        }
        return null;
    };

    const goToCourseProgress = async (enrollment) => {
        if (!enrollment) return;
        const enrollmentId = enrollment.id;
        const course = enrollment.course || {};
        let courseId = enrollment.course_id || course.id;
        if (!courseId) return;

        let sectionId =
            enrollment.section_id ||
            enrollment.course_section_id ||
            course.section_id ||
            (course.section && course.section.id);

        if (!sectionId) {
            sectionId = await findSectionIdForCourse(courseId);
        }

        if (!enrollmentId || !courseId || !sectionId) {
            return;
        }

        navigate(
            `/educations/${sectionId}/courses/${courseId}/progress/${enrollmentId}`,
            {
                state: {
                    enrollmentId,
                    from: '/educations/my-courses',
                }
            }
        );
    };

    if (isLoading && enrollments.length === 0) {
        return (
            <div className="page-wrapper section-page-wrapper">
                <div className="education-section-page">
                    <div className="education-block__loader">
                        <Loader />
                    </div>
                </div>
            </div>
        );
    }

    if (error && enrollments.length === 0) {
        return (
            <div className="page-wrapper section-page-wrapper">
                <div className="education-section-page">
                    <p className="education-block__error">
                        Ошибка загрузки моих курсов: {String(error)}
                    </p>
                </div>
            </div>
        );
    }

    const renderList = (list, withCertificateButton = false) => {
        if (!list.length) {
            return (
                <p className="education-block__empty">
                    Пока нет курсов в этом разделе.
                </p>
            );
        }
        return (
            <ul className="course-modules-list">
                {list.map((enrollment) => (
                    <li
                        key={enrollment.id}
                        className="course-modules-list__item"
                    >
                        <div className="course-modules-list__header-row">
                            {(() => {
                                const certNumber = withCertificateButton
                                    ? getCertificateNumberForEnrollment(enrollment)
                                    : null;
                                return (
                                    <>
                                        <button
                                            type="button"
                                            className="course-modules-list__header"
                                            onClick={() => { goToCourseProgress(enrollment); }}
                                        >
                                            <span className="course-modules-list__title">
                                                {enrollment.course_title}
                                            </span>
                                            {enrollment.progress_percent != null && (
                                                <span className="course-modules-list__status">
                                                    {Math.round(enrollment.progress_percent)}%
                                                </span>
                                            )}
                                        </button>
                                        {withCertificateButton && certNumber && (
                                            <button
                                                type="button"
                                                className="course-progress__continue-btn course-progress__continue-btn--secondary"
                                                onClick={() => {
                                                    navigate(
                                                        `/educations/certificates/${encodeURIComponent(certNumber)}`,
                                                        {
                                                            state: {
                                                                from: '/educations/my-courses',
                                                                certificateNumber: certNumber,
                                                            },
                                                        }
                                                    );
                                                }}
                                            >
                                                Получить сертификат
                                            </button>
                                        )}
                                    </>
                                );
                            })()}
                        </div>
                    </li>
                ))}
            </ul>
        );
    };

    return (
        <div className="page-wrapper section-page-wrapper">
            <div className="education-section-page">
                <div className="section-page-card">
                    <div className="section-page-card__strip" aria-hidden="true" />
                    <div className="section-page-card__body">
                        <div className="section-page-card__head">
                            <div className="section-page-card__icon section-page-card__icon--cube" aria-hidden="true">
                                <span
                                    className="section-page-card__icon-img"
                                    style={{
                                        maskImage: `url(${iconCube})`,
                                        WebkitMaskImage: `url(${iconCube})`,
                                    }}
                                />
                            </div>
                            <h1 className="section-page-card__title">
                                Мои курсы
                            </h1>
                        </div>
                    </div>

                    <div className="section-page-card__content">
                        <div className="course-progress">
                            <div className="account-panel__tabs">
                                <button
                                    type="button"
                                    className={
                                        `account-panel__tab ${activeTab === 'in_progress' ? 'account-panel__tab--active' : ''}`
                                    }
                                    onClick={() => setActiveTab('in_progress')}
                                >
                                    В процессе
                                </button>
                                <button
                                    type="button"
                                    className={
                                        `account-panel__tab ${activeTab === 'completed' ? 'account-panel__tab--active' : ''}`
                                    }
                                    onClick={() => setActiveTab('completed')}
                                >
                                    Завершённые
                                </button>
                            </div>
                            <div className="account-panel__content">
                                {activeTab === 'in_progress'
                                    ? renderList(inProgress, false)
                                    : renderList(completed, true)}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MyEnrollmentsPage;

