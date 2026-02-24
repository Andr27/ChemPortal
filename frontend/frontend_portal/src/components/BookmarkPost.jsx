import React, {useState} from 'react';
import UserService from "../API/UserService";
import Mybutton from "./UI/button/Mybutton";


const BookmarkPost = (props) => {
    const [bookmarked, setBookmarked] = useState(props.post.is_bookmarked);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const bookmarkPost = async () => {
        try {
            if (!bookmarked) {
                setLoading(true);
                await UserService.BookmarkPost(props.post.id);
                setBookmarked(true);
            } else {
                setLoading(true);
                await UserService.DellBookmarkPost(props.post.id);
                setBookmarked(false);
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };


    return (
        <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
            <Mybutton
                onClick={bookmarkPost}
                disabled={loading}
            >
                {loading ? '...' : (bookmarked ? 'Убрать из закладок' : 'Добавить в закладки')}
            </Mybutton>
            {error && <span style={{color: 'red'}}>⚠️</span>}
        </div>
    );
};

export default BookmarkPost;