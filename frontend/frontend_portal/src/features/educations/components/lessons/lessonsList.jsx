import React from 'react';
import LessonItem from "./lessonsItem";

const LessonsList = ({ lessons, lessonProgressMap = {}, onLessonClick, onQuizClick, bypassLock = false, hideLockUI = false }) => {
    if (!Array.isArray(lessons) || lessons.length === 0) {
        return null;
    }

    return (
        <ol className="course-lessons-list">
            {lessons.map((lesson, index) => {
                const progress = lessonProgressMap[lesson.id];
                const isCompleted = !!progress?.is_completed;

                const prevLesson = lessons[index - 1];
                const prevProgress = prevLesson ? lessonProgressMap[prevLesson.id] : null;
                const isLocked = !bypassLock && index > 0 && !prevProgress?.is_completed;

                const clickHandler = (!isLocked && onLessonClick)
                    ? () => onLessonClick(lesson)
                    : undefined;
                const quizClickHandler = (!isLocked && onQuizClick)
                    ? () => onQuizClick(lesson)
                    : undefined;

                return (
                    <LessonItem
                        key={lesson.id ?? index}
                        number={index + 1}
                        lesson={lesson}
                        progress={progress}
                        isCompleted={isCompleted}
                        isLocked={isLocked}
                        hideLockUI={hideLockUI}
                        onClick={clickHandler}
                        onQuizClick={quizClickHandler}
                    />
                );
            })}
        </ol>
    );
};

export default LessonsList;

