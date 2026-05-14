import React from 'react';

const StarRating = ({ rating }) => {
    return (
        <div className="review-item__stars">
            {[1, 2, 3, 4, 5].map((star) => (
                <span
                    key={star}
                    className={`review-item__star${star <= rating ? ' review-item__star--filled' : ''}`}
                >
                    ★
                </span>
            ))}
        </div>
    );
};

export default StarRating;