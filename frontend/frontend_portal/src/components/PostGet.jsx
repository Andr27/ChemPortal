import React, {useEffect, useRef, useState} from 'react';
import {usePosts} from "../hooks/usePosts";
import {useFetching} from "../hooks/useFetching";
import UserService from "../API/UserService";
import {getPageCount} from "../utils/pages";
import {useObserver} from "../hooks/useObserver";
import PostFilter from "./PostFilter";
import MySelect from "./UI/select/MySelect";
import PostList from "./PostList";
import Loader from "./UI/loader/loader";
import Pagination from "./UI/pagination/pagination";
import ScrollableContainer from "./UI/ScrollableContainer/ScrollableContainer";

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

const PostGet = ({
                     fetchMethod,
                     fetchMethods = [],
                     title = "Посты",
                     combineResults = false,
                     disableScroll = false
                 }) => {
    const [posts, setPosts] = useState([]);
    const [filter, setFilter] = useState({ sort: '', query: '' });
    const [totalPages, setTotalPages] = useState(0);
    const [limit, setLimit] = useState(5);
    const [page, setPage] = useState(1);
    const sortedAndSearchedPost = usePosts(posts, filter.sort, filter.query);
    const lastElement = useRef();

    useEffect(() => {
        setPage(1);
        setPosts([]);
        setTotalPages(0);
    }, [limit]);

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
    }, [page, limit, ]);

    const changePage = (newPage) => {
        setPage(newPage);
    };

    return (
        <div>
            <h2>{title}</h2>

            <PostFilter
                filter={filter}
                setFilter={setFilter}
            />

            <MySelect
                value={limit}
                onChange={setLimit}
                defaultValue='Кол-во элементов на странице'
                options={[
                    { value: 5, name: 5 },
                    { value: 10, name: 10 },
                ]}
            />

            {postError && (
                <h1 style={{ color: 'red', textAlign: 'center' }}>
                    Произошла ошибка: {postError}
                </h1>
            )}

            {posts.length === 0 && !isPostLoading && !postError && (
                <h2 style={{ textAlign: 'center', marginTop: 50 }}>
                    Посты не найдены
                </h2>
            )}
            <div style={{ textAlign: 'center', marginTop: 4 }}>
            <ScrollableContainer isDisable = {disableScroll}>
            <PostList
                posts={sortedAndSearchedPost}
            />

            <div ref={lastElement} style={{ height: 20 }} />

            {isPostLoading && (
                <div style={{ display: "flex", justifyContent: "center", marginTop: 50 }}>
                    <Loader />
                </div>
            )}
            </ScrollableContainer>
            </div>
        </div>
    );
};

export default PostGet;