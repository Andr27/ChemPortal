import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import EducationService from '../../API/EducationService';
import SectionItem from './sectionItem';
import Loader from '../../../../components/UI/loader/loader';
import MyModal from '../../../../components/UI/MyModal/MyModal';

const PREVIEW_CATEGORIES = 3;
const PREVIEW_SECTIONS = 9;

// --- Модалка всех категорий ---
const CategoriesModal = ({ categories, onSelect }) => {
    const [search, setSearch] = useState('');
    const filtered = search.trim()
        ? categories.filter(c => c.name.toLowerCase().includes(search.toLowerCase()))
        : categories;

    return (
        <div className="posts-tags-catalog">
            <h3 className="posts-tags-catalog__title">Все категории</h3>
            <input
                type="text"
                className="posts-tags-catalog__search"
                placeholder="Поиск по категориям..."
                value={search}
                onChange={e => setSearch(e.target.value)}
            />
            <div className="posts-tags-catalog__grid categories-modal__grid">
                {filtered.length === 0 ? (
                    <p className="posts-tags-modal__empty">Ничего не найдено.</p>
                ) : (
                    filtered.map(cat => (
                        <button
                            key={cat.id}
                            type="button"
                            className="posts-tags-catalog__item categories-modal__item"
                            onClick={() => onSelect(cat)}
                        >
                            <span className="categories-modal__item-name">{cat.name}</span>
                            {cat.sections_count > 0 && (
                                <span className="categories-block__category-count">{cat.sections_count}</span>
                            )}
                        </button>
                    ))
                )}
            </div>
        </div>
    );
};

const CategoriesBlock = () => {
    const navigate = useNavigate();
    const [categories, setCategories] = useState([]);
    const [sectionsByCategory, setSectionsByCategory] = useState({});
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        let cancelled = false;
        const load = async () => {
            setIsLoading(true);
            try {
                const resp = await EducationService.getCategories();
                const list = Array.isArray(resp.data) ? resp.data : (resp.data?.results ?? []);
                if (cancelled) return;
                setCategories(list);

                const preview = list.slice(0, PREVIEW_CATEGORIES);
                const results = await Promise.all(
                    preview.map(cat =>
                        EducationService.getCategorySections(cat.slug)
                            .then(r => {
                                const data = r.data;
                                const sections = Array.isArray(data) ? data : (data?.results ?? []);
                                console.log(`[CategoriesBlock] "${cat.name}" (${cat.slug}):`, sections); // eslint-disable-line no-console
                                return { slug: cat.slug, sections };
                            })
                            .catch(e => {
                                console.error(`[CategoriesBlock] Ошибка загрузки разделов для "${cat.name}":`, e?.response?.status, e?.response?.data ?? e.message); // eslint-disable-line no-console
                                return { slug: cat.slug, sections: [] };
                            })
                    )
                );
                if (cancelled) return;
                const map = {};
                results.forEach(({ slug, sections }) => { map[slug] = sections; });
                setSectionsByCategory(map);
            } catch (e) {
                console.error('Failed to load categories', e); // eslint-disable-line no-console
            } finally {
                if (!cancelled) setIsLoading(false);
            }
        };
        load();
        return () => { cancelled = true; };
    }, []);

    if (isLoading) {
        return <div style={{ display: 'flex', justifyContent: 'center', padding: '32px 0' }}><Loader /></div>;
    }

    if (categories.length === 0) return null;

    const previewCategories = categories.slice(0, PREVIEW_CATEGORIES);

    const AllCategoriesBtn = () => (
        <div className="categories-block__all-wrap">
            <button
                type="button"
                className="categories-block__all-btn"
                onClick={() => setIsModalOpen(true)}
            >
                Все категории
            </button>
        </div>
    );

    return (
        <div className="categories-block">
            <AllCategoriesBtn />

            {previewCategories.map(cat => {
                const sections = (sectionsByCategory[cat.slug] || []).slice(0, PREVIEW_SECTIONS);
                return (
                    <section key={cat.id} className="education-block categories-block__category">
                        <div className="education-block__header">
                            <Link
                                to={`/educations/categories/${cat.slug}`}
                                className="education-block__title categories-block__category-title"
                            >
                                {cat.name}
                                {cat.sections_count > 0 && (
                                    <span className="categories-block__category-count">
                                        {cat.sections_count}
                                    </span>
                                )}
                            </Link>
                            <Link
                                to={`/educations/categories/${cat.slug}`}
                                className="education-block__link"
                            >
                                Посмотреть всё
                            </Link>
                        </div>
                        {sections.length === 0 ? (
                            <p className="education-block__empty">Разделов пока нет</p>
                        ) : (
                            <div className="education-preview-grid categories-block__grid">
                                {sections.map((section, idx) => (
                                    <SectionItem key={section.id || idx} section={section} />
                                ))}
                            </div>
                        )}
                    </section>
                );
            })}

            <AllCategoriesBtn />

            <MyModal
                visible={isModalOpen}
                setVisible={setIsModalOpen}
                width="600px"
                height="70vh"
            >
                {isModalOpen && (
                    <CategoriesModal
                        categories={categories}
                        onSelect={cat => {
                            setIsModalOpen(false);
                            navigate(`/educations/categories/${cat.slug}`);
                        }}
                    />
                )}
            </MyModal>
        </div>
    );
};

export default CategoriesBlock;
