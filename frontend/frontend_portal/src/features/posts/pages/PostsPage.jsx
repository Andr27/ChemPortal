import React, {useEffect, useState} from 'react';
import {Link, useLocation, useNavigate, useParams} from "react-router-dom";
import {useFetching} from "../../../hooks/useFetching";
import PostService from "../API/PostService";
import Loader from "../../../components/UI/loader/loader";
import ArticleViewer from "../../../components/UI/MyEditor/ArticleViewer";
import {useUser} from "../../../hooks/useUser";
import ChangePostForm from "../components/ChangePost";
import UserService from "../../../API/UserService";
import CommentsList from "../components/CommentsList";
import AuthorCard from "../components/AuthorCard";
import Likes from "../components/Likes";
import BookmarkPost from "../components/BookmarkPost";
import MyModal from "../../../components/UI/MyModal/MyModal";
import eyeIcon from "../../../img/icon/eye-alt-svgrepo-com.svg";


const BACK_PATH_LABELS = {
    '/posts': 'К статьям',
    '/videos': 'К видео',
    '/news': 'К новостям',
    '/bookmarks': 'К закладкам',
    '/account': 'В личный кабинет'
};

const PostsPage = () => {
    const [editPost, setEditPost] = useState(false);
    const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);
    const {user} = useUser();
    const navigate = useNavigate();
    const location = useLocation();
    const params = useParams();
    const backPath = location.state?.from || '/posts';
    const backLabel = BACK_PATH_LABELS[backPath] || 'К статьям';
    const [post, setPost] = useState({body: '', title: ''});
    const [loading, setLoading] = useState(false);
    const [fetchPostsById, isLoading] = useFetching(async () => {
        const response = await PostService.getAllById(params.id);
        setPost(response.data);
    });

    const sendToModeration = async () => {
        try {
            setLoading(true);
            await UserService.sendToModeration(post.id);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
            navigate('/account')
        }
    }


    const deletePost = async () => {
        try {
            setLoading(true);
            await UserService.DeletePost(post.id);
        } catch (error) {
            console.log(error);
        } finally {
            setLoading(false);
            navigate('/account')
        }
    };

    useEffect(() => {
        fetchPostsById(params.id);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [params.id]);

    // Функция для обновления данных после сохранения
    const handlePostUpdated = () => {
        fetchPostsById(params.id);
        setEditPost(false);
    };

    return (
        <div className="page-wrapper post-page-wrapper">
            {params.id && (
                <div className="education-back-link-wrap">
                    <Link className="education-back-link" to={backPath}>
                        <span className="education-back-link__icon" aria-hidden="true">←</span>
                        {backLabel}
                    </Link>
                </div>
            )}
            {isLoading ? (
                <Loader/>
            ) : editPost ? (
                <ChangePostForm onSuccess={handlePostUpdated}/>
            ) : (
                <div className="post-page-layout">
                    {/* Левая колонка с контентом */}
                    <div className="post-content-column">
                        <div className="post-article-card">
                            <ArticleViewer
                                articleContent={post.body}
                                articleTitle={post.title}
                                images={post.images || []}
                            />
                        </div>

                        {user?.id === post.author?.id && post.status !== 'published' && post.reject_comment && (
                            <div className="reject-comment-banner">
                                <span className="reject-comment-banner__icon">⚠</span>
                                <div className="reject-comment-banner__body">
                                    <span className="reject-comment-banner__title">Причина отклонения</span>
                                    <span className="reject-comment-banner__text">{post.reject_comment}</span>
                                </div>
                            </div>
                        )}

                        {user?.id === post.author?.id && post.status !== 'published' && (
                            <div className="post-actions post-actions--draft">
                                <button
                                style={{
                                    background: 'var(--color-danger, #e55)',
                                    color: '#fff',
                                }}
                                className="edu-create__save-btn"
                                onClick={() => setDeleteConfirmVisible(true)}
                                disabled={loading}
                            >
                                Удалить пост
                            </button>
                                <div className="post-actions__right">
                                    <button
                                        onClick={() => setEditPost(true)}
                                        className="edu-create__save-btn edu-create__save-btn--draft"
                                        disabled={loading}
                                    >
                                        Редактировать
                                    </button>
                                    <button
                                        type="button"
                                        className="edu-create__save-btn edu-create__save-btn--moderation"
                                        onClick={sendToModeration}
                                        disabled={loading}
                                    >
                                        Отправить на модерацию
                                    </button>
                                </div>
                            </div>
                        )}

                        {post.status === 'published' && <CommentsList postId={post.id}/>}
                    </div>

                    <div className="author-sidebar">
                        <AuthorCard post={post}/>
                        {post.status === 'published' && (
                            <div className="post-sidebar-actions">
                                <Likes post={post}/>
                                <BookmarkPost post={post}/>
                                <div className="post-views-chip post-views-chip--sidebar" aria-label="Просмотры">
                                    <span className="post-views-chip__icon" aria-hidden="true">
                                        <img src={eyeIcon} alt="" className="post-views-chip__icon-img" />
                                    </span>
                                    <span>{post.views ?? post.views_count ?? 0}</span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            <MyModal visible={deleteConfirmVisible} setVisible={setDeleteConfirmVisible} width="420px">
                <div className="delete-confirm">
                    <h3 className="delete-confirm__title">Удалить пост?</h3>
                    <p className="delete-confirm__text">
                        Это действие нельзя отменить. Пост будет удалён без возможности восстановления.
                    </p>
                    <div className="delete-confirm__actions">
                        <button
                            type="button"
                            className="edu-create__save-btn edu-create__save-btn--draft"
                            onClick={() => setDeleteConfirmVisible(false)}
                        >
                            Отмена
                        </button>
                        <button
                            type="button"
                            className="edu-create__save-btn"
                            style={{ background: 'var(--color-danger, #dc2626)', color: '#fff' }}
                            onClick={async () => {
                                setDeleteConfirmVisible(false);
                                await deletePost();
                            }}
                        >
                            Удалить
                        </button>
                    </div>
                </div>
            </MyModal>
        </div>
    );
}
export default PostsPage;