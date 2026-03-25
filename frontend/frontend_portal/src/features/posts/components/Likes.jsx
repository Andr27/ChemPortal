import React, { useContext, useState, useEffect } from 'react';
import UserService from "../../../API/UserService";
import { AuthContext } from "../../../context";
import iconLike from "../../../img/icon/like.svg";
import iconDislike from "../../../img/icon/disLike.svg";

/** Нормализация: с бэка не должны быть оба true одновременно */
const normalizeLikeState = (post) => {
    const isLiked = Boolean(post?.is_liked);
    const isDisliked = Boolean(post?.is_disliked);
    if (isLiked && isDisliked) {
        return { isLiked: true, isDisliked: false };
    }
    return { isLiked, isDisliked };
};

const Likes = (props) => {
    const { isAuth } = useContext(AuthContext);
    const { isLiked: initLiked, isDisliked: initDisliked } = normalizeLikeState(props.post);
    const [liked, setLiked] = useState(initLiked);
    const [likesCount, setLikesCount] = useState(props.post.likes_count ?? 0);
    const [disliked, setDisLiked] = useState(initDisliked);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        const { isLiked, isDisliked } = normalizeLikeState(props.post);
        setLiked(isLiked);
        setDisLiked(isDisliked);
        const count = props.post.likes_count ?? props.post.likesCount ?? 0;
        setLikesCount(Number(count));
    }, [props.post?.id, props.post?.is_liked, props.post?.is_disliked, props.post?.likes_count, props.post?.likesCount]);

    const toggleLike = async () => {
        if (loading) return;
        try {
            setLoading(true);
            await UserService.LikesIDPost(props.post.id);
            setLiked(prev => !prev);
            setLikesCount(prev => (liked ? prev - 1 : prev + 1));
            setDisLiked(false);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const toggleDisLike = async () => {
        if (loading) return;
        try {
            setLoading(true);
            await UserService.DisLikesIDPost(props.post.id);
            setDisLiked(prev => !prev);
            setLiked(false);
            if (liked) setLikesCount(prev => Math.max(0, prev - 1));
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="post-likes">
            <button
                type="button"
                className={`post-like-chip ${liked ? 'post-like-chip--active' : ''}`}
                onClick={toggleLike}
                disabled={loading || !isAuth}
            >
                <span
                    className="post-like-chip__icon"
                    style={{ maskImage: `url(${iconLike})`, WebkitMaskImage: `url(${iconLike})` }}
                    aria-hidden="true"
                />
                <span className="post-like-chip__count">{likesCount ?? 0}</span>
            </button>
            <button
                type="button"
                className={`post-dislike-icon ${disliked ? 'post-dislike-icon--active' : ''}`}
                onClick={toggleDisLike}
                disabled={loading || !isAuth}
                aria-label="Дизлайк"
            >
                <span
                    className="post-dislike-icon__icon"
                    style={{ maskImage: `url(${iconDislike})`, WebkitMaskImage: `url(${iconDislike})` }}
                    aria-hidden="true"
                />
            </button>
            {error && <span style={{color: '#dc2626'}}>⚠️</span>}
        </div>
    );
};

export default Likes;