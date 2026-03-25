import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useFetching } from "../../../../hooks/useFetching";
import Loader from "../../../../components/UI/loader/loader";
import ScrollableContainer from "../../../../components/UI/ScrollableContainer/ScrollableContainer";
import { useMaterials } from "../../hooks/useMaterials";
import MaterialsList from "./materialsList";
import MaterialsFilter from "./materialsFilter";
import educationService from "../../API/EducationService";
import { getPageCount } from "../../../../utils/pages";
import { useObserver } from "../../../../hooks/useObserver";

const MaterialsGet = ({
    sectionId,
    section = null,
    title = "Лекции",
    disableScroll = false,
    scrollMaxHeight = '300px',
    plainScroll = false,
    showHeader = true,
    showSearch = true,
    backLink = null,
    className = ''
}) => {
    const [materials, setMaterials] = useState([]);
    const [filter, setFilter] = useState({ sort: '', query: '' });
    const [limit] = useState(12);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const lastElement = useRef(null);

    const sortedAndSearchedMaterials = useMaterials(materials, filter.sort, filter.query);
    const sectionForList = section || (sectionId != null ? { id: sectionId } : null);

    const [fetchMaterials, isPostLoading, postError] = useFetching(async (limit, page, id) => {
        const response = await educationService.getSectionMaterials(limit, page, id);
        const data = response.data;
        const responseData = Array.isArray(data) ? data : (data?.results ?? []);
        const totalCount = typeof data?.count === 'number' ? data.count : responseData.length;
        setMaterials(prev => page === 1 ? responseData : [...(prev || []), ...responseData]);
        setTotalPages(getPageCount(totalCount, limit));
    });

    useEffect(() => {
        if (sectionId != null) {
            setMaterials([]);
            setPage(1);
            fetchMaterials(limit, 1, sectionId);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [sectionId]);

    useObserver(
        lastElement,
        page < totalPages,
        isPostLoading,
        () => setPage(prev => prev + 1)
    );

    useEffect(() => {
        if (sectionId != null && page > 1) {
            fetchMaterials(limit, page, sectionId);
        }
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
                            {showSearch && (
                                <div className="posts-page__filters">
                                    <MaterialsFilter
                                        filter={filter}
                                        setFilter={setFilter}
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {backLink && (
                    <div className="education-back-link-wrap">
                        <Link className="education-back-link" to={backLink.to}>
                            <span className="education-back-link__icon" aria-hidden="true">←</span>
                            {backLink.label}
                        </Link>
                    </div>
                )}

                <div className="posts-page__content">
                    {(sortedAndSearchedMaterials?.length ?? 0) === 0 && !isPostLoading && !postError && (
                        <h2 style={{ textAlign: 'center', marginTop: 24, color: '#6b7280' }}>
                            {(materials?.length ?? 0) === 0 ? `${title} не найдены` : 'Ничего не найдено'}
                        </h2>
                    )}

                    {sectionForList && (
                        <MaterialsList
                            section={sectionForList}
                            materials={sortedAndSearchedMaterials ?? []}
                            backPath={sectionId != null ? `/educations/${sectionId}/materials` : undefined}
                        />
                    )}

                    <div ref={lastElement} style={{ height: 20 }} />

                    {isPostLoading && (
                        <div style={{ display: "flex", justifyContent: "center", marginTop: 32 }}>
                            <Loader />
                        </div>
                    )}
                </div>
            </ScrollableContainer>
        </div>
    );
};

export default MaterialsGet;
