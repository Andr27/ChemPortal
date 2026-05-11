import React, { useEffect, useState } from 'react';
import { useParams, useLocation, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import AccountService from '../API/AccountService';
import UserService from '../../../API/UserService';
import Loader from '../../../components/UI/loader/loader';
import { useUser } from '../../../hooks/useUser';
import api from '../../../API/api';
import vkIcon from '../../../img/icon/vk.svg';
import telegramIcon from '../../../img/icon/telegram.svg';
import siteIcon from '../../../img/icon/site.svg';
import AuthorActivity from '../component/AuthorActivity';
import AuthorLikedPosts from '../component/AuthorLikedPosts';

const toAbsoluteUrl = (url) => {
    if (!url || typeof url !== 'string') return '';
    if (/^https?:\/\//i.test(url)) return url;
    try { return new URL(url, api?.defaults?.baseURL || '').toString(); } catch { return url; }
};

const formatCount = (count) => {
    const n = Math.abs(Number(count)) || 0;
    return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
};

const getSubscribersLabel = (count) => {
    const n = Math.abs(Number(count)) || 0;
    const lastTwo = n % 100;
    const lastOne = n % 10;
    if (lastTwo >= 11 && lastTwo <= 14) return 'подписчиков';
    if (lastOne === 1) return 'подписчик';
    if (lastOne >= 2 && lastOne <= 4) return 'подписчика';
    return 'подписчиков';
};

const AuthorInformationPage = () => {
    const { id } = useParams();
    const location = useLocation();
    const { user } = useUser();
    const backPath = location.state?.from || '/posts';
    const backLabel = backPath === '/posts' ? 'К статьям' : 'Назад';
    const [authorData, setAuthorData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [subLoading, setSubLoading] = useState(false);
    const [subscribed, setSubscribed] = useState(false);
    const [activity, setActivity] = useState(null);
    const [likedPosts, setLikedPosts] = useState([]);
    const [extrasLoading, setExtrasLoading] = useState(true);

    const getMySubscribe = async () => {
        try {
            const response = await AccountService.GetMySubscribes();
            const data = response.data;
            const isSubscribed = Array.isArray(data)
                ? data.some(sub => String(sub.author) === String(id))
                : String(data.author) === String(id);
            setSubscribed(isSubscribed);
        } catch (error) {
            console.log(error);
        }
    };

    const Subscribe = async () => {
        if (!authorData?.id) return;
        setSubLoading(true);
        try {
            if (!subscribed) {
                await UserService.SubscribeToAuthor(authorData.id);
                setSubscribed(true);
                setAuthorData(prev => ({ ...prev, subscribers_count: (prev.subscribers_count ?? 0) + 1 }));
            } else {
                await UserService.UnSubscribeToAuthor(authorData.id);
                setSubscribed(false);
                setAuthorData(prev => ({ ...prev, subscribers_count: Math.max(0, (prev.subscribers_count ?? 0) - 1) }));
            }
        } catch (error) {
            console.log(error);
        } finally {
            setSubLoading(false);
        }
    };

    const fetchAuthorData = async () => {
        setLoading(true);
        try {
            const response = await AccountService.GetAuthorInformation(id);
            setAuthorData(response.data);
        } catch (error) {
            console.log(error);
        } finally {
            setLoading(false);
        }
    };

    const fetchExtras = async () => {
        setExtrasLoading(true);
        try {
            const [activityResp, likedResp] = await Promise.all([
                AccountService.GetCreatorActivity(id).catch(() => null),
                AccountService.GetCreatorLiked(id).catch(() => null),
            ]);
            setActivity(activityResp?.data ?? { posts: [], courses: [], sections: [] });
            const likedData = likedResp?.data;
            setLikedPosts(Array.isArray(likedData) ? likedData : (likedData?.results ?? []));
        } finally {
            setExtrasLoading(false);
        }
    };

    useEffect(() => {
        fetchAuthorData();
        getMySubscribe();
        fetchExtras();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    if (loading || !authorData) {
        return (
            <div className="page-wrapper">
                <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
                    <Loader />
                </div>
            </div>
        );
    }

    const fullName = `${authorData.first_name || ''} ${authorData.last_name || ''}`.trim() || 'Автор';
    const avatarSrc = toAbsoluteUrl(authorData.avatar);
    const isOwnProfile = user?.id && Number(user.id) === Number(authorData.id);

    const links = [
        authorData.vk_url && { icon: vkIcon, alt: 'ВКонтакте', url: authorData.vk_url },
        authorData.telegram_url && { icon: telegramIcon, alt: 'Telegram', url: authorData.telegram_url },
        authorData.website_url && { icon: siteIcon, alt: 'Сайт', url: authorData.website_url },
    ].filter(Boolean);

    return (
        <div className="page-wrapper">
            <Helmet><title>{fullName} — Автор</title></Helmet>

            <div className="author-page">
                <div className="education-back-link-wrap">
                    <Link className="education-back-link" to={backPath}>
                        <span className="education-back-link__icon" aria-hidden="true">←</span>
                        {backLabel}
                    </Link>
                </div>
                <div className="author-page__card">
                    {/* Шапка: аватар + имя */}
                    <div className="author-page__header">
                        <div className="author-page__avatar">
                            {avatarSrc
                                ? <img src={avatarSrc} alt="" className="author-page__avatar-img" />
                                : <span className="author-page__avatar-placeholder">
                                    {(authorData.first_name?.[0] || '?').toUpperCase()}
                                  </span>
                            }
                        </div>
                        <div className="author-page__header-info">
                            <div className="author-page__name-row">
                                <h1 className="author-page__name">{fullName}</h1>
                                {authorData.level != null && (
                                    <div className="author-page__level-badge">
                                        <span className="author-page__level-icon">★</span>
                                        {authorData.level}
                                    </div>
                                )}
                            </div>
                            <p className="author-page__sub-count">
                        <strong>{formatCount(authorData.subscribers_count ?? 0)}</strong>
                        {' '}{getSubscribersLabel(authorData.subscribers_count)}
                            </p>
                        </div>
                    </div>

                    {/* Статистика */}
                    <div className="author-page__stats-row">
                        <div className="author-page__stat">
                            <span className="author-page__stat-icon author-page__stat-icon--posts">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
                            </span>
                            <div className="author-page__stat-text">
                                <span className="author-page__stat-value">{authorData.posts_count ?? 0}</span>
                                <span className="author-page__stat-label">статей</span>
                            </div>
                        </div>
                        <div className="author-page__stat-divider" />
                        <div className="author-page__stat">
                            <span className="author-page__stat-icon author-page__stat-icon--courses">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c0 1.1 2.7 3 6 3s6-1.9 6-3v-5"/></svg>
                            </span>
                            <div className="author-page__stat-text">
                                <span className="author-page__stat-value">{authorData.courses_count ?? 0}</span>
                                <span className="author-page__stat-label">курсов</span>
                            </div>
                        </div>
                        <div className="author-page__stat-divider" />
                        <div className="author-page__stat">
                            <span className="author-page__stat-icon author-page__stat-icon--rating">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                            </span>
                            <div className="author-page__stat-text">
                                <span className="author-page__stat-value">{authorData.rating ?? 0}</span>
                                <span className="author-page__stat-label">рейтинг</span>
                            </div>
                        </div>
                    </div>


                    {/* Доп. информация */}
                    {(authorData.bio || authorData.affiliation || authorData.scientific_interests || links.length > 0) && (
                        <div className="author-page__details">
                            {authorData.affiliation && (
                                <div className="author-page__field">
                                    <span className="author-page__field-label">Организация</span>
                                    <span className="author-page__field-value">{authorData.affiliation}</span>
                                </div>
                            )}
                            {authorData.bio && (
                                <div className="author-page__field">
                                    <span className="author-page__field-label">О себе</span>
                                    <span className="author-page__field-value">{authorData.bio}</span>
                                </div>
                            )}
                            {authorData.scientific_interests && (
                                <div className="author-page__field">
                                    <span className="author-page__field-label">Научные интересы</span>
                                    <span className="author-page__field-value">{authorData.scientific_interests}</span>
                                </div>
                            )}
                            <div className="author-page__bottom-row">
                                {links.length > 0 && (
                                    <div className="author-page__links">
                                        {links.map(l => (
                                            <a key={l.url} href={l.url} target="_blank" rel="noopener noreferrer" className="author-page__link" title={l.alt}>
                                                <img src={l.icon} alt={l.alt} className="author-page__link-icon" />
                                            </a>
                                        ))}
                                    </div>
                                )}
                                {!isOwnProfile && user?.id && (
                                    <button
                                        className={`author-page__sub-btn${subscribed ? ' author-page__sub-btn--active' : ''}`}
                                        onClick={Subscribe}
                                        disabled={subLoading}
                                    >
                                        {subLoading ? '...' : subscribed ? 'Отписаться' : 'Подписаться'}
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Активность автора + его лайки */}
                <div className="author-page__below">
                    <AuthorActivity activity={activity} isLoading={extrasLoading} />
                    <AuthorLikedPosts posts={likedPosts} isLoading={extrasLoading} />
                </div>
            </div>
        </div>
    );
};

export default AuthorInformationPage;
