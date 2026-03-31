import React, {useEffect, useRef, useState} from 'react';
import {usePosts} from "../hooks/usePosts";
import {useFetching} from "../../../hooks/useFetching";
import UserService from "../../../API/UserService";
import {getPageCount} from "../../../utils/pages";
import {useObserver} from "../../../hooks/useObserver";
import PostFilter from "./PostFilter";
import PostList from "./PostList";
import Loader from "../../../components/UI/loader/loader";
import {PostListSkeleton, AccountPostListSkeleton} from "../../../components/UI/skeleton/Skeleton";
import ScrollableContainer from "../../../components/UI/ScrollableContainer/ScrollableContainer";
import ModerationList from "./Moderation/ModerationList";
import AccountPostList from "./AccountPostList";
import PostService from "../API/PostService";
import {useNavigate} from "react-router-dom";
import MyModal from "../../../components/UI/MyModal/MyModal";

/*                   Один метод
<PostGet
    fetchMethod={UserService.myPublishedPost}
    title="Мои публикации"
/>

                     Несколько методов, объединённые
<PostGet
    fetchMethods={[
        UserService.myDraftPosts,
        UserService.myRejectedPosts
    ]}
    combineResults={true}
    title="Черновики и отклонённые"
/>*/

// --- Каталог тем: рендерится только когда открыт, управляет своим состоянием ---
const CatalogContent = ({ onSelect }) => {
    const [search, setSearch] = useState('');
    const [tags, setTags] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const isSearching = search.trim().length > 0;

    // Загрузить все теги постранично и собрать в один список
    useEffect(() => {
        let cancelled = false;
        const loadAll = async () => {
            setIsLoading(true);
            try {
                const PAGE_SIZE = 100;
                let currentPage = 1;
                let allTags = [];
                while (true) {
                    const resp = await PostService.getTags(PAGE_SIZE, currentPage);
                    if (cancelled) return;
                    const data = resp.data;
                    const list = Array.isArray(data) ? data : (data?.results ?? []);
                    allTags = [...allTags, ...list];
                    const count = typeof data?.count === 'number' ? data.count : list.length;
                    if (allTags.length >= count || list.length < PAGE_SIZE) break;
                    currentPage++;
                }
                if (!cancelled) setTags(allTags);
            } catch (e) {
                console.error('Failed to load catalog tags', e); // eslint-disable-line no-console
            } finally {
                if (!cancelled) setIsLoading(false);
            }
        };
        loadAll();
        return () => { cancelled = true; };
    }, []);

    const handleSearch = (e) => {
        setSearch(e.target.value);
    };

    const filteredTags = isSearching
        ? tags.filter(t => t.name.toLowerCase().includes(search.toLowerCase()))
        : tags;

    const grouped = Object.entries(
        filteredTags.reduce((acc, tag) => {
            if (!tag?.name) return acc;
            const letter = tag.name.trim().charAt(0).toUpperCase() || '#';
            if (!acc[letter]) acc[letter] = [];
            acc[letter].push(tag);
            return acc;
        }, {})
    ).sort(([a], [b]) => a.localeCompare(b, 'ru'));

    return (
        <div className="posts-tags-catalog">
            <h3 className="posts-tags-catalog__title">Каталог тем</h3>
            <input
                type="text"
                className="posts-tags-catalog__search"
                placeholder="Поиск по тегам..."
                value={search}
                onChange={handleSearch}
            />
            <div className="posts-tags-catalog__grid">
                {isLoading && (
                    <p className="posts-tags-modal__empty">Загрузка...</p>
                )}
                {!isLoading && grouped.map(([letter, groupTags]) => (
                    <div key={letter} className="posts-tags-catalog__group">
                        <div className="posts-tags-catalog__letter">{letter}</div>
                        <div className="posts-tags-catalog__groupGrid">
                            {groupTags
                                .slice()
                                .sort((a, b) => a.name.localeCompare(b.name, 'ru'))
                                .map((tag) => (
                                    <button
                                        key={tag.id}
                                        type="button"
                                        className="posts-tags-catalog__item"
                                        onClick={() => onSelect(tag)}
                                    >
                                        {tag.name}
                                    </button>
                                ))}
                        </div>
                    </div>
                ))}
                {!isLoading && filteredTags.length === 0 && isSearching && (
                    <p className="posts-tags-modal__empty">Ничего не найдено по запросу.</p>
                )}
            </div>
        </div>
    );
};

