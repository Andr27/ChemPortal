import React, { useEffect, useRef, useState, useCallback } from "react";
import { usePosts } from "../hooks/usePosts";
import { useFetching } from "../hooks/useFetching";
import PostService from "../API/PostService";
import { getPageCount } from "../utils/pages";
import PostFilter from "../components/PostFilter";
import Loader from "../components/UI/loader/loader";
import PostList from "../components/PostList";
import Pagination from "../components/UI/pagination/pagination";
import { useObserver } from "../hooks/useObserver";
import MySelect from "../components/UI/select/MySelect";
import ModerationList from "../components/Moderation/ModerationList";

function Moderation() {
    const [posts, setPosts] = useState([]);
    const [filter, setFilter] = useState({ sort: '', query: '' });
    const [totalPages, setTotalPages] = useState(0);
    const [limit, setLimit] = useState(10);
    const [page, setPage] = useState(1);

    const sortedAndSearchedPost = usePosts(posts, filter.sort, filter.query);
    const lastElement = useRef();

    // Сбрасываем страницу при изменении лимита
    useEffect(() => {
        setPage(1);
        setPosts([]);
    }, [limit]);

    const [fetchMPosts, isPostLoading, postError] = useFetching(async (limit, page) => {
        const response = await PostService.getModerationList(limit, page);

        setPosts(prev => page === 1 ? response.data : [...prev, ...response.data]);

        const totalCount = response.headers["x-total-count"];
        setTotalPages(getPageCount(totalCount, limit));
    });


    useObserver(
        lastElement,
        page < totalPages && !isPostLoading,
        isPostLoading,
        () => setPage(prev => prev + 1)
    );


    useEffect(() => {
        fetchMPosts(limit, page);
    }, [page, limit]);

    const deletePost = useCallback((post) => {
        setPosts(prev => prev.filter(p => p.id !== post.id));
    }, []);

    const changePage = useCallback((newPage) => {
        setPage(newPage);
        window.scrollTo({ top: 0, behavior: 'smooth' }); // Скролл вверх при смене страницы
    }, []);

    return (
        <div className="App">
            <hr style={{ margin: "15px 0" }} />

            <PostFilter filter={filter} setFilter={setFilter} />

            <MySelect
                value={limit}
                onChange={setLimit}
                defaultValue='Кол-во элементов на странице'
                options={[
                    { value: 5, name: 5 },
                    { value: 10, name: 10 },
                    { value: 25, name: 25 },
                ]}
            />

            {postError && (
                <h1 style={{ color: 'red', textAlign: 'center' }}>
                    Ошибка: {postError}
                </h1>
            )}

            <ModerationList
                remove={deletePost}
                posts={sortedAndSearchedPost}
                title="Ожидают проверки:"
            />

            <div ref={lastElement} style={{ height: 20 }} />

            {isPostLoading && (
                <div style={{ display: "flex", justifyContent: "center", marginTop: 50 }}>
                    <Loader />
                </div>
            )}

            {totalPages > 1 && (
                <Pagination
                    page={page}
                    changePage={changePage}
                    totalPages={totalPages}
                />
            )}
        </div>
    );
}

export default Moderation;