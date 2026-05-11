import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import api from '../../../API/api';

const toAbsoluteUrl = (url) => {
    if (!url || typeof url !== 'string') return '';
    if (/^https?:\/\//i.test(url)) return url;
    try { return new URL(url, api?.defaults?.baseURL || '').toString(); } catch { return url; }
};

const AuthorLikedPosts = ({ posts, isLoading }) => {
    const location = useLocation();
    const list = Array.isArray(posts) ? posts.slice(0, 5) : [];

    return (
        <section className="author-liked">
            <h2 className="author-liked__title">Понравилось</h2>
            {isLoading ? (
                <p className="author-liked__placeholder">Загрузка…</p>
            ) : list.length === 0 ? (
                <p className="author-liked__placeholder">Лайков пока нет.</p>
            ) : (
                <ul className="author-liked__list">
                    {list.map(post => {
                        const cover = toAbsoluteUrl(post.main_image || post.image_main);
                        const authorName = [post?.author?.first_name, post?.author?.last_name]
                            .filter(Boolean)
                            .join(' ')
                            .trim();
                        return (
                            <li key={post.id} className="author-liked__item">
                                <Link
                                    className="author-liked__link"
                                    to={`/posts/${post.id}`}
                                    state={{ from: location.pathname }}
                                >
                                    <div className="author-liked__cover">
                                        {cover ? (
                                            <img src={cover} alt="" className="author-liked__cover-img" />
                                        ) : (
                                            <span className="author-liked__cover-placeholder" aria-hidden="true">★</span>
                                        )}
                                    </div>
                                    <div className="author-liked__body">
                                        <span className="author-liked__post-title">{post.title || 'Без названия'}</span>
                                        {authorName && (
                                            <span className="author-liked__author">{authorName}</span>
                                        )}
                                    </div>
                                </Link>
                            </li>
                        );
                    })}
                </ul>
            )}
        </section>
    );
};

export default AuthorLikedPosts;
