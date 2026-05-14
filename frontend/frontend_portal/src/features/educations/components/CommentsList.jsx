import React, {useContext, useEffect} from 'react';
import PostService from "../API/PostService";
import CommentsItem from "./CommentsItem";
import UserService from "../../../API/UserService";
import Mybutton from "../../../components/UI/button/Mybutton";
import Myinput from "../../../components/UI/input/Myinput";
import {AuthContext} from "../../../context";

const CommentsList = ({ postId }) => {
    const { isAuth } = useContext(AuthContext);
    const [comments, setComments] = React.useState([]);
    const [newCommentText, setNewCommentText] = React.useState("");
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState(null);


    const addComment = async () => {
        if (!newCommentText.trim()) return;

        try {
            setLoading(true);
            await UserService.AddComments(postId, newCommentText);
            setNewCommentText("");
            await fetchComments();
        } catch (e) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    };

    const fetchComments = async () => {
        try {
            setLoading(true);
            const response = await PostService.getCommentsByPostId(postId);
            setComments(response.data);
        } catch (error) {
            console.log(error);
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    const refreshComments = async () => {
        await fetchComments();
    };

    useEffect(() => {
        if (postId) {
            fetchComments();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [postId]);

    if (loading && !comments.length) return <div>Загрузка комментариев...</div>;
    if (error) return <div>Ошибка: {error}</div>;

    return (
        <div className="comments-list">
            <h3>
                <span>Комментарии ({comments.length})</span>
            </h3>

            {isAuth && (
                <div className="comment-input-row">
                    <Myinput
                        type="text"
                        value={newCommentText}
                        placeholder="Напишите комментарий..."
                        onChange={event => setNewCommentText(event.target.value)}
                        onKeyDown={(event) => {
                            if (event.key === 'Enter' && !loading && newCommentText.trim()) {
                                event.preventDefault();
                                addComment();
                            }
                        }}
                        disabled={loading}
                        required
                    />
                    <Mybutton
                        className="comment-send-btn"
                        onClick={addComment}
                        disabled={loading || !newCommentText.trim()}
                        title="Отправить"
                    >
                        →
                    </Mybutton>
                </div>
            )}

            {!isAuth && (
                <div style={{marginBottom: '14px', color: 'var(--color-text-muted)'}}>
                    Чтобы оставить комментарий, выполните вход.
                </div>
            )}

            {comments.length === 0 ? (
                <h3 style={{ textAlign: "center", color: 'var(--color-text-muted)' }}>
                    💬 Комментариев пока нет. Будьте первым!
                </h3>
            ) : (
                comments.map((comment, index) => (
                    <CommentsItem
                        key={comment.id || index}
                        comment={comment}
                        number={index + 1}
                        onCommentAdded={refreshComments}
                        postId={postId}
                    />
                ))
            )}
        </div>
    );
};

export default CommentsList;