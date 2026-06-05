import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useFetching } from '../../../hooks/useFetching';
import Loader from '../../../components/UI/loader/loader';
import educationService from '../../educations/API/EducationService';
import EducationBackLink from '../../educations/components/EducationBackLink';
import ChapterList from '../../educations/components/chapters/chapterList';
import MyModal from '../../../components/UI/MyModal/MyModal';
import iconCube from '../../../img/icon/cube.svg';

const ExpertCourseViewPage = () => {
    const { courseId } = useParams();
    const location = useLocation();
    const navigate = useNavigate();

    const courseFromState = location.state?.course;

    const [sectionId, setSectionId] = useState(courseFromState?.section_id ?? null);
    const [course, setCourse] = useState(null);
    const [resolveError, setResolveError] = useState('');

    const [tally, setTally] = useState(null);
    const [voteLoading, setVoteLoading] = useState(false);
    const [voteError, setVoteError] = useState('');
    const [toast, setToast] = useState('');

    const [rejectModalOpen, setRejectModalOpen] = useState(false);
    const [rejectComment, setRejectComment] = useState('');

    const backPath = location.state?.from || '/moderation';
    const backLabel = backPath === '/moderation' ? 'К экспертизе' : 'Назад';

    // Если sectionId не передан в state — ищем курс в очереди эксперта
    useEffect(() => {
        if (sectionId) return;
        const resolve = async () => {
            try {
                const r = await educationService.getCourseExpertQueue();
                const list = Array.isArray(r.data) ? r.data : (r.data?.results ?? []);
                const found = list.find(c => String(c.id) === String(courseId));
                if (found?.section_id) {
                    setSectionId(found.section_id);
                } else {
                    setResolveError('Откройте курс из очереди экспертизы');
                }
            } catch {
                setResolveError('Не удалось определить раздел курса');
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
            educationService.getCourseExpertReviews(sectionId, courseId)
                .then(res => setTally(res.data?.votes ?? null))
                .catch(() => {});
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [sectionId, courseId]);

    const applyResult = (data) => {
        setTally(data?.votes ?? null);
        if (data?.decision === 'approved') {
            setToast('Одобрено экспертным советом');
        } else if (data?.decision === 'rejected') {
            setToast('Отклонено экспертным советом');
        } else {
            setToast(data?.detail || 'Голос учтён, ждём остальных экспертов');
        }
        setTimeout(() => navigate('/moderation'), 1500);
    };

    const vote = async (decision, comment = '') => {
        setVoteError('');
        setVoteLoading(true);
        try {
            const response = await educationService.expertVoteCourse(sectionId, courseId, decision, comment);
            applyResult(response.data);
        } catch (e) {
            setVoteError(e?.response?.data?.detail || 'Не удалось сохранить голос');
        } finally {
            setVoteLoading(false);
        }
    };

    const handleApprove = () => vote('approve');
    const openRejectModal = () => { setRejectComment(''); setRejectModalOpen(true); };
    const confirmReject = () => { setRejectModalOpen(false); vote('reject', rejectComment.trim()); };

    // ── Навигация по урокам / тестам (просмотр в режиме экспертизы) ──
    const modBackUrl = `/moderation/courses/${courseId}`;
    const handleLessonClick = (lesson, chapter) => {
        if (!lesson || !chapter) return;
        const lessonId = lesson.id ?? lesson.lesson_id;
        const chapterId = chapter.id ?? chapter.chapter_id;
        if (!lessonId || !chapterId) return;
        navigate(
            `/educations/${sectionId}/courses/${courseId}/chapters/${chapterId}/lessons/${lessonId}`,
            { state: { fromProgress: modBackUrl, fromModeration: true } }
        );
    };
    const handleQuizClick = (lesson, chapter) => {
        if (!lesson || !chapter) return;
        const lessonId = lesson.id ?? lesson.lesson_id;
        const chapterId = chapter.id ?? chapter.chapter_id;
        if (!lessonId || !chapterId) return;
        navigate(
            `/educations/${sectionId}/courses/${courseId}/chapters/${chapterId}/lessons/${lessonId}/quiz`,
            { state: { fromProgress: modBackUrl, fromModeration: true } }
        );
    };

    const authorName = courseFromState?.created_by
        ? `${courseFromState.created_by.first_name ?? ''} ${courseFromState.created_by.last_name ?? ''}`.trim()
        : '';

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

    if ((courseError || resolveError) && !course) {
        return (
            <div className="page-wrapper section-page-wrapper">
                <div className="education-section-page">
                    <div className="education-back-link-wrap">
                        <EducationBackLink to={backPath}>{backLabel}</EducationBackLink>
                    </div>
                    <p className="education-block__error">{resolveError || String(courseError)}</p>
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

                {/* Панель эксперта */}
                <div className="mod-bar">
                    <div className="mod-bar__info">
                        <span className="mod-bar__label">Экспертная оценка</span>
                        {authorName && <span className="mod-bar__author">Автор: {authorName}</span>}
                        {tally && (
                            <span className="mod-bar__author">
                                Голоса: за {tally.approve} · против {tally.reject}
                            </span>
                        )}
                    </div>
                    <div className="mod-bar__actions">
                        {voteError && <span className="mod-bar__error">{voteError}</span>}
                        <button
                            className="mod-bar__btn mod-bar__btn--reject"
                            onClick={openRejectModal}
                            disabled={voteLoading || !sectionId}
                        >
                            {voteLoading ? 'Обрабатываем...' : 'Отклонить'}
                        </button>
                        <button
                            className="mod-bar__btn mod-bar__btn--approve"
                            onClick={handleApprove}
                            disabled={voteLoading || !sectionId}
                        >
                            {voteLoading ? 'Обрабатываем...' : 'Принять'}
                        </button>
                    </div>
                </div>

                {/* Карточка курса */}
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
                        </div>
                    </div>

                    <div className="course-page__card-divider" />

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

            {toast && <div className="mod-bar__toast">{toast}</div>}

            <MyModal visible={rejectModalOpen} setVisible={setRejectModalOpen} width="520px">
                <div className="mod-reject-modal">
                    <h3 className="mod-reject-modal__title">Комментарий к отклонению</h3>
                    <textarea
                        className="mod-reject-modal__textarea"
                        placeholder="Почему курс стоит отклонить (необязательно)..."
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

export default ExpertCourseViewPage;
