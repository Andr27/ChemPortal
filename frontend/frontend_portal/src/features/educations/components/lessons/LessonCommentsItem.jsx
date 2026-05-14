import React, { useContext, useState } from 'react';
import Mybutton from '../../../../components/UI/button/Mybutton';
import { CreatorContext, ModeratorContext, UserContext } from '../../../../context';
import educationService from '../../API/EducationService';

const LessonCommentsItem = ({
    comment,
    number,
    sectionId,
    courseId,
    chapterId,
    lessonId,
    onRefresh,
}) => {
    const [loading, setLoading] = useState(false);
    const { isModerator } = useContext(ModeratorContext);
    const { isCreator }   = useContext(CreatorContext);
    const { user }        = useContext(UserContext);

    const rawAuthor = comment?.author;

    const authorName = (() => {
        if (!rawAuthor) return 'Аноним';
        if (typeof rawAuthor === 'string') return rawAuthor;
        const last  = rawAuthor.last_name  || '';
        const first = rawAuthor.first_name || '';
        const full  = `${last} ${first}`.trim();
        return full || rawAuthor.email || 'Аноним';
    })();

    // Удалить может автор комментария или модератор
    const canDelete =
        (typeof rawAuthor === 'object' && rawAuthor !== null && user?.id === rawAuthor.id) ||
        user?.email    === rawAuthor ||
        user?.username === rawAuthor ||
        isModerator;

    // Закрепить может создатель курса или модератор
    const canPin = isCreator || isModerator;

    const handleDelete = async () => {
        try {
            setLoading(true);
            await educationService.deleteLessonComment(sectionId, courseId, chapterId, lessonId, comment.id);
            if (onRefresh) onRefresh();
        } catch (err) {
            console.error('Ошибка при удалении комментария:', err);
        } finally {
            setLoading(false);
        }
    };

    const handlePin = async () => {
        try {
            setLoading(true);
            if (comment.is_pinned) {
                await educationService.unpinLessonComment(sectionId, courseId, chapterId, lessonId, comment.id);
            } else {
                await educationService.pinLessonComment(sectionId, courseId, chapterId, lessonId, comment.id);
            }
            if (onRefresh) onRefresh();
        } catch (err) {
            console.error('Ошибка при закреплении/откреплении комментария:', err);
        } finally {
            setLoading(false);
        }
    };

    if (!comment) return null;

    return (
        <div className={`comment${comment.is_pinned ? ' comment--pinned' : ''}`}>
            {comment.is_pinned && (
                <span className="comment__pin-badge" title="Закреплённый комментарий">
                    📌
                </span>
            )}
            <div className="comment__header">
                <strong>{number}</strong>
                <span>{authorName}</span>
            </div>

            <div className="comment__body">
                {comment.text || ''}
            </div>

            <div className="comment__footer">
                <small>
                    {comment.created_at
                        ? new Date(comment.created_at).toLocaleString()
                        : ''}
                </small>

                <div style={{ display: 'flex', gap: '8px' }}>
                    {canPin && (
                        <Mybutton
                            onClick={handlePin}
                            disabled={loading}
                            style={{ padding: '2px 8px' }}
                            title={comment.is_pinned ? 'Открепить' : 'Закрепить'}
                        >
                            {comment.is_pinned ? '📌✕' : '📌'}
                        </Mybutton>
                    )}
                    {canDelete && (
                        <Mybutton
                            onClick={handleDelete}
                            disabled={loading}
                            style={{ padding: '2px 8px' }}
                            title="Удалить"
                        >
                            🗑️
                        </Mybutton>
                    )}
                </div>
            </div>
        </div>
    );
};

export default LessonCommentsItem;
