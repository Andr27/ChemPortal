import React from 'react';
import CoursesReviewItem from "./coursesReviewItem";

const CoursesReviewList = ({ review, title = "Отзывы на курс:" }) => {
    return (
        <div className="review-list">
            {title && (
                <h2 className="review-list__title">{title}</h2>
            )}
            {review.length === 0 ? (
                <p className="review-list__empty">Отзывов пока нет</p>
            ) : (
                <div className="review-list__grid">
                    {review.map((item, index) => (
                        <CoursesReviewItem
                            key={item.id || index}
                            review={item}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default CoursesReviewList;
