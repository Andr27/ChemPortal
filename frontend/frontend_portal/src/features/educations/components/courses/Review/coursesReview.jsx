import React, { useEffect, useRef } from 'react';
import educationService from "../../../API/EducationService";
import MySelect from "../../../../../components/UI/select/MySelect";
import CoursesReviewList from "./coursesReviewList";
import { useObserver } from "../../../../../hooks/useObserver";
import Loader from "../../../../../components/UI/loader/loader";
import CoursesReviewForm from "./coursesReviewForm";

const CoursesReview = ({ courseId, addReview = false }) => {
    const [loading, setLoading] = React.useState(true);
    const [reviews, setReviews] = React.useState([]);
    const [sortType, setSortType] = React.useState('all');
    const [page, setPage] = React.useState(1);
    const limit = 10;
    const [totalPages, setTotalPages] = React.useState(0);
    const lastElement = useRef();

    const fetchReviews = async () => {
        setLoading(true);
        try {
            let response;
            if (sortType === 'onlyComments') {
                response = await educationService.getReviewTextCourse(limit, page, courseId);
            } else if (sortType === 'useful') {
                response = await educationService.getReviewSortUsefulCourse(limit, page, courseId);
            } else {
                response = await educationService.getReviewCourse(limit, page, courseId);
            }
            setTotalPages(Math.ceil(response.data.count / limit));
            setReviews(prev => page === 1 ? response.data.results : [...prev, ...response.data.results]);
        } catch (error) {
            console.log(error);
        } finally {
            setLoading(false);
        }
    };

    const reloadReviews = () => {
        setPage(1);
        setReviews([]);
        fetchReviews();
    };

    useObserver(
        lastElement,
        page < totalPages,
        loading,
        () => setPage(prev => prev + 1)
    );

    useEffect(() => {
        fetchReviews();
    }, [courseId, page, sortType]);

    useEffect(() => {
        setPage(1);
        setReviews([]);
    }, [sortType]);

    return (
        <div className="reviews-section">
            <div className="reviews-section__header">
                <h2 className="review-list__title">Отзывы на курс</h2>
                <select
                    className="reviews-section__select"
                    value={sortType}
                    onChange={(e) => setSortType(e.target.value)}
                >
                    <option value="all">Все отзывы</option>
                    <option value="onlyComments">С комментариями</option>
                    <option value="useful">По рейтингу</option>
                </select>
            </div>
            {addReview && (<CoursesReviewForm courseId={courseId} onSuccess={reloadReviews}/>)}
            <CoursesReviewList review={reviews} title={null} />
            <div ref={lastElement} style={{ height: 20 }} />
            {loading && (
                <div style={{ display: "flex", justifyContent: "center", marginTop: 16 }}>
                    <Loader />
                </div>
            )}
        </div>
    );
};

export default CoursesReview;
