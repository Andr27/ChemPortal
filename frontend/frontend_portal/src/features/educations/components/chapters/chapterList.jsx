import React, { useEffect, useState } from 'react';
import { useFetching } from "../../../../hooks/useFetching";
import Loader from "../../../../components/UI/loader/loader";
import educationService from "../../API/EducationService";
import ChapterItem from "./chapterItem";

const ChapterList = ({
    sectionId,
    courseId,
    chapterProgressMap = {},
    lessonProgressMap = {},
    onLessonClick,
    onQuizClick,
    bypassLock = false,
    hideLockUI = false,
}) => {
    const [chapters, setChapters] = useState([]);

    const [fetchChapters, isChaptersLoading, chaptersError] = useFetching(async (sId, cId) => {
        const response = await educationService.getChapters(sId, cId);
        const data = response.data;
        const list = Array.isArray(data) ? data : (data?.results ?? []);
        setChapters(list);
    });

    useEffect(() => {
        if (sectionId != null && courseId != null) {
            fetchChapters(sectionId, courseId);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [sectionId, courseId]);

    return (
        <section className="education-block">
            <h2 className="course-page__section-title">Программа курса</h2>

            {chaptersError && (
                <p className="education-block__error">
                    Ошибка загрузки глав: {String(chaptersError)}
                </p>
            )}

            {isChaptersLoading && (
                <div className="education-block__loader">
                    <Loader />
                </div>
            )}

            {!isChaptersLoading && !chaptersError && chapters.length === 0 && (
                <p className="education-block__empty">Глав пока нет</p>
            )}

            {!isChaptersLoading && !chaptersError && chapters.length > 0 && (
                <ol className="course-modules-list">
                    {chapters.map((chapter, index) => (
                        <ChapterItem
                            key={chapter.id ?? index}
                            number={index + 1}
                            chapter={chapter}
                            sectionId={sectionId}
                            courseId={courseId}
                            chapterProgress={chapterProgressMap[chapter.id]}
                            lessonProgressMap={lessonProgressMap}
                            onLessonClick={onLessonClick}
                            onQuizClick={onQuizClick}
                            bypassLock={bypassLock}
                                hideLockUI={hideLockUI}
                        />
                    ))}
                </ol>
            )}
        </section>
    );
};

export default ChapterList;

