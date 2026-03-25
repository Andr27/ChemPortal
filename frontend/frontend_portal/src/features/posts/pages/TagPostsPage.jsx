import React, { useContext, useEffect, useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import PostService from "../API/PostService";
import PostGet from "../components/PostGet";
import { AuthContext } from "../../../context";

function TagPostsPage() {
    const { slug } = useParams();
    const [tag, setTag] = useState(null);
    const [isFavorite, setIsFavorite] = useState(false);
    const [isToggling, setIsToggling] = useState(false);
    const { isAuth } = useContext(AuthContext);
    const location = useLocation();

    useEffect(() => {
        let cancelled = false;
        const loadTag = async () => {
            try {
                const resp = await PostService.getTagDetail(slug);
                if (!cancelled) {
                    setTag(resp.data);
                }
            } catch (e) {
                console.error('Failed to load tag detail', e);
            }
        };
        loadTag();
        return () => { cancelled = true; };
    }, [slug]);

    useEffect(() => {
        if (!isAuth) return;
        let cancelled = false;
        const checkFavorite = async () => {
            try {
                const resp = await PostService.getMyFavoriteTags();
                const favs = Array.isArray(resp.data) ? resp.data : (resp.data?.results ?? []);
                if (!cancelled) {
                    setIsFavorite(favs.some(t => t.slug === slug));
                }
            } catch (e) {
                console.error('Failed to check favorite tags', e);
            }
        };
        checkFavorite();
        return () => { cancelled = true; };
    }, [slug, isAuth]);

    const handleToggleFavorite = async () => {
        setIsToggling(true);
        try {
            await PostService.toggleFavoriteTag(slug);
            setIsFavorite(prev => !prev);
        } catch (e) {
            console.error('Failed to toggle favorite tag', e);
        } finally {
            setIsToggling(false);
        }
    };

    const title = tag?.name ? `Посты по теме «${tag.name}»` : 'Посты по теме';

    const fromList = location.state?.fromList || '/posts';

    const typeMap = { '/news': 'news', '/videos': 'video', '/posts': 'article' };
    const feedType = typeMap[fromList] || undefined;

    const fetchPostsByTag = async (limit, page) => {
        return PostService.getFeed(limit, page, feedType, slug);
    };

    const subscribeButton = isAuth && tag ? (
        <button
            type="button"
            className={`tag-star${isFavorite ? ' tag-star--active' : ''}`}
            onClick={handleToggleFavorite}
            disabled={isToggling}
            title={isFavorite ? 'Отписаться от темы' : 'Подписаться на тему'}
        >
            <svg width="18" height="18" viewBox="0 0 24 24" fill={isFavorite ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
        </button>
    ) : null;

    return (
        <div className="App">
            <PostGet
                key={slug}
                fetchMethod={fetchPostsByTag}
                title={title}
                disableScroll="true"
                listPath={`/tags/${slug}`}
                originListPath={fromList}
                headerExtra={subscribeButton}
                activeTagSlug={slug}
            />
        </div>
    );
}

export default TagPostsPage;

