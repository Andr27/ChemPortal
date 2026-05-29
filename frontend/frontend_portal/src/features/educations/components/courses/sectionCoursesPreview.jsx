import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useFetching } from "../../../../hooks/useFetching";
import Loader from "../../../../components/UI/loader/loader";
import educationService from "../../API/EducationService";
import CourseItem from "./coursesItem";

const PREVIEW_LIMIT = 12;

const SectionCoursesPreview = ({ section = null }) => {
    const params = useParams();
    const sectionId = section?.id ?? params.id;
    const [courses, setCourses] = useState([]);
    const [fetchCourses, isLoading, error] = useFetching(async (id) => {
        const response = await educationService.getSectionCourses(PREVIEW_LIMIT, 1, id);
        const data = response.data;
        const list = Array.isArray(data) ? data : (data?.results ?? []);
        setCourses(list);
    });

    useEffect(() => {
        if (sectionId != null) {
            fetchCourses(sectionId);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [sectionId]);

    const sectionForLink = section || (sectionId != null ? { id: sectionId } : null);

    return (
        <section className="education-block">
            <div className="education-block__header">
                <h2 className="education-block__title">Курсы</h2>
                {sectionForLink && (
                    <Link to={`/educations/${sectionForLink.id}/courses`} className="education-block__link">
                        Посмотреть всё
                    </Link>
                )}
            </div>
            <div className="education-preview-grid">
                {error && (
                    <p className="education-block__error">Произошла ошибка: {String(error)}</p>
                )}
                {isLoading && (
                    <div className="education-block__loader">
                        <Loader />
                    </div>
                )}
                {!isLoading && !error && courses.length === 0 && (
                    <p className="education-block__empty">Курсов пока нет</p>
                )}
                {!isLoading && !error && courses.map((item, index) => (
                    <CourseItem
                        key={item.id || index}
                        course={item}
                        section={sectionForLink}
                        backPath={sectionForLink ? `/educations/${sectionForLink.id}` : undefined}
                    />
                ))}
            </div>
        </section>
    );
};

export default SectionCoursesPreview;
