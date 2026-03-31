import React, {useEffect, useState} from 'react';
import Myinput from "../../../components/UI/input/Myinput";
import UserService from "../../../API/UserService";
import {useFetching} from "../../../hooks/useFetching";
import MyEditor from "../../../components/UI/MyEditor/MyEditor";
import {useParams} from "react-router-dom";
import PostService from "../API/PostService";
import MyModal from "../../../components/UI/MyModal/MyModal";
import {useToast} from "../../../components/UI/Toast/ToastContext";

const CatalogModalContent = ({ availableTags, selectedTags, onSelect }) => {
    const [search, setSearch] = useState('');
    const [allTags, setAllTags] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        let cancelled = false;
        const loadAll = async () => {
            setIsLoading(true);
            try {
                const PAGE_SIZE = 100;
                let currentPage = 1;
                let acc = [];
                while (true) {
                    const resp = await PostService.getTags(PAGE_SIZE, currentPage);
                    if (cancelled) return;
                    const data = resp.data;
                    const list = Array.isArray(data) ? data : (data?.results ?? []);
                    acc = [...acc, ...list];
                    const count = typeof data?.count === 'number' ? data.count : list.length;
                    if (acc.length >= count || list.length < PAGE_SIZE) break;
                    currentPage += 1;
                }
                if (!cancelled) setAllTags(acc);
            } catch (e) {
                console.error('Failed to load catalog tags', e);
                if (!cancelled) setAllTags(availableTags);
            } finally {
                if (!cancelled) setIsLoading(false);
            }
        };
        loadAll();
        return () => { cancelled = true; };
    }, [availableTags]);

    const base = allTags.length ? allTags : availableTags;
    const trimmed = search.trim();
    const lower = trimmed.toLowerCase();
    const filtered = trimmed
        ? base.filter(t => t?.name?.toLowerCase().includes(lower))
        : base;

    const grouped = Object.entries(
        filtered.reduce((acc, tag) => {
            if (!tag?.name) return acc;
            const letter = (tag.name.trim().charAt(0).toUpperCase() || '#');
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
                                .map((tag) => {
                                    const isActive = selectedTags?.some((t) => t.id === tag.id);
                                    return (
                                        <button
                                            key={tag.id}
                                            type="button"
                                            className={`posts-tags-catalog__item${isActive ? ' posts-tags-catalog__item--active' : ''}`}
                                            onClick={() => onSelect(tag)}
                                        >
                                            {tag.name}
                                        </button>
                                    );
                                })}
                        </div>
                    </div>
                ))}
                {!isLoading && filtered.length === 0 && trimmed && (
                    <p className="posts-tags-modal__empty">Ничего не найдено по запросу.</p>
                )}
            </div>
        </div>
    );
};

