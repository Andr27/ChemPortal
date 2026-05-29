import React, { useCallback, useContext, useEffect, useState } from 'react';
import Mybutton from '../../../../components/UI/button/Mybutton';
import Myinput from '../../../../components/UI/input/Myinput';
import { AuthContext } from '../../../../context';
import educationService from '../../API/EducationService';
import LessonCommentsItem from './LessonCommentsItem';

const LessonCommentsList = ({ sectionId, courseId, chapterId, lessonId }) => {
    const { isAuth } = useContext(AuthContext);

    const [comments, setComments]         = useState([]);
    const [newCommentText, setNewCommentText] = useState('');
    const [loading, setLoading]           = useState(false);
    const [sending, setSending]           = useState(false);
    const [error, setError]               = useState(null);

    const fetchComments = useCallback(async () => {
        if (!sectionId || !courseId || !chapterId || !lessonId) return;
        try {
            setLoading(true);
            setError(null);
            const response = await educationService.getLessonComments(
                sectionId, courseId, chapterId, lessonId
            );
            const data = Array.isArray(response.data) ? response.data : [];
            // Закреплённый комментарий — всегда первый
            const sorted = [...data].sort((a, b) => {
                if (a.is_pinned && !b.is_pinned) return -1;
                if (!a.is_pinned && b.is_pinned) return 1;
                return 0;
            });
            setComments(sorted);
        } catch (err) {
            console.error('Ошибка при загрузке комментариев:', err);
            setError('Не удалось загрузить комментарии.');
        } finally {
            setLoading(false);
        }
    }, [sectionId, courseId, chapterId, lessonId]);

    useEffect(() => {
        fetchComments();
    }, [fetchComments]);

    const handleAddComment = async () => {
        if (!newCommentText.trim()) return;
        try {
            setSending(true);
            await educationService.addLessonComment(
                sectionId, courseId, chapterId, lessonId, newCommentText.trim()
            );
            setNewCommentText('');
            await fetchComments();
        } catch (err) {
            console.error('Ошибка при добавлении комментария:', err);
            setError('Не удалось отправить комментарий.');
        } finally {
            setSending(false);
        }
    };

    if (loading && comments.length === 0) {
        return <div className="comments-list">Загрузка комментариев...</div>;
    }

    return (
        <div className="comments-list">
            <h3>
                <span>Комментарии ({comments.length})</span>
            </h3>

            {isAuth ? (
                <div className="comment-input-row">
                    <Myinput
                        type="text"
                        value={newCommentText}
                        placeholder="Напишите комментарий..."
                        onChange={e => setNewCommentText(e.target.value)}
                        onKeyDown={e => {
                            if (e.key === 'Enter' && !sending && newCommentText.trim()) {
                                e.preventDefault();
                                handleAddComment();
                            }
                        }}
                        disabled={sending}
                        required
                    />
                    <Mybutton
                        className="comment-send-btn"
                        onClick={handleAddComment}
                        disabled={sending || !newCommentText.trim()}
                        title="Отправить"
                    >
                        →
                    </Mybutton>
                </div>
            ) : (
                <div style={{ marginBottom: '14px', color: 'var(--color-text-muted)' }}>
                    Чтобы оставить комментарий, выполните вход.
                </div>
            )}

            {error && (
                <div style={{ color: 'var(--color-danger, red)', marginBottom: '12px' }}>
                    {error}
                </div>
            )}

            {comments.length === 0 ? (
                <h3 style={{ textAlign: 'center', color: 'var(--color-text-muted)' }}>
                    💬 Комментариев пока нет. Будьте первым!
                </h3>
            ) : (
                comments.map((comment, index) => (
                    <LessonCommentsItem
                        key={comment.id || index}
                        comment={comment}
                        number={index + 1}
                        sectionId={sectionId}
                        courseId={courseId}
                        chapterId={chapterId}
                        lessonId={lessonId}
                        onRefresh={fetchComments}
                    />
                ))
            )}
        </div>
    );
};

export default LessonCommentsList;
