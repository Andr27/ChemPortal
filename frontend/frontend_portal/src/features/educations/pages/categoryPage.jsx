import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import EducationService from '../API/EducationService';
import SectionItem from '../components/section/sectionItem';
import Loader from '../../../components/UI/loader/loader';
import {Helmet} from "react-helmet";
import GlobalSearchInline from '../../search/components/GlobalSearchInline';

const CategoryPage = () => {
    const { slug } = useParams();
    const [category, setCategory] = useState(null);
    const [sections, setSections] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        let cancelled = false;
        const load = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const [catResp, secResp] = await Promise.all([
                    EducationService.getCategoryBySlug(slug),
                    EducationService.getCategorySections(slug),
                ]);
                if (cancelled) return;
                setCategory(catResp.data);
                setSections(Array.isArray(secResp.data) ? secResp.data : (secResp.data?.results ?? []));
            } catch (e) {
                if (!cancelled) setError('Не удалось загрузить категорию');
            } finally {
                if (!cancelled) setIsLoading(false);
            }
        };
        load();
        return () => { cancelled = true; };
    }, [slug]);

    if (isLoading) {
        return (
            <div className="App">
                <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }}>
                    <Loader />
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="App">
                <p style={{ color: '#b91c1c', textAlign: 'center', marginTop: 24 }}>{error}</p>
            </div>
        );
    }

    return (
        <div className="App">
            <Helmet>
                <title>{category?.name || 'Категория'}</title>
            </Helmet>
            <div className="posts-page__header">
                <div className="posts-page__controls-row">
                    <div className="posts-page__filters">
                        <GlobalSearchInline />
                    </div>
                </div>
            </div>
            <div className="posts-page__content">
                <div className="education-back-link-wrap">
                    <Link className="education-back-link" to="/educations">
                        <span className="education-back-link__icon" aria-hidden="true">←</span>
                        К разделам
                    </Link>
                </div>

                <div className="category-page__header">
                    <h1 className="category-page__title">{category?.name}</h1>
                    {category?.description && (
                        <p className="category-page__description">{category.description}</p>
                    )}
                    <div className="category-page__meta">
                        <span className="category-page__meta-item">
                            Разделов: <strong>{category?.sections_count ?? sections.length}</strong>
                        </span>
                        <span className="category-page__meta-item">
                            Курсов: <strong>{category?.courses_count ?? 0}</strong>
                        </span>
                    </div>
                </div>

                {sections.length === 0 ? (
                    <p style={{ textAlign: 'center', color: '#6b7280', marginTop: 32 }}>
                        В этой категории пока нет разделов
                    </p>
                ) : (
                    <div className="posts-grid category-page__grid">
                        {sections.map((section, idx) => (
                            <SectionItem key={section.id || idx} section={section} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default CategoryPage;
