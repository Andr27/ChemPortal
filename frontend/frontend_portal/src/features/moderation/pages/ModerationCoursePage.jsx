import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import EducationService from '../../educations/API/EducationService';
import Loader from '../../../components/UI/loader/loader';

/**
 * Страница модерации курса.
 * Не рисует свой UI — загружает курс и перенаправляет модератора
 * на настоящую страницу курса с флагом fromModeration,
 * чтобы тот видел всё точно так же, как видит пользователь.
 */
const ModerationCoursePage = () => {
    const { courseId }  = useParams();
    const location      = useLocation();
    const navigate      = useNavigate();
    const courseFromState = location.state?.course;

    const [error, setError] = useState('');

    useEffect(() => {
        const resolve = async () => {
            let course = courseFromState;

            if (!course || !course.section_id) {
                try {
                    const r = await EducationService.getModerationCoursesGlobal();
                    const list = Array.isArray(r.data) ? r.data : (r.data?.results ?? []);
                    course = list.find(c => String(c.id) === String(courseId));
                } catch {
                    setError('Не удалось загрузить данные курса');
                    return;
                }
            }

            if (!course?.section_id) {
                setError('Не найден раздел для этого курса');
                return;
            }

            navigate(
                `/educations/${course.section_id}/courses/${courseId}`,
                {
                    replace: true,
                    state: {
                        fromModeration: true,
                        modCourse: course,
                        from: '/moderation',
                    },
                }
            );
        };

        resolve();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [courseId]);

    if (error) {
        return (
            <div className="page-wrapper">
                <p style={{ color: 'var(--color-text-muted)', textAlign: 'center', marginTop: 40 }}>
                    {error}
                </p>
            </div>
        );
    }

    return (
        <div className="page-wrapper">
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: 60 }}>
                <Loader />
            </div>
        </div>
    );
};

export default ModerationCoursePage;
