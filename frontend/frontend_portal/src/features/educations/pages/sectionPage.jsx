import React, { useEffect, useState } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { useFetching } from "../../../hooks/useFetching";
import Loader from "../../../components/UI/loader/loader";
import educationService from "../API/EducationService";
import SectionMaterialsPreview from "../components/materials/sectionMaterialsPreview";
import SectionCoursesPreview from "../components/courses/sectionCoursesPreview";
import EducationBackLink from "../components/EducationBackLink";
import iconCube from "../../../img/icon/cube.svg";
import {Helmet} from "react-helmet";
import GlobalSearchInline from "../../search/components/GlobalSearchInline";

const getSectionBackLabel = (fromPath) => {
    if (!fromPath) return 'К разделам';
    if (fromPath.includes('/categories')) return 'К категории';
    if (fromPath.includes('/educations')) return 'К разделам';
    if (fromPath === '/account') return 'В аккаунт';
    return 'Назад';
};

const SectionPage = () => {
    const params = useParams();
    const location = useLocation();
    const backPath = location.state?.from || '/educations';
    const backLabel = getSectionBackLabel(backPath);
    const [section, setSection] = useState(null);
    const [fetchSection, isLoading, error] = useFetching(async (id) => {
        const response = await educationService.getSectionById(id);
        setSection(response.data);
    });

    useEffect(() => {
        if (params.id != null) {
            fetchSection(params.id);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [params.id]);

    const sectionForChildren = section || (params.id != null ? { id: Number(params.id) } : null);

    if (isLoading && !section) {
        return (
            <div className="App">
                <div className="education-block__loader">
                    <Loader />
                </div>
            </div>
        );
    }

    if (error && !section && !params.id) {
        return (
            <div className="App">
                <p className="education-block__error">Произошла ошибка: {String(error)}</p>
            </div>
        );
    }

    return (
        <div className="App">
            <Helmet>
                <title>{section?.title || 'Раздел'}</title>
            </Helmet>
            <div className="posts-page__header">
                <div className="posts-page__controls-row">
                    <div className="posts-page__filters">
                        <GlobalSearchInline />
                    </div>
                </div>
            </div>
            <div className="posts-page__content">
                <div className="education-section-page">
                    {params.id && (
                        <div className="education-back-link-wrap">
                            <EducationBackLink to={backPath}>{backLabel}</EducationBackLink>
                        </div>
                    )}
                    <div className="section-page-card">
                        <div className="section-page-card__strip" aria-hidden="true" />
                        <div className="section-page-card__body">
                            <div className="section-page-card__head">
                                <div className="section-page-card__icon section-page-card__icon--cube" aria-hidden="true">
                                    <span
                                        className="section-page-card__icon-img"
                                        style={{ maskImage: `url(${iconCube})`, WebkitMaskImage: `url(${iconCube})` }}
                                    />
                                </div>
                                <h1 className="section-page-card__title">
                                    {section?.title ?? 'Раздел'}
                                </h1>
                            </div>
                            {section?.description && (
                                <p className="section-page-card__description">
                                    {section.description}
                                </p>
                            )}
                        </div>

                        {sectionForChildren && (
                            <div className="section-page-card__content">
                                <SectionMaterialsPreview section={sectionForChildren} />
                                <SectionCoursesPreview section={sectionForChildren} />
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SectionPage;
