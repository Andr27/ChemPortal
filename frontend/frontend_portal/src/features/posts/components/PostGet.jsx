import React, {useEffect, useRef, useState} from 'react';
import {useFetching} from "../../../hooks/useFetching";
import UserService from "../../../API/UserService";
import {getPageCount} from "../../../utils/pages";
import {useObserver} from "../../../hooks/useObserver";
import PostList from "./PostList";
import Loader from "../../../components/UI/loader/loader";
import {PostListSkeleton, AccountPostListSkeleton} from "../../../components/UI/skeleton/Skeleton";
import ScrollableContainer from "../../../components/UI/ScrollableContainer/ScrollableContainer";
import ModerationList from "../../moderation/components/ModerationList";
import AccountPostList from "./AccountPostList";
import PostService from "../API/PostService";
import {useNavigate} from "react-router-dom";
import MyModal from "../../../components/UI/MyModal/MyModal";
import GlobalSearchInline from "../../search/components/GlobalSearchInline";

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

// Данные получает как props — предзагружены в PostGet при монтировании страницы
const CatalogContent = ({ onSelect, preloadedTags, isPreloading, hasMore }) => {
    const [search, setSearch] = useState('');
    const isSearching = search.trim().length > 0;

    const filteredTags = isSearching
        ? preloadedTags.filter(t => t.name?.toLowerCase().includes(search.toLowerCase()))
        : preloadedTags;

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
                onChange={e => setSearch(e.target.value)}
            />
            <div className="posts-tags-catalog__grid">
                {isPreloading && (
                    <p className="posts-tags-modal__empty">Загрузка...</p>
                )}
                {!isPreloading && grouped.map(([letter, groupTags]) => (
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
                {!isPreloading && filteredTags.length === 0 && isSearching && (
                    <p className="posts-tags-modal__empty">Ничего не найдено по запросу.</p>
                )}
                {hasMore && (
                    <p className="posts-tags-modal__empty" style={{ fontSize: 13, opacity: 0.6 }}>
                        Загружаем остальные теги...
                    </p>
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
    const [totalPages, setTotalPages] = useState(0);
    const [limit] = useState(12);
    const [page, setPage] = useState(1);
    const lastElement = useRef();
    // --- полоска тегов ---
    const [allTags, setAllTags] = useState([]);        // накопленный список всех загруженных тегов
    const [visibleStart, setVisibleStart] = useState(0); // индекс первого видимого тега
    const [tagLoadedPages, setTagLoadedPages] = useState(0); // сколько страниц уже загружено
    const [tagTotalPages, setTagTotalPages] = useState(1);
    const [isTagsLoading, setIsTagsLoading] = useState(false);
    const [tagDirection, setTagDirection] = useState(null); // 'left' | 'right'
    const TAG_STRIP_LIMIT = 6;

    // --- каталог тем ---
    const [isCatalogOpen, setIsCatalogOpen] = useState(false);
    const [catalogTags, setCatalogTags] = useState([]);
    const [catalogLoading, setCatalogLoading] = useState(false);
    const [catalogHasMore, setCatalogHasMore] = useState(false);

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

    // Фоновая подгрузка одной страницы тегов (без spinner-а)
    const preloadTagPage = (pageToLoad) => {
        PostService.getTags(TAG_STRIP_LIMIT, pageToLoad)
            .then(resp => {
                const data = resp.data;
                const list = Array.isArray(data) ? data : (data?.results ?? []);
                if (list.length > 0) {
                    setAllTags(prev => [...prev, ...list]);
                    setTagLoadedPages(prev => prev + 1);
                }
            })
            .catch(e => console.error('Failed to preload tags', e)); // eslint-disable-line no-console
    };

    // Загрузка полоски тегов: 2 страницы при монтировании + сразу фоном грузим 3-ю
    useEffect(() => {
        let cancelled = false;
        const loadInitial = async () => {
            setIsTagsLoading(true);
            try {
                const resp1 = await PostService.getTags(TAG_STRIP_LIMIT, 1);
                if (cancelled) return;
                const data1 = resp1.data;
                const list1 = Array.isArray(data1) ? data1 : (data1?.results ?? []);
                const count = typeof data1?.count === 'number' ? data1.count : list1.length;
                const total = Math.max(1, Math.ceil(count / TAG_STRIP_LIMIT));
                setTagTotalPages(total);

                let combined = [...list1];
                let loaded = 1;
                if (total > 1) {
                    const resp2 = await PostService.getTags(TAG_STRIP_LIMIT, 2);
                    if (cancelled) return;
                    const data2 = resp2.data;
                    const list2 = Array.isArray(data2) ? data2 : (data2?.results ?? []);
                    combined = [...combined, ...list2];
                    loaded = 2;
                }
                if (!cancelled) {
                    setAllTags(combined);
                    setTagLoadedPages(loaded);
                    // Сразу тянем страницу 3 в фоне — к моменту первого клика → она уже будет готова
                    if (loaded < total) preloadTagPage(loaded + 1);
                }
            } catch (e) {
                // eslint-disable-next-line no-console
                console.error('Failed to load tags', e);
            } finally {
                if (!cancelled) setIsTagsLoading(false);
            }
        };
        loadInitial();
        return () => { cancelled = true; };
    }, []);

    // Предзагрузка каталога тегов при монтировании — к открытию модала данные уже готовы
    useEffect(() => {
        let cancelled = false;
        const loadCatalog = async () => {
            setCatalogLoading(true);
            try {
                const PAGE_SIZE = 100;
                const resp1 = await PostService.getTags(PAGE_SIZE, 1);
                if (cancelled) return;
                const data1 = resp1.data;
                const list1 = Array.isArray(data1) ? data1 : (data1?.results ?? []);
                const count = typeof data1?.count === 'number' ? data1.count : list1.length;
                const totalPages = Math.max(1, Math.ceil(count / PAGE_SIZE));
                setCatalogTags(list1);
                setCatalogLoading(false);
                if (totalPages > 1) {
                    setCatalogHasMore(true);
                    let done = 0;
                    const remaining = totalPages - 1;
                    Array.from({ length: remaining }, (_, i) => i + 2).forEach(pageNum => {
                        PostService.getTags(PAGE_SIZE, pageNum)
                            .then(resp => {
                                if (cancelled) return;
                                const d = resp.data;
                                const list = Array.isArray(d) ? d : (d?.results ?? []);
                                setCatalogTags(prev => [...prev, ...list]);
                                done += 1;
                                if (done === remaining) setCatalogHasMore(false);
                            })
                            .catch(() => {
                                done += 1;
                                if (done === remaining) setCatalogHasMore(false);
                            });
                    });
                }
            } catch (e) {
                console.error('Failed to preload catalog', e); // eslint-disable-line no-console
                if (!cancelled) { setCatalogLoading(false); setCatalogHasMore(false); }
            }
        };
        loadCatalog();
        return () => { cancelled = true; };
    }, []);

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

    const visibleTags = allTags.slice(visibleStart, visibleStart + TAG_STRIP_LIMIT);
    const hasPrevTags = visibleStart > 0;
    // → активна, если в allTags есть следующая порция
    const hasNextTags = visibleStart + TAG_STRIP_LIMIT < allTags.length || tagLoadedPages < tagTotalPages;

    const handleNextTags = () => {
        const newStart = visibleStart + TAG_STRIP_LIMIT;
        setVisibleStart(newStart);       // мгновенно — данные уже в allTags
        setTagDirection('left');
        // Пока пользователь смотрит на новую страницу — тихо тянем следующую
        if (tagLoadedPages < tagTotalPages) preloadTagPage(tagLoadedPages + 1);
    };

    const handlePrevTags = () => {
        setVisibleStart(prev => Math.max(0, prev - TAG_STRIP_LIMIT));
        setTagDirection('right');
    };

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
                                <GlobalSearchInline />
                            </div>
                        </div>
                        {(allTags.length > 0 || isTagsLoading) && (
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
                                    disabled={!hasPrevTags}
                                    onClick={handlePrevTags}
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
                                        : visibleTags.map((tag) => (
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
                                    disabled={!hasNextTags}
                                    onClick={handleNextTags}
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
                            posts={posts}
                        />
                    ) : compactList ? (
                        <AccountPostList
                            posts={posts}
                            listPath={listPath}
                        />
                    ) : (
                        <PostList
                            posts={posts}
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
                        preloadedTags={catalogTags}
                        isPreloading={catalogLoading}
                        hasMore={catalogHasMore}
                    />
                )}
            </MyModal>
        </div>
    );
};

export default PostGet;