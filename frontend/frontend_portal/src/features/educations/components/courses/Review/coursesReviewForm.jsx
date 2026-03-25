import React from 'react';
import educationService from "../../../API/EducationService";

const StarPicker = ({ value, onChange }) => {
    const [hover, setHover] = React.useState(0);

    return (
        <div className="review-form__stars">
            {[1, 2, 3, 4, 5].map((star) => (
                <button
                    key={star}
                    type="button"
                    className={`review-form__star${star <= (hover || value) ? ' review-form__star--filled' : ''}`}
                    onClick={() => onChange(star)}
                    onMouseEnter={() => setHover(star)}
                    onMouseLeave={() => setHover(0)}
                >
                    ★
                </button>
            ))}
        </div>
    );
};

const CoursesReviewForm = ({courseId, onSuccess}) => {
    const [loading, setLoading] = React.useState(false);
    const [review, setReview] = React.useState({
        course_id: courseId,
        rating: null,
        comment: "",
    });
    const addReview = async (e) => {
        e.preventDefault();
        if (!review.rating) return;
        try {
            setLoading(true);
            await educationService.leaveReviewCourse(review);
            setReview({ course_id: courseId, rating: null, comment: "" });
            if (onSuccess) onSuccess();
        } catch (error) {
            console.log(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <form className="review-form" onSubmit={addReview}>
            <div className="review-form__row">
                <label className="review-form__label">Ваша оценка</label>
                <StarPicker value={review.rating} onChange={(val) => setReview({ ...review, rating: val })} />
            </div>
            <textarea
                className="review-form__textarea"
                placeholder="Напишите отзыв (необязательно)..."
                value={review.comment}
                onChange={(e) => setReview({ ...review, comment: e.target.value })}
                rows={3}
            />
            <div className="review-form__footer">
                <span className="review-form__hint">Повторная отправка обновит ваш предыдущий отзыв</span>
                <button
                    type="submit"
                    className="review-form__submit"
                    disabled={loading || !review.rating}
                >
                    {loading ? 'Отправка...' : 'Оставить отзыв'}
                </button>
            </div>
        </form>
    );
};

export default CoursesReviewForm;