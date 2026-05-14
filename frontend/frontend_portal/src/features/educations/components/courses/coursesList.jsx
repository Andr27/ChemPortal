import React from 'react';
import CourseItem from "./coursesItem";

const CoursesList = ({ section, courses, title, backPath }) => {
    return (
        <div>
            {title && (
                <h1 style={{ textAlign: 'center' }}>
                    {title}
                </h1>
            )}
            <div className="posts-grid">
                {courses.map((item, index) => (
                    <CourseItem
                        key={item.id || index}
                        number={index + 1}
                        course={item}
                        section={section}
                        backPath={backPath}
                    />
                ))}
            </div>
        </div>
    );
};

export default CoursesList;
