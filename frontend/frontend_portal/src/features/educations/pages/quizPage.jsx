import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import Loader from "../../../components/UI/loader/loader";
import MyModal from "../../../components/UI/MyModal/MyModal";
import educationService from "../API/EducationService";

const QuizPage = () => {
    const params = useParams();
    const location = useLocation();
    const navigate = useNavigate();

    const sectionId = params.id;
    const courseId = params.courseId;
    const chapterId = params.chapterId;
    const lessonId = params.lessonId;

    const enrollmentIdFromState = location.state?.enrollmentId || location.state?.enrollment_id;
    const enrollmentId = enrollmentIdFromState || null;
    const fromProgressPath  = location.state?.fromProgress  || null;
    const fromModeration    = location.state?.fromModeration === true;
    const role = useMemo(() => localStorage.getItem('role') || 'user', []);
    const canSeeCorrectAnswers = fromModeration || role === 'admin' || role === 'creator';

    const backToLessonPath = `/educations/${sectionId}/courses/${courseId}/chapters/${chapterId}/lessons/${lessonId}`;

    // Куда вести кнопку "Назад": moderation > progress > lesson
    const resolvedBackPath = fromProgressPath || backToLessonPath;
    const resolvedBackState = fromModeration
        ? { fromModeration: true }
        : { enrollmentId };
    const backButtonLabel = fromModeration
        ? 'К модерации'
        : (fromProgressPath && enrollmentId ? 'Назад к прогрессу' : 'Назад к уроку');

    const [quiz, setQuiz] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [answers, setAnswers] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitResult, setSubmitResult] = useState(null);
    const [hasStarted, setHasStarted] = useState(false);
    const [timeLeft, setTimeLeft] = useState(null);
    const [currentAttempt, setCurrentAttempt] = useState(null);
    const [attemptsUsed, setAttemptsUsed] = useState(0);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [confirmSubmitVisible, setConfirmSubmitVisible] = useState(false);
    const [quizAttempts, setQuizAttempts] = useState([]);

    useEffect(() => {
        const loadQuiz = async () => {
            setIsLoading(true);
            setError(null);
            try {
                // Ищем тест по уроку (спец. endpoint)
                let baseQuiz = null;
                try {
                    const byLessonResp = await educationService.getQuizByLesson({ lesson_id: lessonId });
                    baseQuiz = byLessonResp?.data || null;
                    const lessonRef = baseQuiz?.lesson?.id ?? baseQuiz?.lesson;
                    if (!baseQuiz?.id || String(lessonRef ?? '') !== String(lessonId)) {
                        baseQuiz = null;
                    }
                } catch (_) {
                    baseQuiz = null;
                }

                // если режим модерации — пробуем найти тест в очереди модерации
                if (!baseQuiz && fromModeration) {
                    try {
                        const modResp = await educationService.getModerationQuizzes();
                        const modData = modResp.data;
                        const modList = Array.isArray(modData) ? modData : (modData?.results ?? []);
                        const found = modList.find((q) => {
                            const lessonRef = q?.lesson?.id ?? q?.lesson;
                            return lessonRef != null && String(lessonRef) === String(lessonId);
                        });
                        if (found?.id) {
                            baseQuiz = found;
                        }
                    } catch (_) {
                        // ignore
                    }
                }

                // fallback на старый список, если спец endpoint недоступен
                if (!baseQuiz) {
                    const listResp = await educationService.getQuizzes({ lesson_id: lessonId });
                    const listData = listResp.data;
                    const list = Array.isArray(listData) ? listData : (listData?.results ?? []);
                    baseQuiz = list?.[0] || null;
                }

                if (!baseQuiz?.id) {
                    setError('Тест для этого урока пока недоступен.');
                    return;
                }

                const quizId = baseQuiz.id;

                // Получаем полные данные теста с вопросами
                const quizResp = canSeeCorrectAnswers
                    ? await educationService.getQuizAdminDetail(quizId)
                    : await educationService.getQuizById(quizId);
                const fullQuiz = quizResp.data;
                setQuiz(fullQuiz);

                // Попытки пользователя (для отображения "попытка N" и истории)
                try {
                    const resultsResp = await educationService.getMyQuizResults(quizId);
                    const resultsData = resultsResp.data;
                    const resultsList = Array.isArray(resultsData) ? resultsData : (resultsData?.results ?? []);
                    const used = resultsList?.length ?? 0;
                    setAttemptsUsed(used);
                    setCurrentAttempt(used);
                    setQuizAttempts(resultsList || []);
                } catch (_) {
                    // не критично
                }
            } catch (e) {
                setError(e?.message || 'Не удалось загрузить тест.');
            } finally {
                setIsLoading(false);
            }
        };

        if (sectionId && courseId && chapterId && lessonId) {
            loadQuiz();
        }
    }, [sectionId, courseId, chapterId, lessonId]);

    const handleOptionChange = (questionId, optionId, multiple) => {
        setAnswers(prev => {
            const prevValue = prev[questionId];
            if (multiple) {
                const prevSet = Array.isArray(prevValue) ? prevValue : [];
                const exists = prevSet.includes(optionId);
                const nextSet = exists
                    ? prevSet.filter(id => id !== optionId)
                    : [...prevSet, optionId];
                return { ...prev, [questionId]: nextSet };
            }
            return { ...prev, [questionId]: [optionId] };
        });
    };

    const handleStringChange = (questionId, value) => {
        setAnswers(prev => ({ ...prev, [questionId]: value }));
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
            // если нет уроков, просто назад к прогрессу/уроку
            if (enrollmentId) {
                navigate(`/educations/${sectionId}/courses/${courseId}/progress/${enrollmentId}`, {
                    state: { enrollmentId },
                });
            } else {
                navigate(backToLessonPath, { state: { enrollmentId } });
            }
            return;
        }

        let target = flat.find(item => !item.is_completed);
        if (!target) {
            // если все уроки завершены — остаёмся на последнем
            target = flat[flat.length - 1];
        }

        if (!target) {
            if (enrollmentId) {
                navigate(`/educations/${sectionId}/courses/${courseId}/progress/${enrollmentId}`, {
                    state: { enrollmentId },
                });
            } else {
                navigate(backToLessonPath, { state: { enrollmentId } });
            }
            return;
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

    const handleStart = async () => {
        if (!quiz) return;
        try {
            await educationService.startQuiz(quiz.id);
        } catch (_) {
            // старт не критичен для UI
        }
        setHasStarted(true);
        if (quiz.time_limit_minutes && quiz.time_limit_minutes > 0) {
            setTimeLeft(quiz.time_limit_minutes * 60);
        } else {
            setTimeLeft(null);
        }
    };

    // таймер: при истечении времени переходим на последний вопрос и авто-отправляем
    useEffect(() => {
        if (!hasStarted || !quiz) return;
        if (!quiz.time_limit_minutes || quiz.time_limit_minutes <= 0) return;
        if (timeLeft === null) return;

        if (timeLeft <= 0) {
            if (!isSubmitting && !submitResult) {
                if (questions.length > 0 && currentQuestionIndex < questions.length - 1) {
                    setCurrentQuestionIndex(questions.length - 1);
                } else {
                    (async () => {
                        await handleSubmit();
                    })();
                }
            }
            return;
        }

        const id = setTimeout(() => {
            setTimeLeft(prev => (prev !== null ? prev - 1 : prev));
        }, 1000);

        return () => clearTimeout(id);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [hasStarted, quiz, timeLeft, isSubmitting, submitResult, currentQuestionIndex]);

    const resetToStart = (keepResult = false) => {
        setHasStarted(false);
        setAnswers({});
        setCurrentQuestionIndex(0);
        if (!keepResult) setSubmitResult(null);
    };

    const handleSubmit = async () => {
        if (isSubmitting) return;
        if (!quiz) return;
        const questions = Array.isArray(quiz.questions) ? quiz.questions : [];
        const totalQuestions = questions.length;
        if (totalQuestions === 0) return;

        // защита от преждевременной отправки:
        // если мы ещё не на последнем вопросе и время не закончилось — не отправляем
        if (currentQuestionIndex < totalQuestions - 1) {
            const hasTimeLimit = !!quiz.time_limit_minutes && quiz.time_limit_minutes > 0;
            const timeStillRunning = hasTimeLimit && timeLeft !== null && timeLeft > 0;
            const noTimeLimit = !hasTimeLimit;
            if (timeStillRunning || noTimeLimit) {
                return;
            }
        }

        const payloadAnswers = [];

        for (const q of questions) {
            const raw = answers[q.id];
            if (q.type === 'single' || q.type === 'multiple') {
                const selected = Array.isArray(raw) ? raw : [];
                payloadAnswers.push({
                    question_id: q.id,
                    selected_option_ids: selected,
                });
            } else if (q.type === 'string') {
                if (typeof raw === 'string' && raw.trim() !== '') {
                    payloadAnswers.push({
                        question_id: q.id,
                        string_answer: raw.trim(),
                    });
                } else {
                    payloadAnswers.push({
                        question_id: q.id,
                        string_answer: '',
                    });
                }
            }
        }

        try {
            setIsSubmitting(true);
            setSubmitResult(null);
            const resp = await educationService.submitQuiz(quiz.id, { answers: payloadAnswers });
            const data = resp.data || {};
            // добавляем текущую попытку в локальный список
            setQuizAttempts(prev => {
                const base = Array.isArray(prev) ? prev : [];
                return [...base, data];
            });

            // Определяем, сдан ли тест.
            // Бэкенд явно отдаёт is_passed, а также score / passing_score.
            const explicitIsPassed = data.is_passed;
            const passingScore = data.passing_score ?? quiz?.passing_score ?? 0;
            const score = data.score != null ? Number(data.score) : null;

            let isPassed = false;
            if (typeof explicitIsPassed === 'boolean') {
                isPassed = explicitIsPassed;
            } else if (score != null && passingScore != null) {
                isPassed = score >= passingScore;
            }

            // если тест не пройден — сразу сбрасываем к началу, показываем экран «Начать тест»
            if (!isPassed) {
                const percent = typeof score === 'number' && !Number.isNaN(score)
                    ? Math.max(0, Math.round(score))
                    : 0;
                setSubmitResult({
                    error: 'Тест не сдан.',
                    scorePercent: percent,
                });
                 // локально увеличиваем счётчик попыток, чтобы он обновился на экране старта
                setAttemptsUsed(prev => prev + 1);
                setCurrentAttempt(prev => (prev ?? 0) + 1);
                resetToStart(true);
                return;
            }

            setSubmitResult(data);

            // сдан — переходим на следующий урок (если есть запись на курс)
            if (enrollmentId && lessonId) {
                try {
                    await educationService.completeLessons(enrollmentId, Number(lessonId));
                    const progressResp = await educationService.getProgressMyCourses(enrollmentId);
                    navigateToNextFromProgress(progressResp.data);
                    return;
                } catch (e) {
                    // если не смогли завершить урок, остаёмся на странице теста, но показываем текст
                    // eslint-disable-next-line no-console
                    console.error('Failed to complete lesson after quiz', e);
                }
            }
        } catch (e) {
            // при ошибке (в т.ч. 500 при неправильных ответах) — сбрасываем к началу теста
            const detail = e?.response?.data?.detail;
            let message = detail || e?.message || 'Не удалось отправить ответы.';
            if (typeof message !== 'string') {
                try {
                    message = JSON.stringify(message);
                } catch {
                    message = 'Не удалось отправить ответы.';
                }
            }
            setSubmitResult({ error: message });
            resetToStart(true);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSubmitClick = () => {
        if (isSubmitting) return;
        setConfirmSubmitVisible(true);
    };

    const doSubmitAndCloseConfirm = () => {
        setConfirmSubmitVisible(false);
        handleSubmit();
    };

    if (isLoading && !quiz && !error) {
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

    if (error && !quiz) {
        return (
            <div className="page-wrapper section-page-wrapper">
                <div className="education-section-page">
                    <div className="education-back-link-wrap">
                        <button
                            type="button"
                            className="education-back-link"
                            onClick={() => navigate(resolvedBackPath, resolvedBackState)}
                        >
                            <span className="education-back-link__icon" aria-hidden="true">←</span>
                            {backButtonLabel}
                        </button>
                    </div>
                    <p className="education-block__error">{String(error)}</p>
                </div>
            </div>
        );
    }

    const questions = quiz && Array.isArray(quiz.questions) ? quiz.questions : [];

    const maxAttempts = quiz?.max_attempts ?? 0;
    const hasUnlimitedAttempts = !maxAttempts || maxAttempts <= 0;
    const attemptsLeft = hasUnlimitedAttempts ? null : Math.max(0, maxAttempts - attemptsUsed);
    const canStart = hasUnlimitedAttempts || attemptsUsed < maxAttempts;
    const totalQuestions = questions.length;

    const goToQuestion = (index) => {
        if (!questions || questions.length === 0) return;
        const safeIndex = Math.min(Math.max(index, 0), questions.length - 1);
        setCurrentQuestionIndex(safeIndex);
    };

    return (
        <div className="page-wrapper section-page-wrapper">
            <div className="education-section-page">
                <div className="education-back-link-wrap">
                    <button
                        type="button"
                        className="education-back-link"
                        onClick={() => navigate(resolvedBackPath, resolvedBackState)}
                    >
                        <span className="education-back-link__icon" aria-hidden="true">←</span>
                        {backButtonLabel}
                    </button>
                </div>

                <div className="section-page-card">
                    <div className="section-page-card__strip" aria-hidden="true" />
                    <div className="section-page-card__body">
                        <div className="section-page-card__head">
                            <div className="section-page-card__titleLine">
                                <div className="section-page-card__icon" aria-hidden="true">
                                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                         strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                                        <circle cx="12" cy="12" r="10" />
                                        <path d="M9 9a3 3 0 0 1 6 0c0 2-3 3-3 3" />
                                        <line x1="12" y1="17" x2="12" y2="17" />
                                    </svg>
                                </div>
                                <h1 className="section-page-card__title">
                                    {quiz?.title || 'Тест'}
                                </h1>
                            </div>
                            {hasStarted && quiz?.time_limit_minutes && timeLeft !== null && (
                                <div className="section-page-card__timer">
                                    Осталось времени:{' '}
                                    {Math.max(0, Math.floor(timeLeft / 60)).toString().padStart(2, '0')}
                                    :
                                    {Math.max(0, timeLeft % 60).toString().padStart(2, '0')}
                                </div>
                            )}
                        </div>
                        {!hasStarted && quiz?.description && (
                            <p className="section-page-card__description">
                                {quiz.description}
                            </p>
                        )}
                    </div>

                    <div className="section-page-card__content section-page-card__content--lecture">
                        <div className="post-article-card">
                            {/* Информация о тесте и старт */}
                            {quiz && !hasStarted && (
                                <div className="quiz-meta">
                                    <p className="quiz-meta__line">
                                        Попытка: {attemptsUsed}{!hasUnlimitedAttempts && ` из ${maxAttempts}`}
                                    </p>
                                    <p className="quiz-meta__line">
                                        Проходной балл: {quiz.passing_score ?? 0}%
                                    </p>
                                    <p className="quiz-meta__line">
                                        Время на попытку: {quiz.time_limit_minutes ? `${quiz.time_limit_minutes} минут` : 'без ограничения'}
                                    </p>
                                    <p className="quiz-meta__line">
                                        Вопросов: {quiz.questions_count ?? questions.length}
                                    </p>
                                </div>
                            )}

                            {!hasStarted && quizAttempts && quizAttempts.length > 0 && (
                                <div className="quiz-attempts">
                                    <div className="quiz-attempts__title">Предыдущие попытки</div>
                                    <ul className="quiz-attempts__list">
                                        {quizAttempts
                                            .slice()
                                            .reverse()
                                            .slice(0, 3)
                                            .map((attempt) => {
                                                const dt = attempt.finished_at || attempt.started_at;
                                                const dtObj = dt ? new Date(dt) : null;
                                                const dateLabel = dtObj
                                                    ? dtObj.toLocaleString()
                                                    : '';
                                                const scorePercent = typeof attempt.score === 'number'
                                                    ? Math.max(0, Math.round(attempt.score))
                                                    : null;
                                                return (
                                                    <li key={attempt.id} className="quiz-attempts__item">
                                                        <span className="quiz-attempts__date">
                                                            {dateLabel}
                                                        </span>
                                                        <span className="quiz-attempts__result">
                                                            {scorePercent != null ? `${scorePercent}%` : '—'} · {attempt.is_passed ? 'сдан' : 'не сдан'}
                                                        </span>
                                                    </li>
                                                );
                                            })}
                                    </ul>
                                </div>
                            )}

                            {!hasStarted ? (
                                canStart ? (
                                    <>
                                        {submitResult?.error && (
                                            <p className="quiz-submit-result quiz-submit-result--error">
                                                {submitResult.scorePercent != null
                                                    ? `Тест не сдан. Правильных ответов: ${submitResult.scorePercent}%.`
                                                    : 'Тест не сдан.'}
                                            </p>
                                        )}
                                        <div className="section-page-card__actions section-page-card__actions--quiz-start">
                                            <button
                                                type="button"
                                                className="course-progress__continue-btn"
                                                onClick={() => {
                                                    setSubmitResult(null);
                                                    handleStart();
                                                }}
                                            >
                                                Начать тест
                                            </button>
                                        </div>
                                    </>
                                ) : (
                                    <p className="quiz-submit-result">
                                        Лимит попыток исчерпан. Тест больше недоступен.
                                    </p>
                                )
                            ) : (
                                <>
                                    {questions.length === 0 ? (
                                        <p className="education-block__empty">
                                            В этом тесте пока нет вопросов.
                                        </p>
                                    ) : (
                                        <form
                                            onSubmit={(e) => {
                                                e.preventDefault();
                                            }}
                                        >
                                            {/* навигация по вопросам */}
                                            <div className="quiz-nav">
                                                {questions.map((q, index) => {
                                                    const ans = answers[q.id];
                                                    const isAnswered =
                                                        (Array.isArray(ans) && ans.length > 0) ||
                                                        (typeof ans === 'string' && ans.trim() !== '');
                                                    const isActive = index === currentQuestionIndex;
                                                    const btnClass = [
                                                        'quiz-nav__button',
                                                        isActive && 'quiz-nav__button--active',
                                                        isAnswered && 'quiz-nav__button--answered',
                                                    ].filter(Boolean).join(' ');
                                                    return (
                                                        <button
                                                            key={q.id}
                                                            type="button"
                                                            className={btnClass}
                                                            onClick={() => goToQuestion(index)}
                                                        >
                                                            {index + 1}
                                                        </button>
                                                    );
                                                })}
                                            </div>

                                            {/* один вопрос за раз */}
                                            <div className="quiz-questions">
                                                {questions.map((q, index) => {
                                                    if (index !== currentQuestionIndex) return null;
                                                    return (
                                                        <div key={q.id} className="quiz-question">
                                                            <div className="quiz-question__text">
                                                                {q.text}
                                                            </div>

                                                            {q.type === 'single' && Array.isArray(q.options) && (
                                                                <div className="quiz-options">
                                                                    {q.options.map((opt) => (
                                                                        <label
                                                                            key={opt.id}
                                                                            className={`quiz-option${canSeeCorrectAnswers && opt.is_correct ? ' quiz-option--correct' : ''}`}
                                                                        >
                                                                            <input
                                                                                type="radio"
                                                                                name={`q-${q.id}`}
                                                                                value={opt.id}
                                                                                checked={Array.isArray(answers[q.id]) && answers[q.id].includes(opt.id)}
                                                                                onChange={() => handleOptionChange(q.id, opt.id, false)}
                                                                            />
                                                                            <span>
                                                                                {opt.text}
                                                                                {canSeeCorrectAnswers && opt.is_correct && (
                                                                                    <span className="quiz-option__correct-mark"> (правильный)</span>
                                                                                )}
                                                                            </span>
                                                                        </label>
                                                                    ))}
                                                                </div>
                                                            )}

                                                            {q.type === 'multiple' && Array.isArray(q.options) && (
                                                                <div className="quiz-options">
                                                                    {q.options.map((opt) => (
                                                                        <label
                                                                            key={opt.id}
                                                                            className={`quiz-option${canSeeCorrectAnswers && opt.is_correct ? ' quiz-option--correct' : ''}`}
                                                                        >
                                                                            <input
                                                                                type="checkbox"
                                                                                value={opt.id}
                                                                                checked={Array.isArray(answers[q.id]) && answers[q.id].includes(opt.id)}
                                                                                onChange={() => handleOptionChange(q.id, opt.id, true)}
                                                                            />
                                                                            <span>
                                                                                {opt.text}
                                                                                {canSeeCorrectAnswers && opt.is_correct && (
                                                                                    <span className="quiz-option__correct-mark"> (правильный)</span>
                                                                                )}
                                                                            </span>
                                                                        </label>
                                                                    ))}
                                                                </div>
                                                            )}

                                                            {q.type === 'string' && (
                                                                <div className="quiz-string-answer">
                                                                    <input
                                                                        type="text"
                                                                        value={typeof answers[q.id] === 'string' ? answers[q.id] : ''}
                                                                        onChange={(e) => handleStringChange(q.id, e.target.value)}
                                                                        placeholder="Ваш ответ"
                                                                    />
                                                                    {canSeeCorrectAnswers && (q.correct_string_answer || q.correct_string_alternatives) && (
                                                                        <div className="quiz-string-answer__correct">
                                                                            <div>
                                                                                <strong>Правильный ответ:</strong> {q.correct_string_answer || '—'}
                                                                            </div>
                                                                            {q.correct_string_alternatives && (
                                                                                <div>
                                                                                    <strong>Альтернативы:</strong> {q.correct_string_alternatives}
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>

                                            <div className="section-page-card__actions section-page-card__actions--quiz-run">
                                                {currentQuestionIndex < questions.length - 1 ? (
                                                    <button
                                                        type="button"
                                                        className="course-progress__continue-btn"
                                                        onClick={() => goToQuestion(currentQuestionIndex + 1)}
                                                    >
                                                        Следующий вопрос
                                                    </button>
                                                ) : (
                                                    <button
                                                        type="button"
                                                        className="course-progress__continue-btn"
                                                        disabled={isSubmitting}
                                                        onClick={handleSubmitClick}
                                                    >
                                                        {isSubmitting ? 'Отправляем...' : 'Отправить ответы'}
                                                    </button>
                                                )}
                                            </div>

                                            {submitResult && !submitResult.error && (
                                                <div className="quiz-submit-result">
                                                    Ответы отправлены.
                                                </div>
                                            )}
                                        </form>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </div>

                <MyModal
                    visible={confirmSubmitVisible}
                    setVisible={() => setConfirmSubmitVisible(false)}
                    width="400px"
                >
                    <div className="quiz-confirm-modal">
                        <h3 className="quiz-confirm-modal__title">Отправить ответы на проверку?</h3>
                        <p className="quiz-confirm-modal__text">После отправки тест будет завершён и вы увидите результат.</p>
                        <div className="quiz-confirm-modal__actions">
                            <button
                                type="button"
                                className="course-progress__continue-btn course-progress__continue-btn--secondary"
                                onClick={() => setConfirmSubmitVisible(false)}
                            >
                                Отмена
                            </button>
                            <button
                                type="button"
                                className="course-progress__continue-btn"
                                disabled={isSubmitting}
                                onClick={doSubmitAndCloseConfirm}
                            >
                                {isSubmitting ? 'Отправляем...' : 'Отправить'}
                            </button>
                        </div>
                    </div>
                </MyModal>
            </div>
        </div>
    );
};

export default QuizPage;

