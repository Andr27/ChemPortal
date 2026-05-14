import React, {useContext, useState} from 'react';
import UserService from "../../../API/UserService";
import Mybutton from "../../../components/UI/button/Mybutton";
import {AuthContext} from "../../../context";

const BookmarkIcon = ({ active }) => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
    </svg>
);

const BookmarkPost = (props) => {
    const { isAuth } = useContext(AuthContext);
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
        <div style={{display: 'flex', alignItems: 'center', gap: '4px'}}>
            <Mybutton
                onClick={bookmarkPost}
                disabled={loading || !isAuth}
                className={bookmarked ? 'bookmark-btn bookmark-btn--active' : 'bookmark-btn'}
                style={{
                    padding: '4px 6px',
                    minWidth: 0
                }}
                aria-label={bookmarked ? 'Убрать из закладок' : 'Добавить в закладки'}
                aria-pressed={bookmarked}
            >
                {loading ? '…' : <BookmarkIcon active={bookmarked} />}
            </Mybutton>
            {error && <span style={{color: '#dc2626'}}>⚠️</span>}
        </div>
    );
};

export default BookmarkPost;