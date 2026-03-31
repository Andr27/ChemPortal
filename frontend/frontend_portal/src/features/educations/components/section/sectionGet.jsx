import React, {useEffect, useRef, useState} from 'react';
import {useFetching} from "../../../../hooks/useFetching";
import {getPageCount} from "../../../../utils/pages";
import {useObserver} from "../../../../hooks/useObserver";
import ScrollableContainer from "../../../../components/UI/ScrollableContainer/ScrollableContainer";
import SectionFilter from "./sectionFilter";
import educationService from "../../API/EducationService";

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

const SectionGet = ({
                     title = "Разделы",
                     disableScroll = false,
                     scrollMaxHeight = '300px',
                     plainScroll = false,
                     showHeader = true,
                     className = '',
                     preContent = null,  // контент между поиском и списком разделов
                 }) => {
    const [sections, setSections] = useState([]); // eslint-disable-line no-unused-vars
    const [filter, setFilter] = useState({ sort: '', query: '' });
    const [totalPages, setTotalPages] = useState(0);
    const [limit] = useState(12);
    const [page, setPage] = useState(1);
    const lastElement = useRef();

    const [fetchSections, isPostLoading, postError] = useFetching(async (limit, page) => {
        const response = await educationService.getSection(limit, page);
        const data = response.data;
        const responseData = Array.isArray(data) ? data : (data?.results ?? []);
        const totalCount = typeof data?.count === 'number' ? data.count : responseData.length;

        setSections(prev => page === 1 ? responseData : [...(prev || []), ...responseData]);
        setTotalPages(getPageCount(totalCount, limit));
    });

    useObserver(
        lastElement,
        page < totalPages,
        isPostLoading,
        () => setPage(prev => prev + 1)
    );

    useEffect(() => {
        fetchSections(limit, page);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page, limit]);

    return (
        <div className={`posts-page ${className}`.trim()}>
            {postError && (
                <h2 style={{ color: '#b91c1c', textAlign: 'center', marginTop: 24 }}>
                    Произошла ошибка: {String(postError)}
                </h2>
            )}

            <ScrollableContainer isDisable={disableScroll} maxHeight={scrollMaxHeight} plainStyle={plainScroll}>
                {showHeader && (
                    <div className="posts-page__header">
                        <div className="posts-page__controls-row">
                            <div className="posts-page__filters">
                                <SectionFilter
                                    filter={filter}
                                    setFilter={setFilter}
                                />
                            </div>
                        </div>
                    </div>
                )}

                {preContent}
            </ScrollableContainer>
        </div>
    );
};

export default SectionGet;