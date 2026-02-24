import React, {useEffect} from 'react';
import PostService from "../API/PostService";
import CommentsItem from "./CommentsItem";
import UserService from "../API/UserService";
import Mybutton from "./UI/button/Mybutton";
import Myinput from "./UI/input/Myinput";

const CommentsList = ({ postId }) => {
    const [comments, setComments] = React.useState([]);
    const [showAddForm, setShowAddForm] = React.useState(false);
    const [newCommentText, setNewCommentText] = React.useState("");
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState(null);


    const addComment = async () => {
        if (!newCommentText.trim()) return;

        try {
            setLoading(true);
            await UserService.AddComments(postId, newCommentText);
            setNewCommentText("");
            setShowAddForm(false);
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
    }, [postId]);

    if (loading && !comments.length) return <div>Загрузка комментариев...</div>;
    if (error) return <div>Ошибка: {error}</div>;

    return (
        <div className="comments-list">
            <h3>
                Комментарии ({comments.length})
                <Mybutton
                    style={{marginLeft: 520}}
                    onClick={() => setShowAddForm(!showAddForm)}
                >
                    {showAddForm ? '-' : '+'}
                </Mybutton>
            </h3>

            {showAddForm && (
                <div style={{marginBottom: '20px'}}>
                    <Myinput
                        type="text"
                        value={newCommentText}
                        placeholder="Введите текст комментария"
                        onChange={event => setNewCommentText(event.target.value)}
                        disabled={loading}
                        required
                    />
                    <Mybutton
                        onClick={addComment}
                        disabled={loading || !newCommentText.trim()}
                    >
                        {loading ? 'Отправка...' : 'Отправить'}
                    </Mybutton>
                </div>
            )}

            {comments.length === 0 ? (
                <h3 style={{ textAlign: "center", color: '#666' }}>
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