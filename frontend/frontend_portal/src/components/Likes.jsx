import React, {useState} from 'react';
import UserService from "../API/UserService";
import Mybutton from "./UI/button/Mybutton";


const Likes = (props) => {
    const [liked, setLiked] = useState(props.post.is_liked);
    const [likesCount, setLikesCount] = useState(props.post.likes_count);
    const [disliked, setDisLiked] = useState(props.post.is_disliked);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const toggleLike = async () => {
        try {
            setLoading(true);
            await UserService.LikesIDPost(props.post.id);

            setLiked(!liked);
            setLikesCount(prev => liked ? prev - 1 : prev + 1);
            if (disliked) setDisLiked(false);

        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const toggleDisLike = async () => {
        try {
            setLoading(true);
            await UserService.DisLikesIDPost(props.post.id);

            setDisLiked(!disliked);
            if (liked) {
                setLiked(false);
                setLikesCount(prev => prev - 1);
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
            <span>❤️ {likesCount}</span>
            <Mybutton
                onClick={toggleLike}
                disabled={loading}
            >
                {loading ? '...' : (liked ? 'Убрать лайк' : 'Поставить лайк')}
            </Mybutton>
            <Mybutton
                onClick={toggleDisLike}
                disabled={loading}
            >
                {loading ? '...' : (disliked ? 'Убрать дизлайк' : 'Поставить дизлайк')}
            </Mybutton>
            {error && <span style={{color: 'red'}}>⚠️</span>}
        </div>
    );
};

export default Likes;