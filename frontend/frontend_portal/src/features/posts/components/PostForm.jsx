import React, {useEffect, useRef, useState} from 'react';
import Myinput from "../../../components/UI/input/Myinput";
import UserService from "../../../API/UserService";
import PostService from "../API/PostService";
import {useFetching} from "../../../hooks/useFetching";
import MySelect from "../../../components/UI/select/MySelect";
import MyEditor from "../../../components/UI/MyEditor/MyEditor";
import ShadcnImageUploader from "../../../components/UI/ImageUploader/ShadcnImageUploader";
import MyModal from "../../../components/UI/MyModal/MyModal";

const collectEditorImageIds = (node, ids = []) => {
    if (!node || typeof node !== "object") return ids;
    if (node.type === "editorImage") {
        const imageId = Number(node?.attrs?.imageId);
        if (Number.isFinite(imageId)) ids.push(imageId);
    }
    if (Array.isArray(node.content)) {
        node.content.forEach((child) => collectEditorImageIds(child, ids));
    }
    return ids;
};

const remapEditorImageIds = (node, idMap) => {
    if (!node || typeof node !== "object") return node;
    const nextNode = { ...node };
    if (nextNode.type === "editorImage") {
        const currentId = Number(nextNode?.attrs?.imageId);
        const mappedId = idMap.get(currentId);
        nextNode.attrs = {
            ...(nextNode.attrs || {}),
            imageId: Number.isFinite(mappedId) ? mappedId : currentId,
        };
    }
    if (Array.isArray(nextNode.content)) {
        nextNode.content = nextNode.content.map((child) => remapEditorImageIds(child, idMap));
    }
    return nextNode;
};

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
                // eslint-disable-next-line no-constant-condition
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
                // eslint-disable-next-line no-console
                console.error('Failed to load catalog tags for post form', e);
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
                                            className={
                                                `posts-tags-catalog__item${isActive ? ' posts-tags-catalog__item--active' : ''}`
                                            }
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

