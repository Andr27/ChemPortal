import React from 'react';

const IconLecture = () => (
    <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" width="14" height="14">
        <rect x="2" y="1" width="10" height="13" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
        <line x1="5" y1="5" x2="10" y2="5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="5" y1="8" x2="10" y2="8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="5" y1="11" x2="8" y2="11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
);

const IconQuiz = () => (
    <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" width="14" height="14">
        <path d="M2 3h8l3 3v7a1 1 0 01-1 1H2a1 1 0 01-1-1V4a1 1 0 011-1z" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M10 3v3h3" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
        <line x1="4" y1="8" x2="9" y2="8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="4" y1="11" x2="7" y2="11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
);

const IconLock = () => (
    <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" width="13" height="13">
        <rect x="3" y="7" width="10" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M5 7V5a3 3 0 016 0v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
);

const LessonItem = ({ number, lesson, progress, isCompleted, isLocked, hideLockUI = false, onClick, onQuizClick }) => {
    const hasQuiz = !!(lesson?.has_quiz || progress?.has_quiz);
    const quizDone = isCompleted;

    const showLockUI = isLocked && !hideLockUI;
    const lockedClass = showLockUI ? ' course-lessons-list__item--locked' : '';

    return (
        <>
            {/* Строка урока */}
            <li className={`course-lessons-list__item${lockedClass}`}>
                {onClick ? (
                    <button
                        type="button"
                        className="course-lessons-list__row course-lessons-list__row--clickable"
                        onClick={onClick}
                    >
                        <span className="course-lessons-list__row-icon course-lessons-list__row-icon--lesson" aria-hidden="true">
                            <IconLecture />
                        </span>
                        <span className="course-lessons-list__row-title">
                            {lesson?.title ?? `Урок ${number}`}
                        </span>
                        {isCompleted && (
                            <span className="course-lessons-list__row-status course-lessons-list__row-status--done">
                                Пройдено
                            </span>
                        )}
                    </button>
                ) : (
                    <div className={`course-lessons-list__row${showLockUI ? ' course-lessons-list__row--locked' : ''}`}>
                        <span className="course-lessons-list__row-icon course-lessons-list__row-icon--lesson" aria-hidden="true">
                            {showLockUI ? <IconLock /> : <IconLecture />}
                        </span>
                        <span className="course-lessons-list__row-title">
                            {lesson?.title ?? `Урок ${number}`}
                        </span>
                        {showLockUI && (
                            <span className="course-lessons-list__row-status course-lessons-list__row-status--locked">
                                Недоступно
                            </span>
                        )}
                    </div>
                )}
            </li>

            {/* Строка теста под уроком */}
            {hasQuiz && (
                <li className={`course-lessons-list__item course-lessons-list__item--quiz${lockedClass}`}>
                    {onQuizClick ? (
                        <button
                            type="button"
                            className="course-lessons-list__row course-lessons-list__row--clickable"
                            onClick={onQuizClick}
                        >
                            <span className="course-lessons-list__row-icon course-lessons-list__row-icon--quiz" aria-hidden="true">
                                <IconQuiz />
                            </span>
                            <span className="course-lessons-list__row-title">Тест по уроку</span>
                            {quizDone && (
                                <span className="course-lessons-list__row-status course-lessons-list__row-status--done">
                                    Пройдено
                                </span>
                            )}
                        </button>
                    ) : (
                        <div className={`course-lessons-list__row${showLockUI ? ' course-lessons-list__row--locked' : ''}`}>
                            <span className="course-lessons-list__row-icon course-lessons-list__row-icon--quiz" aria-hidden="true">
                                {showLockUI ? <IconLock /> : <IconQuiz />}
                            </span>
                            <span className="course-lessons-list__row-title">Тест по уроку</span>
                            {showLockUI && (
                                <span className="course-lessons-list__row-status course-lessons-list__row-status--locked">
                                    Недоступно
                                </span>
                            )}
                        </div>
                    )}
                </li>
            )}
        </>
    );
};

export default LessonItem;
