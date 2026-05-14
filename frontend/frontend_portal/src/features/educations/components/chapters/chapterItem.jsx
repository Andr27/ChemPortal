import React, { useEffect, useState } from 'react';
import { useFetching } from "../../../../hooks/useFetching";
import Loader from "../../../../components/UI/loader/loader";
import educationService from "../../API/EducationService";
import LessonsList from "../lessons/lessonsList";

const ChapterItem = ({
    number,
    chapter,
    sectionId,
    courseId,
    chapterProgress,
    lessonProgressMap,
    onLessonClick,
    onQuizClick,
    bypassLock = false,
    hideLockUI = false,
}) => {
    const [isOpen, setIsOpen] = useState(true);
    const [lessons, setLessons] = useState([]);
    const [hasLoadedOnce, setHasLoadedOnce] = useState(false);

    const [fetchLessons, isLessonsLoading, lessonsError] = useFetching(
        async (sId, cId, chId) => {
            const response = await educationService.getLessons(sId, cId, chId);
            const data = response.data;
            const list = Array.isArray(data) ? data : (data?.results ?? []);
            setLessons(list);
            setHasLoadedOnce(true);
        }
    );

    useEffect(() => {
        if (!hasLoadedOnce && chapter?.id && sectionId != null && courseId != null) {
            fetchLessons(sectionId, courseId, chapter.id);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [chapter?.id, sectionId, courseId]);

    const toggleOpen = () => {
        const nextOpen = !isOpen;
        setIsOpen(nextOpen);
        if (nextOpen && !hasLoadedOnce) {
            fetchLessons(sectionId, courseId, chapter.id);
        }
    };

    const isCompleted = !!chapterProgress?.is_completed;

    return (
        <li className="course-modules-list__item">
            <button
                type="button"
                className="course-modules-list__header"
                onClick={toggleOpen}
            >
                <span className="course-modules-list__titleWrap">
                    <span className="course-modules-list__title">
                        {chapter?.title || `Раздел ${number}`}
                    </span>
                    {chapterProgress && isCompleted && (
                        <span className="course-modules-list__check" aria-hidden="true" />
                    )}
                </span>
                {chapterProgress && !isCompleted && (
                    <span className="course-modules-list__status">
                        В процессе
                    </span>
                )}
                <span className="course-modules-list__toggle">
                    {isOpen ? '▴' : '▾'}
                </span>
            </button>

            {chapter?.description && (
                <p className="course-modules-list__description">
                    {chapter.description}
                </p>
            )}

            {isOpen && (
                <div className="course-modules-list__body">
                    {lessonsError && (
                        <p className="education-block__error">
                            Ошибка загрузки уроков: {String(lessonsError)}
                        </p>
                    )}
                    {isLessonsLoading && (
                        <div className="education-block__loader">
                            <Loader />
                        </div>
                    )}
                    {!isLessonsLoading && !lessonsError && lessons.length === 0 && (
                        <p className="education-block__empty">
                            Уроков в этой главе пока нет
                        </p>
                    )}
                    {!isLessonsLoading && !lessonsError && lessons.length > 0 && (
                        <>
                            <LessonsList
                                lessons={lessons}
                                lessonProgressMap={lessonProgressMap}
                                onLessonClick={onLessonClick ? (lesson) => onLessonClick(lesson, chapter) : undefined}
                                onQuizClick={onQuizClick ? (lesson) => onQuizClick(lesson, chapter) : undefined}
                                bypassLock={bypassLock}
                                hideLockUI={hideLockUI}
                            />
                        </>
                    )}
                </div>
            )}
        </li>
    );
};

export default ChapterItem;
