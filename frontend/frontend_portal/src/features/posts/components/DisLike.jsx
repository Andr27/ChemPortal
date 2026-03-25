import React, {useState} from 'react';
import UserService from "../../../API/UserService";
import Mybutton from "../../../components/UI/button/Mybutton";

const DisLikes = (props) => {
    const [disLiked, setDisLiked] = useState(props.post.is_disliked);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const toggleDisLike = async () => {
        try {
            setLoading(true);
            await UserService.DisLikesIDPost(props.post.id);

            setDisLiked(!disLiked);

        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
            <Mybutton
                onClick={toggleDisLike}
                disabled={loading}
            >
                {loading ? '...' : (disLiked ? 'Убрать дизлайк' : 'Поставить дизлайк')}
            </Mybutton>
            {error && <span style={{color: 'red'}}>⚠️</span>}
        </div>
    );
};

export default DisLikes;