const ChangePostForm = ({onSuccess}) => {
    const toast = useToast();
    const params = useParams();
    const [post, setPost] = useState({ body: '', title: '', type: 'news' });
    const [availableTags, setAvailableTags] = useState([]);
    const [selectedTags, setSelectedTags] = useState([]);
    const [isSuggestingTags, setIsSuggestingTags] = useState(false);
    const [isTagCatalogOpen, setIsTagCatalogOpen] = useState(false);

    const [fetchPostsById] = useFetching(async () => {
        const response = await PostService.getAllById(params.id);
        const postData = response.data;
        if (typeof postData.body === 'string') {
            try {
                postData.body = JSON.parse(postData.body);
            } catch (e) {
                console.log('Body is plain text, keeping as is');
            }
        }
        setPost(postData);
        if (Array.isArray(postData.tags)) {
            setSelectedTags(postData.tags);
        }
    });

    useEffect(() => {
        fetchPostsById(params.id);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [params.id]);

    useEffect(() => {
        let cancelled = false;
        const loadTags = async () => {
            try {
                const resp = await PostService.getTags();
                const data = resp.data;
                const list = Array.isArray(data) ? data : (data?.results ?? []);
                if (!cancelled) setAvailableTags(list);
            } catch (e) {
                console.error('Failed to load tags', e);
            }
        };
        loadTags();
        return () => { cancelled = true; };
    }, []);

    const [updatePost, isLoadingCh, errorCh] = useFetching(async () => {
        const tagIds = selectedTags
            .map((tag) => Number(tag.id))
            .filter((id) => Number.isFinite(id));
        await UserService.ChengePost(
            post.id,
            post.title,
            JSON.stringify(post.body),
            post.type,
            tagIds
        );
        toast.success('Изменения сохранены');
        if (onSuccess) onSuccess();
    });

    const ChangeOldPost = async (e) => {
        e.preventDefault();
        if (!post.title.trim() || !post.body) {
            toast.warning('Заполните все поля!');
            return;
        }
        await updatePost();
    };

    const handleEditorChange = (content) => {
        setPost({...post, body: content});
    };

    const toggleTag = (tag) => {
        setSelectedTags((prev) => {
            if (prev.some((t) => t.id === tag.id)) {
                return prev.filter((t) => t.id !== tag.id);
            }
            return [...prev, tag];
        });
    };

    const handleAutoTags = async () => {
        if (!post.title && !post.body) return;
        try {
            setIsSuggestingTags(true);
            const text = `${post.title || ''}\n\n${JSON.stringify(post.body)}`.slice(0, 4000);
            const resp = await PostService.suggestTagsByText(text);
            const data = resp.data;
            const suggestedRaw = Array.isArray(data) ? data : (data?.results ?? data?.tags ?? []);
            const suggested = suggestedRaw
                .map((item, index) => {
                    if (!item) return null;
                    if (typeof item === 'string') {
                        const fromAvailable = availableTags.find(
                            (t) => t.name === item || t.slug === item
                        );
                        if (fromAvailable) return fromAvailable;
                        return { id: `auto-${index}-${item}`, name: item };
                    }
                    if (item.id != null) return item;
                    const fromAvailable = availableTags.find(
                        (t) => (item.slug && t.slug === item.slug) || (item.name && t.name === item.name)
                    );
                    if (fromAvailable) return fromAvailable;
                    return { id: item.slug || item.name || `auto-${index}`, name: item.name || item.slug || `Тег ${index + 1}` };
                })
                .filter(Boolean);
            setSelectedTags((prev) => {
                const map = new Map(prev.map((t) => [t.id, t]));
                suggested.forEach((tag) => {
                    if (tag && !map.has(tag.id)) map.set(tag.id, tag);
                });
                return Array.from(map.values());
            });
        } catch (e) {
            console.error('Failed to suggest tags', e);
        } finally {
            setIsSuggestingTags(false);
        }
    };

    return (
        <form onSubmit={ChangeOldPost} className="post-edit-card">
            <h2 className="post-edit-card__title">Редактирование публикации</h2>

            <div className="post-edit-card__section">
                <label className="post-edit-card__label">Название публикации</label>
                <Myinput
                    value={post.title}
                    onChange={(e) => setPost({...post, title: e.target.value})}
                    type="text"
                    placeholder="Название поста"
                    disabled={isLoadingCh}
                />
            </div>

            <div className="post-edit-card__section">
                <label className="post-edit-card__label">Содержание</label>
                <div className="post-form__editor">
                    <MyEditor
                        content={post.body}
                        onChange={handleEditorChange}
                        images={post.images || []}
                    />
                </div>
            </div>

            <div className="post-edit-card__section">
                <label className="post-edit-card__label">Темы</label>
                <div className="post-form__tags">
                    <div className="post-form__tags-header">
                        <span className="post-form__tags-label">Выбранные темы</span>
                        <div className="post-form__tags-headerButtons">
                            <button
                                type="button"
                                className="post-form__tags-catalogBtn"
                                disabled={isLoadingCh}
                                onClick={() => setIsTagCatalogOpen(true)}
                            >
                                Каталог
                            </button>
                            <button
                                type="button"
                                className="post-form__tags-auto"
                                disabled={isSuggestingTags || isLoadingCh}
                                onClick={handleAutoTags}
                            >
                                {isSuggestingTags ? 'Подбираем...' : 'Авто'}
                            </button>
                        </div>
                    </div>
                    <div className="post-form__tags-selected">
                        {selectedTags.map((tag) => (
                            <button
                                key={tag.id}
                                type="button"
                                className="post-form__tag-chip post-form__tag-chip--selected"
                                onClick={() => toggleTag(tag)}
                            >
                                <span>{tag.name}</span>
                                <span className="post-form__tag-chip-remove">&times;</span>
                            </button>
                        ))}
                        {selectedTags.length === 0 && (
                            <span className="post-form__tags-placeholder">Темы не выбраны.</span>
                        )}
                    </div>
                </div>
            </div>

            {errorCh && (
                <div className="post-form__error">
                    Ошибка: {errorCh}
                </div>
            )}

            <div className="post-edit-card__footer">
                <div className="post-form__select">
                    <select
                        value={post.type || ''}
                        onChange={(e) => setPost({...post, type: e.target.value})}
                        disabled={isLoadingCh}
                    >
                        <option disabled value="">Тип материала</option>
                        <option value="news">Новости</option>
                        <option value="article">Статья</option>
                        <option value="video">Видео</option>
                        <option value="link">Ссылка</option>
                    </select>
                </div>
                <div className="post-form__submit">
                    {onSuccess && (
                        <button
                            type="button"
                            className="edu-create__save-btn edu-create__save-btn--draft"
                            onClick={() => onSuccess()}
                            disabled={isLoadingCh}
                        >
                            Отмена
                        </button>
                    )}
                    <button
                        type="submit"
                        className="edu-create__save-btn edu-create__save-btn--moderation"
                        disabled={isLoadingCh}
                    >
                        {isLoadingCh ? 'Сохранение...' : 'Сохранить изменения'}
                    </button>
                </div>
            </div>

            <MyModal
                visible={isTagCatalogOpen}
                setVisible={setIsTagCatalogOpen}
                width="960px"
                height="80vh"
            >
                {isTagCatalogOpen && (
                    <CatalogModalContent
                        availableTags={availableTags}
                        selectedTags={selectedTags}
                        onSelect={(tag) => toggleTag(tag)}
                    />
                )}
            </MyModal>
        </form>
    );
};

export default ChangePostForm;