const PostGet = ({
                     fetchMethod,
                     typeList = 'posts',
                     fetchMethods = [],
                     title = "Посты",
                     combineResults = false,
                     disableScroll = false,
                     scrollMaxHeight = '300px',
                     plainScroll = false,
                     showHeader = true,
                     className = '',
                     listPath = '/posts',
                     originListPath, // откуда изначально пришли (статьи / новости / видео)
                     compactList = false, // компактные карточки как в образовательном разделе
                     headerExtra = null, // доп. элемент в шапке (напр. кнопка подписки)
                     activeTagSlug = null, // slug текущего выбранного тега
                 }) => {
    const navigate = useNavigate();
    const [posts, setPosts] = useState([]);
    const [filter, setFilter] = useState({ sort: '', query: '' });
    const [totalPages, setTotalPages] = useState(0);
    const [limit] = useState(12);
    const [page, setPage] = useState(1);
    const sortedAndSearchedPost = usePosts(posts, filter.sort, filter.query);
    const lastElement = useRef();
    // --- полоска тегов ---
    const [tags, setTags] = useState([]);
    const [tagPage, setTagPage] = useState(1);       // текущая страница (1-based)
    const [tagDirection, setTagDirection] = useState(null); // 'left' | 'right'
    const [tagTotalPages, setTagTotalPages] = useState(1);
    const [isTagsLoading, setIsTagsLoading] = useState(false);
    const TAG_STRIP_LIMIT = 6;

    // --- каталог тем ---
    const [isCatalogOpen, setIsCatalogOpen] = useState(false);

    const [isHeaderScrolled, setIsHeaderScrolled] = useState(false);

    const effectiveOriginPath = originListPath || listPath;

    const [fetchPosts, isPostLoading, postError] = useFetching(async (limit, page) => {
        let responseData;
        let totalCount;


        if (fetchMethod && !combineResults) {
            const response = await fetchMethod(limit, page);
            responseData = response.data.results;  // ← ВСЕГДА .results!
            totalCount = response.data.count;
        }

        else if (fetchMethods.length > 0 && combineResults) {
            const responses = await Promise.all(
                fetchMethods.map(method => method(limit, page))
            );
            responseData = responses.flatMap(r => r.data.results);  // ← .results!
            totalCount = responses.reduce((sum, r) => sum + (r.data.count || 0), 0);
        }

        else {
            const response = await UserService.getMyPosts(limit, page);
            responseData = response.data.results;  // ← .results!
            totalCount = response.data.count;
        }

        setPosts(prev => page === 1 ? responseData : [...prev, ...responseData]);
        setTotalPages(getPageCount(totalCount, limit));
    });

    useObserver(
        lastElement,
        page < totalPages,
        isPostLoading,
        () => setPage(prev => prev + 1)
    );

    useEffect(() => {
        fetchPosts(limit, page);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page, limit]);

    // Загрузка страницы полоски тегов
    useEffect(() => {
        let cancelled = false;
        const loadTagPage = async () => {
            setIsTagsLoading(true);
            try {
                const resp = await PostService.getTags(TAG_STRIP_LIMIT, tagPage);
                if (cancelled) return;
                const data = resp.data;
                const list = Array.isArray(data) ? data : (data?.results ?? []);
                const count = typeof data?.count === 'number' ? data.count : list.length;
                setTags(list);
                setTagTotalPages(Math.max(1, Math.ceil(count / TAG_STRIP_LIMIT)));
            } catch (e) {
                // eslint-disable-next-line no-console
                console.error('Failed to load tags', e);
            } finally {
                if (!cancelled) setIsTagsLoading(false);
            }
        };
        loadTagPage();
        return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tagPage]);

    useEffect(() => {
        const threshold = 8;
        const updateFromMainScroll = (e) => {
            setIsHeaderScrolled((e.detail?.scrollTop ?? 0) > threshold);
        };
        const updateFromWindow = () => {
            setIsHeaderScrolled(window.scrollY > threshold);
        };
        window.addEventListener('main-scroll', updateFromMainScroll);
        window.addEventListener('scroll', updateFromWindow);
        updateFromWindow();
        return () => {
            window.removeEventListener('main-scroll', updateFromMainScroll);
            window.removeEventListener('scroll', updateFromWindow);
        };
    }, []);

    const hasPrevTagPage = tagPage > 1;
    const hasNextTagPage = tagPage < tagTotalPages;

    return (
        <div className={`posts-page ${className}`.trim()}>
            {postError && (
                <h2 style={{ color: '#b91c1c', textAlign: 'center', marginTop: 24 }}>
                    Произошла ошибка: {postError}
                </h2>
            )}

            <ScrollableContainer isDisable={disableScroll} maxHeight={scrollMaxHeight} plainStyle={plainScroll}>
                {showHeader && (
                    <div className={`posts-page__header ${isHeaderScrolled ? 'posts-page__header--scrolled' : ''}`}>
                        <div className="posts-page__controls-row">
                            <div className="posts-page__filters">
                                <PostFilter
                                    filter={filter}
                                    setFilter={setFilter}
                                />
                            </div>
                        </div>
                        {(tags.length > 0 || isTagsLoading) && (
                            <div
                                className={`posts-tags-strip ${isHeaderScrolled ? 'posts-tags-strip--scrolled' : ''}`.trim()}
                                aria-label="Популярные теги"
                            >
                                <button
                                    type="button"
                                    className="posts-tags-strip__catalog"
                                    onClick={() => setIsCatalogOpen(true)}
                                >
                                    Каталог тем
                                </button>
                                <button
                                    type="button"
                                    className="posts-tags-strip__next"
                                    disabled={!hasPrevTagPage}
                                    onClick={() => { setTagDirection('right'); setTagPage(p => p - 1); }}
                                    aria-label="Предыдущая страница тем"
                                >
                                    ←
                                </button>
                                <div
                                    className={`posts-tags-strip__list${tagDirection ? ` posts-tags-strip__list--slide-${tagDirection}` : ''}`}
                                    onAnimationEnd={() => setTagDirection(null)}
                                >
                                    {isTagsLoading
                                        ? <span className="posts-tags-strip__loading">...</span>
                                        : tags.map((tag) => (
                                            <button
                                                key={tag.id}
                                                type="button"
                                                className={`posts-tags-strip__item${activeTagSlug === tag.slug ? ' posts-tags-strip__item--active' : ''}`}
                                                onClick={() => activeTagSlug === tag.slug ? navigate(effectiveOriginPath) : navigate(`/tags/${tag.slug}`, { state: { fromList: effectiveOriginPath } })}
                                            >
                                                <span className="posts-tags-strip__name">{tag.name}</span>
                                            </button>
                                        ))
                                    }
                                </div>
                                <button
                                    type="button"
                                    className="posts-tags-strip__next"
                                    disabled={!hasNextTagPage}
                                    onClick={() => { setTagDirection('left'); setTagPage(p => p + 1); }}
                                    aria-label="Следующая страница тем"
                                >
                                    →
                                </button>
                            </div>
                        )}
                    </div>
                )}

                <div className="posts-page__content" style={{ position: 'relative' }}>
                    {headerExtra && (
                        <div className="posts-page__header-extra">
                            {headerExtra}
                        </div>
                    )}
                    {posts.length === 0 && !isPostLoading && !postError && (
                        <h2 style={{ textAlign: 'center', marginTop: 24, color: '#6b7280' }}>
                            {title} не найдены
                        </h2>
                    )}

                    {isPostLoading && posts.length === 0 ? (
                        compactList
                            ? <AccountPostListSkeleton count={4} />
                            : <PostListSkeleton count={6} />
                    ) : typeList === 'moderation' ? (
                        <ModerationList
                            posts={sortedAndSearchedPost}
                        />
                    ) : compactList ? (
                        <AccountPostList
                            posts={sortedAndSearchedPost}
                            listPath={listPath}
                        />
                    ) : (
                        <PostList
                            posts={sortedAndSearchedPost}
                            listPath={listPath}
                        />
                    )}

                    <div ref={lastElement} style={{ height: 20 }} />

                    {isPostLoading && posts.length > 0 && (
                        <div style={{ display: "flex", justifyContent: "center", marginTop: 32 }}>
                            <Loader />
                        </div>
                    )}
                </div>
            </ScrollableContainer>

            <MyModal
                visible={isCatalogOpen}
                setVisible={setIsCatalogOpen}
                width="960px"
                height="80vh"
            >
                {isCatalogOpen && (
                    <CatalogContent
                        onSelect={(tag) => {
                            setIsCatalogOpen(false);
                            navigate(`/tags/${tag.slug}`, { state: { fromList: effectiveOriginPath } });
                        }}
                    />
                )}
            </MyModal>
        </div>
    );
};

export default PostGet;