const PostForm = ({onSuccess}) => {
    const uploadedImagesRef = useRef([]);
    const nextEditorImageIdRef = useRef(1);
    const [post, setPost] = useState({
        title: '',
        body: '',
        type: 'news',
        main_image: null,
        uploaded_images: [],
    });
    const [formError, setFormError] = useState('');
    const [availableTags, setAvailableTags] = useState([]);
    const [selectedTags, setSelectedTags] = useState([]);
    const [isSuggestingTags, setIsSuggestingTags] = useState(false);
    const [isTagCatalogOpen, setIsTagCatalogOpen] = useState(false);

    const [createPost, isLoading, error] = useFetching(async () => {
        const usedImageIds = collectEditorImageIds(post.body, []);
        const uniqueUsedIds = [...new Set(usedImageIds)];
        const usedImageRecords = uniqueUsedIds
            .map((id) => post.uploaded_images.find((item) => item.id === id))
            .filter(Boolean);

        const idMap = new Map();
        usedImageRecords.forEach((item, index) => {
            idMap.set(item.id, index + 1);
        });
        const normalizedBody = remapEditorImageIds(post.body, idMap);

        const tagIds = selectedTags
            .map((tag) => Number(tag.id))
            .filter((id) => Number.isFinite(id));
        const formData = new FormData();
        formData.append('title', post.title);
        formData.append('body', JSON.stringify(normalizedBody));
        formData.append('type', post.type);
        if (tagIds.length > 0) {
            tagIds.forEach((id) => formData.append('tag_ids', id));
        }
        if (post.main_image) {
            formData.append('main_image', post.main_image);
        }
        usedImageRecords.forEach((item) => {
            formData.append('uploaded_images', item.file);
        });

        const createResp = await UserService.createPost(formData);

        if (tagIds.length > 0 && createResp?.data?.id) {
            try {
                await PostService.updatePostTags(createResp.data.id, tagIds);
            } catch (e) {
                // eslint-disable-next-line no-console
                console.error('Failed to update post tags after create', e);
            }
        }

        post.uploaded_images.forEach((item) => {
            if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
        });
        nextEditorImageIdRef.current = 1;
        setPost({title: '', body: '', type: 'news', main_image: null, uploaded_images: []});
        setSelectedTags([]);
        setFormError('');
        if (onSuccess) onSuccess();
    });

    const [sendToModeration, isSendingToModeration, moderationError] = useFetching(async () => {
        const usedImageIds = collectEditorImageIds(post.body, []);
        const uniqueUsedIds = [...new Set(usedImageIds)];
        const usedImageRecords = uniqueUsedIds
            .map((id) => post.uploaded_images.find((item) => item.id === id))
            .filter(Boolean);

        const idMap = new Map();
        usedImageRecords.forEach((item, index) => {
            idMap.set(item.id, index + 1);
        });
        const normalizedBody = remapEditorImageIds(post.body, idMap);

        const tagIds = selectedTags
            .map((tag) => Number(tag.id))
            .filter((id) => Number.isFinite(id));
        const formData = new FormData();
        formData.append('title', post.title);
        formData.append('body', JSON.stringify(normalizedBody));
        formData.append('type', post.type);
        if (tagIds.length > 0) {
            tagIds.forEach((id) => formData.append('tag_ids', id));
        }
        if (post.main_image) {
            formData.append('main_image', post.main_image);
        }
        usedImageRecords.forEach((item) => {
            formData.append('uploaded_images', item.file);
        });

        const createResp = await UserService.CreateAndSentToModeration(formData);

        if (tagIds.length > 0 && createResp?.data?.id) {
            try {
                await PostService.updatePostTags(createResp.data.id, tagIds);
            } catch (e) {
                // eslint-disable-next-line no-console
                console.error('Failed to update post tags after create_and_send_to_moderation', e);
            }
        }

        post.uploaded_images.forEach((item) => {
            if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
        });
        nextEditorImageIdRef.current = 1;
        setPost({title: '', body: '', type: 'news', main_image: null, uploaded_images: []});
        setSelectedTags([]);
        setFormError('');
        if (onSuccess) onSuccess();
    });

    const validateForm = () => {
        if (!post.title.trim() || !post.body) {
            setFormError('Заполните название и текст статьи.');
            return false;
        }
        if (selectedTags.length === 0) {
            setFormError('Выберите хотя бы одну тему.');
            return false;
        }
        setFormError('');
        return true;
    };

    const addNewPost = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;
        await createPost();
    };

    const sendPost = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;
        await sendToModeration();
    };

    const handleEditorChange = (content) => {
        setPost({...post, body: content});
    };

    const handleAddEditorImage = (file) => {
        if (!file || !file.type?.startsWith("image/")) return null;
        const newId = nextEditorImageIdRef.current;
        nextEditorImageIdRef.current += 1;
        const previewUrl = URL.createObjectURL(file);
        setPost((prev) => ({
            ...prev,
            uploaded_images: [...prev.uploaded_images, { id: newId, file, previewUrl }],
        }));
        return newId;
    };


    useEffect(() => {
        uploadedImagesRef.current = post.uploaded_images;
    }, [post.uploaded_images]);

    useEffect(() => {
        return () => {
            uploadedImagesRef.current.forEach((item) => {
                if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
            });
        };
    }, []);

    useEffect(() => {
        let cancelled = false;
        const loadTags = async () => {
            try {
                const resp = await PostService.getTags();
                const data = resp.data;
                const list = Array.isArray(data) ? data : (data?.results ?? []);
                const sorted = [...list].sort(
                    (a, b) => (b.posts_count || 0) - (a.posts_count || 0)
                );
                if (!cancelled) {
                    setAvailableTags(sorted);
                }
            } catch (e) {
                // eslint-disable-next-line no-console
                console.error('Failed to load tags for post form', e);
            }
        };
        loadTags();
        return () => {
            cancelled = true;
        };
    }, []);

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
                        return {
                            id: `auto-${index}-${item}`,
                            name: item,
                        };
                    }
                    if (item.id != null) return item;
                    const fromAvailable = availableTags.find(
                        (t) =>
                            (item.slug && t.slug === item.slug) ||
                            (item.name && t.name === item.name)
                    );
                    if (fromAvailable) return fromAvailable;
                    return {
                        id: item.slug || item.name || `auto-${index}`,
                        name: item.name || item.slug || `Тег ${index + 1}`,
                        slug: item.slug,
                    };
                })
                .filter(Boolean);
            setSelectedTags((prev) => {
                const map = new Map(prev.map((t) => [t.id, t]));
                suggested.forEach((tag) => {
                    if (tag && !map.has(tag.id)) {
                        map.set(tag.id, tag);
                    }
                });
                return Array.from(map.values());
            });
        } catch (e) {
            // eslint-disable-next-line no-console
            console.error('Failed to suggest tags', e);
        } finally {
            setIsSuggestingTags(false);
        }
    };

    return (
        <form onSubmit={addNewPost} className="post-form">
            <Myinput
                value={post.title}
                onChange={(e) => setPost({...post, title: e.target.value})}
                type="text"
                placeholder="Название поста"
                disabled={isLoading || isSendingToModeration}
            />

            <ShadcnImageUploader
                value={post.main_image}
                onChange={(file) => setPost({...post, main_image: file})}
                disabled={isLoading || isSendingToModeration}
            />

            <div className="post-form__editor">
                <MyEditor
                    content={post.body}
                    onChange={handleEditorChange}
                    onAddImage={handleAddEditorImage}
                    images={post.uploaded_images.map((item) => ({
                        id: item.id,
                        image: item.previewUrl,
                    }))}
                />
            </div>

            <div className="post-form__tags">
                <div className="post-form__tags-header">
                    <span className="post-form__tags-label">Темы</span>
                    <div className="post-form__tags-headerButtons">
                        <button
                            type="button"
                            className="post-form__tags-catalogBtn"
                            disabled={isLoading || isSendingToModeration}
                            onClick={() => setIsTagCatalogOpen(true)}
                        >
                            Каталог
                        </button>
                        <button
                            type="button"
                            className="post-form__tags-auto"
                            disabled={isSuggestingTags || isLoading || isSendingToModeration}
                            onClick={handleAutoTags}
                        >
                            {isSuggestingTags ? 'Подбираем…' : 'Авто'}
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
                            <span className="post-form__tag-chip-remove">×</span>
                        </button>
                    ))}
                    {selectedTags.length === 0 && (
                        <span className="post-form__tags-placeholder">
                            Темы не выбраны.
                        </span>
                    )}
                </div>
            </div>

            <div className="post-form__bottom">
                <div className="post-form__select">
                    <MySelect
                        value={post.type}
                        onChange={(value) => setPost({...post, type: value})}
                        defaultValue='Тип материала'
                        options={[
                            { value: 'news', name: 'Новости' },
                            { value: 'article', name: 'Статья' },
                            { value: 'video', name: 'Видео' },
                            { value: 'link', name: 'Ссылка' },
                        ]}
                    />
                </div>

                <div className="post-form__submit">
                    <button
                        type="submit"
                        disabled={isLoading || isSendingToModeration}
                        className="edu-create__save-btn edu-create__save-btn--draft"
                    >
                        {isLoading ? 'Сохранение...' : 'Сохранить черновик'}
                    </button>
                    <button
                        type="button"
                        disabled={isLoading || isSendingToModeration}
                        onClick={sendPost}
                        className="edu-create__save-btn edu-create__save-btn--moderation"
                    >
                        {isSendingToModeration ? 'Отправление...' : 'Отправить на модерацию'}
                    </button>
                </div>
            </div>

            {(formError || error || moderationError) && (
                <div className="auth-form__error post-form__error">
                    {formError || `Ошибка: ${error || moderationError}`}
                </div>
            )}
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
                        onSelect={(tag) => {
                            toggleTag(tag);
                        }}
                    />
                )}
            </MyModal>
        </form>
    );
};

export default PostForm;