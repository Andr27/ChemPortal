import React from 'react';
import StarRating from "../../starRating";

const CoursesReviewItem = ({ review }) => {
    return (
        <div className="review-item">
            <div className="review-item__header">
                <span className="review-item__author">
                    {(review.user?.last_name && review.user?.first_name)
                        ? `${review.user.last_name} ${review.user.first_name}`
                        : 'Аноним'
                    }
                </span>
                <StarRating rating={review.rating} />
            </div>
            <hr className="review-item__divider" />
            {review.comment && (
                <p className="review-item__comment">{review.comment}</p>
            )}
            <div className="review-item__footer">
                <small className="review-item__date">
                    {new Date(review.created_at).toLocaleDateString('ru-RU', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                    })}
                </small>
            </div>
        </div>
    );
};

export default CoursesReviewItem;
