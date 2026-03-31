import React, {useEffect} from 'react';
import educationService from "../../API/EducationService";
import MyModal from "../../../../components/UI/MyModal/MyModal";

const CoursesStats = ({sectionId, courseId}) => {
    const [info, setInfo] = React.useState({});
    const [loading, setLoading] = React.useState(false);
    const [modal, setModal] = React.useState(false);

    const fetchInfo = async () => {
        try {
            setLoading(true);
            const response = await educationService.getCourseInfo(sectionId, courseId);
            setInfo(response.data);
        } catch (error) {
            console.log(error);
        } finally {
            setLoading(false);
        }
    }
    useEffect(() => {
        if (modal) fetchInfo();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [modal]);

    return (
        <div className="course-stats">
            <button
                className="edu-create__save-btn edu-create__save-btn--draft course-stats__btn"
                type="button"
                onClick={() => setModal(true)}
                disabled={loading}
                title="Информация о курсе"
            >
                <span className="course-stats__btn-icon">!</span>
            </button>
            <MyModal visible={modal} setVisible={() => setModal(false)} width="560px">
                <div className="course-stats__modal">
                    <div className="course-stats__modal-header">
                        <h3 className="course-stats__modal-title">Информация о курсе</h3>
                    </div>
                    <div className="course-stats__list">
                        <div className="course-stats__row">
                            <span className="course-stats__row-label">Всего студентов</span>
                            <span className="course-stats__row-value">{info.total_students ?? '—'}</span>
                        </div>
                        <div className="course-stats__row">
                            <span className="course-stats__row-label">Сейчас проходят</span>
                            <span className="course-stats__row-value">{info.active_students ?? '—'}</span>
                        </div>
                        <div className="course-stats__row">
                            <span className="course-stats__row-label">Завершили курс</span>
                            <span className="course-stats__row-value">{info.completed_students ?? '—'}</span>
                        </div>
                        <div className="course-stats__row">
                            <span className="course-stats__row-label">Рейтинг</span>
                            <span className="course-stats__row-value course-stats__row-value--accent">
                                {info.rating != null ? `★ ${Number(info.rating).toFixed(1)}` : '—'}
                            </span>
                        </div>
                        <div className="course-stats__row">
                            <span className="course-stats__row-label">Отзывов</span>
                            <span className="course-stats__row-value">{info.reviews_count ?? '—'}</span>
                        </div>
                    </div>
                </div>
            </MyModal>
        </div>
    );
};

export default CoursesStats;