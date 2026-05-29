import React from 'react';
import { useNavigate } from "react-router-dom";
import { makeExcerpt } from "../../../../utils/textExcerpt";

const CourseItem = (props) => {
    const navigate = useNavigate();
    const backPath = props.backPath ?? `/educations/${props.section?.id}`;
    const openCourse = () => navigate(`/educations/${props.section.id}/courses/${props.course.id}`, { state: { from: backPath } });

    return (
        <div
            className="post post--clickable"
            role="link"
            tabIndex={0}
            onClick={openCourse}
            onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    openCourse();
                }
            }}
        >
            <div className="post__top">
                <div className="post__main">
                    <div className="post__header-row">
                        <div className="post__content">
                            {props.course.title}
                        </div>
                    </div>

                    <div className="post__excerpt">
                        {makeExcerpt(props.course.body || props.course.description, 15) || 'Здесь будет краткое описание курса.'}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CourseItem;
