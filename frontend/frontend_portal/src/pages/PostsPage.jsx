import React, {useEffect, useState} from 'react';
import {useNavigate, useParams} from "react-router-dom";
import {useFetching} from "../hooks/useFetching";
import PostService from "../API/PostService";
import Loader from "../components/UI/loader/loader";
import ArticleViewer from "../components/UI/MyEditor/ArticleViewer";
import {useUser} from "../hooks/useUser";
import Mybutton from "../components/UI/button/Mybutton";
import ChangePostForm from "../components/ChangePost";
import UserService from "../API/UserService";
import CommentsItem from "../components/CommentsItem";
import CommentsList from "../components/CommentsList";
import AuthorCard from "../components/AuthorCard";


const PostsPage = () => {
    const [editPost, setEditPost] = useState(false);
    const {user} = useUser();
    const navigate = useNavigate();
    const params = useParams();
    const [post, setPost] = useState({body: '', title: ''});
    const [fetchPostsById, isLoading, error] = useFetching(async () => {
        const response = await PostService.getAllById(params.id);
        setPost(response.data);
    });

    const sendToModeration = async () => {
        try {
            await UserService.sendToModeration(post.id);
        } catch (error) {
            console.error(error);
        } finally {
            navigate('/account')
        }
    }


    const deletePost = async () => {
        try {
            await UserService.DeletePost(post.id);
        } catch (error) {
            console.log(error);
        } finally {
            navigate('/account')
        }
    }

    useEffect(() => {
        fetchPostsById(params.id);
    }, [params.id]);

    // Функция для обновления данных после сохранения
    const handlePostUpdated = () => {
        fetchPostsById(params.id);
        setEditPost(false);
    };

    return (
        <div>
            {isLoading ? (
                <Loader/>
            ) : editPost ? (
                <ChangePostForm onSuccess={handlePostUpdated}/>
            ) : (
                <div className="post-page-layout">
                    {/* Левая колонка с контентом */}
                    <div className="post-content-column">
                        <ArticleViewer
                            articleContent={post.body}
                            articleTitle={post.title}
                        />

                        {user?.id === post.author?.id && post.status !== 'published' && (
                            <div className="post-actions">
                                <Mybutton onClick={() => setEditPost(true)}>
                                    Изменить пост
                                </Mybutton>
                                <Mybutton onClick={deletePost}>Удалить пост</Mybutton>
                                <Mybutton onClick={sendToModeration}>Отправить на модерацию</Mybutton>
                            </div>
                        )}

                        {post.status === 'published' && <CommentsList postId={post.id}/>}
                    </div>

                    <div className="author-sidebar">
                        <AuthorCard post={post}/>
                    </div>
                </div>
            )}
        </div>
    );
}
export default PostsPage;