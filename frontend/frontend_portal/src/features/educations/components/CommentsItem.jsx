import React, {useContext, useState} from 'react';
import UserService from "../../../API/UserService";
import Mybutton from "../../../components/UI/button/Mybutton";
import Myinput from "../../../components/UI/input/Myinput";
import {ModeratorContext, UserContext} from "../../../context";

const CommentsItem = ({ comment, number, onCommentAdded, postId }) => {
    const [showReplyForm, setShowReplyForm] = useState(false);
    const [showChildren, setShowChildren] = useState(false);
    const [replyText, setReplyText] = useState('');
    const [loading, setLoading] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editText, setEditText] = useState(comment.text || '');
    const { isModerator } = useContext(ModeratorContext);
    const { user } = useContext(UserContext);

    const ChangingComment = async () => {
        if (!editText.trim()) return;

        try {
            setLoading(true);
            await UserService.ChangeComments(postId, comment.id, editText);
            setIsEditing(false);
            if (onCommentAdded) onCommentAdded();
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const DeleteComments = async () => {
        try {
            setLoading(true);
            await UserService.DeleteComments(postId, comment.id);
            if (onCommentAdded) onCommentAdded();
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const addChildComment = async () => {
        if (!replyText.trim()) return;

        try {
            setLoading(true);
            await UserService.AddChildComments(postId, replyText, Number(comment.id));

            setReplyText('');
            setShowReplyForm(false);
            setShowChildren(true);

            if (onCommentAdded) {
                onCommentAdded();
            }
        } catch (error) {
            console.error('Ошибка при добавлении ответа:', error);
        } finally {
            setLoading(false);
        }
    };

    const rawAuthor = comment?.author;
    const authorName = (() => {
        if (!rawAuthor) return 'Аноним';
        if (typeof rawAuthor === 'string') return rawAuthor;
        const last = rawAuthor.last_name || '';
        const first = rawAuthor.first_name || '';
        const full = `${last} ${first}`.trim();
        return full || 'Аноним';
    })();

    const canEdit =
        // новый формат: объект автора с id
        (typeof rawAuthor === 'object' && rawAuthor !== null && user?.id === rawAuthor.id) ||
        // старый формат: строка с email/username
        user?.email === rawAuthor ||
        user?.username === rawAuthor ||
        isModerator;

    if (!comment) return null;

    const hasChildren = comment.children && comment.children.length > 0;
    const childrenCount = hasChildren ? comment.children.length : 0;

    return (
        <div className="comment">
            <div className="comment__header">
                <strong>{number}</strong>
                <span>{authorName}</span>
            </div>

            {isEditing ? (
                <div className="comment__edit-form">
                    <Myinput
                        type="text"
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        placeholder="Измените текст комментария..."
                        disabled={loading}
                    />
                    <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                        <Mybutton onClick={ChangingComment} disabled={loading || !editText.trim()}>
                            {loading ? 'Сохранение...' : 'Сохранить'}
                        </Mybutton>
                        <Mybutton onClick={() => {
                            setIsEditing(false);
                            setEditText(comment.text || '');
                        }}>
                            Отмена
                        </Mybutton>
                    </div>
                </div>
            ) : (
                <div className="comment__body">
                    {comment.text || ''}
                </div>
            )}

            <div className="comment__footer">
                <small>
                    {comment.created_at
                        ? new Date(comment.created_at).toLocaleString()
                        : ''}
                </small>

                <div style={{ display: 'flex', gap: '8px' }}>
                    {/* Кнопка ответа */}
                    <Mybutton
                        onClick={() => setShowReplyForm(!showReplyForm)}
                        style={{ padding: '2px 8px' }}
                    >
                        {showReplyForm ? '✕' : '↩'}
                    </Mybutton>

                    {/* Кнопки для автора/модератора */}
                    {canEdit && (
                        <>
                            <Mybutton
                                onClick={() => setIsEditing(!isEditing)}
                                disabled={loading}
                                style={{ padding: '2px 8px' }}
                            >
                                ✏️
                            </Mybutton>
                            <Mybutton onClick={DeleteComments} disabled={loading} style={{ padding: '2px 8px' }}>
                                🗑️
                            </Mybutton>
                        </>
                    )}
                </div>
            </div>

            {/* Форма для ответа */}
            {showReplyForm && (
                <div className="comment__reply-form">
                    <Myinput
                        type="text"
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder="Ваш ответ..."
                        onKeyDown={(event) => {
                            if (event.key === 'Enter' && !loading && replyText.trim()) {
                                event.preventDefault();
                                addChildComment();
                            }
                        }}
                        disabled={loading}
                    />
                    <Mybutton
                        onClick={addChildComment}
                        disabled={loading || !replyText.trim()}
                    >
                        {loading ? '...' : 'Ответить'}
                    </Mybutton>
                </div>
            )}

            {/* Кнопка раскрытия дочерних комментариев */}
            {hasChildren && (
                <div className="comment__children-toggle">
                    <Mybutton
                        onClick={() => setShowChildren(!showChildren)}
                        className="comment__children-toggle-btn"
                        style={{
                            fontSize: '13px',
                            padding: '4px 12px',
                            marginTop: '10px'
                        }}
                    >
                        {showChildren ? '−' : '+'} {childrenCount} {getWordForm(childrenCount, 'ответ', 'ответа', 'ответов')}
                    </Mybutton>
                </div>
            )}

            {/* Вложенные комментарии */}
            {hasChildren && showChildren && (
                <div className="comment__children">
                    {comment.children.map((child, idx) => (
                        <CommentsItem
                            key={child.id || idx}
                            comment={child}
                            number={`⬑`}
                            onCommentAdded={onCommentAdded}
                            postId={postId}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};


const getWordForm = (count, one, few, many) => {
    const mod10 = count % 10;
    const mod100 = count % 100;

    if (mod100 >= 11 && mod100 <= 19) return many;
    if (mod10 === 1) return one;
    if (mod10 >= 2 && mod10 <= 4) return few;
    return many;
};

export default CommentsItem;