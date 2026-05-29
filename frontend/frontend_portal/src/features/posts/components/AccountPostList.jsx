import React from 'react';
import { useNavigate } from 'react-router-dom';

const IconArticle = () => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <rect x="2" y="1" width="12" height="14" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
        <line x1="5" y1="5" x2="11" y2="5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
        <line x1="5" y1="8" x2="11" y2="8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
        <line x1="5" y1="11" x2="8" y2="11" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
    </svg>
);

const AccountPostItem = ({ post, listPath }) => {
    const navigate = useNavigate();
    const openPost = () => navigate(`/posts/${post.id}`, { state: { from: listPath } });

    const typeLabel = post.type === 'news' ? 'Новости' : post.type === 'article' ? 'Статья' : post.type === 'video' ? 'Видео' : 'Ссылка';

    return (
        <div
            className="eap-card eap-card--link"
            onClick={openPost}
            role="button"
            tabIndex={0}
            onKeyDown={e => e.key === 'Enter' && openPost()}
        >
            <div className="eap-card__accent eap-card__accent--article" />
            <div className="eap-card__icon eap-card__icon--article">
                <IconArticle />
            </div>
            <div className="eap-card__body">
                <div className="eap-card__top">
                    <span className="eap-card__badge eap-card__badge--article">{typeLabel}</span>
                    <span className="eap-card__title">{post.title}</span>
                    {post.status && (
                        <span className={`edu-status-badge edu-status--${post.status === 'moderation' ? 'pending' : post.status}`}>
                            {post.status === 'draft' ? 'Черновик' : post.status === 'published' ? 'Опубликовано' : post.status === 'rejected' ? 'Отклонено' : post.status === 'moderation' ? 'На модерации' : post.status}
                        </span>
                    )}
                </div>
            </div>
            <span className="eap-card__nav-arrow">→</span>
        </div>
    );
};

const AccountPostList = ({ posts, listPath = '/account' }) => (
    <div className="eap-group">
        <div className="eap-group__list">
            {posts.map((post, index) => (
                <AccountPostItem key={post.id || index} post={post} listPath={listPath} />
            ))}
        </div>
    </div>
);

export default AccountPostList;
