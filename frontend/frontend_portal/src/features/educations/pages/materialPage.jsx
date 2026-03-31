import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { useFetching } from "../../../hooks/useFetching";
import Loader from "../../../components/UI/loader/loader";
import ArticleViewer from "../../../components/UI/MyEditor/ArticleViewer";
import educationService from "../API/EducationService";
import { useUser } from "../../../hooks/useUser";
import {Helmet} from "react-helmet";

const plainTextToDoc = (text) => {
    if (text == null || text === '') return null;
    if (typeof text !== 'string') return text;
    try {
        const parsed = JSON.parse(text);
        if (parsed && typeof parsed === 'object') return parsed;
    } catch (_) {}
    return {
        type: 'doc',
        content: [{ type: 'paragraph', content: [{ type: 'text', text }] }]
    };
};

const getMaterialBackLabel = (fromPath, sectionId) => {
    if (!fromPath) return 'К разделу';
    if (fromPath === '/account') return 'В аккаунт';
    if (fromPath.includes('/materials')) return 'К лекциям';
    return 'К разделу';
};

const MaterialPage = () => {
    const params = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const { user } = useUser();
    const sectionId = params.id;
    const materialId = params.materialId;
    const backPath = location.state?.from || (sectionId ? `/educations/${sectionId}` : '/educations');
    const backLabel = getMaterialBackLabel(backPath, sectionId);
    const [material, setMaterial] = useState({ title: '', content: '', type: 'text' });
    const role = useMemo(() => localStorage.getItem('role') || 'user', []);
    const [fetchMaterial, isLoading, error] = useFetching(async () => {
        const response = await educationService.getMaterialsById(sectionId, materialId);
        setMaterial(response.data);
    });

    useEffect(() => {
        if (sectionId != null && materialId != null) {
            fetchMaterial();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [sectionId, materialId]);

    const contentForViewer = plainTextToDoc(material.content);
    const ownerId = material?.created_by?.id ?? material?.created_by_id ?? material?.author?.id ?? material?.user?.id;
    const canEdit = role === 'admin' || (ownerId != null && user?.id != null && Number(ownerId) === Number(user.id));
    const openEdit = () => navigate(
        `/educations/${sectionId}/materials/${materialId}/edit`,
        { state: { from: location.state?.from || location.pathname } }
    );

    if (isLoading && !material.id) {
        return (
            <div className="page-wrapper section-page-wrapper">
                <div className="education-section-page">
                    {sectionId && (
                        <div className="education-back-link-wrap">
                            <Link className="education-back-link" to={backPath}>
                                <span className="education-back-link__icon" aria-hidden="true">←</span>
                                {backLabel}
                            </Link>
                        </div>
                    )}
                    <div className="education-block__loader">
                        <Loader />
                    </div>
                </div>
            </div>
        );
    }

    if (error && !material.id) {
        return (
            <div className="page-wrapper section-page-wrapper">
                <div className="education-section-page">
                    {sectionId && (
                        <div className="education-back-link-wrap">
                            <Link className="education-back-link" to={backPath}>
                                <span className="education-back-link__icon" aria-hidden="true">←</span>
                                {backLabel}
                            </Link>
                        </div>
                    )}
                    <p className="education-block__error">Ошибка: {String(error)}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="page-wrapper section-page-wrapper">
            <Helmet>
                <title>{material.title || 'Лекция'}</title>
            </Helmet>
            <div className="education-section-page">
                {sectionId && (
                    <div className="education-back-link-wrap">
                        <Link className="education-back-link" to={backPath}>
                            <span className="education-back-link__icon" aria-hidden="true">←</span>
                            {backLabel}
                        </Link>
                    </div>
                )}
                <div className="section-page-card">
                    <div className="section-page-card__strip" aria-hidden="true" />
                    <div className="section-page-card__body">
                        <div className="section-page-card__head">
                            <div className="section-page-card__icon" aria-hidden="true">
                                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                    <polyline points="14 2 14 8 20 8" />
                                    <line x1="16" y1="13" x2="8" y2="13" />
                                    <line x1="16" y1="17" x2="8" y2="17" />
                                    <polyline points="10 9 9 9 8 9" />
                                </svg>
                            </div>
                            <h1 className="section-page-card__title">
                                {material.title || 'Лекция'}
                            </h1>
                        </div>
                        {canEdit && (
                            <div className="section-page-card__actions" style={{ marginTop: 12 }}>
                                <button
                                    type="button"
                                    className="edu-create__save-btn edu-create__save-btn--draft"
                                    onClick={openEdit}
                                >
                                    Редактировать
                                </button>
                            </div>
                        )}
                    </div>
                    <div className="section-page-card__content section-page-card__content--lecture">
                        <div className="post-article-card">
                            <ArticleViewer
                                articleTitle=""
                                articleContent={contentForViewer != null ? contentForViewer : ''}
                                images={[]}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MaterialPage;
