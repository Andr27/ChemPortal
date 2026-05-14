import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { useFetching } from "../../../hooks/useFetching";
import Loader from "../../../components/UI/loader/loader";
import MyEditor from "../../../components/UI/MyEditor/MyEditor";
import educationService from "../API/EducationService";
import { useUser } from "../../../hooks/useUser";
import {Helmet} from "react-helmet";

const getMaterialBackLabel = (fromPath) => {
    if (!fromPath) return 'К разделу';
    if (fromPath === '/account') return 'В аккаунт';
    if (fromPath.includes('/materials')) return 'К лекциям';
    return 'К разделу';
};

const parseDoc = (raw) => {
    if (raw == null || raw === '') return null;
    if (typeof raw !== 'string') return raw;
    try {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') return parsed;
    } catch (_) {}
    return {
        type: 'doc',
        content: [{ type: 'paragraph', content: [{ type: 'text', text: raw }] }]
    };
};

const canEditEntity = ({ entity, user, role }) => {
    if (!entity) return false;
    if (role === 'admin') return true;
    const ownerId = entity?.created_by?.id ?? entity?.created_by_id ?? entity?.author?.id ?? entity?.user?.id;
    return ownerId != null && user?.id != null && Number(ownerId) === Number(user.id);
};

const MaterialEditPage = () => {
    const params = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const { user } = useUser();

    const sectionId = params.id;
    const materialId = params.materialId;

    const backPath = location.state?.from || (sectionId ? `/educations/${sectionId}` : '/educations');
    const backLabel = getMaterialBackLabel(location.state?.from);
    const role = useMemo(() => localStorage.getItem('role') || 'user', []);

    const [material, setMaterial] = useState(null);
    const [title, setTitle] = useState('');
    const [type, setType] = useState('text');
    const [content, setContent] = useState(null);
    const nextEditorImageIdRef = useRef(1);
    const [images, setImages] = useState([]);

    const [fetchMaterial, isLoading, error] = useFetching(async () => {
        const response = await educationService.getMaterialsById(sectionId, materialId);
        const data = response.data;
        setMaterial(data);
        setTitle(data?.title ?? '');
        setType(data?.type ?? 'text');
        setContent(parseDoc(data?.content ?? ''));
    });

    useEffect(() => {
        if (sectionId != null && materialId != null) {
            fetchMaterial();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [sectionId, materialId]);

    const allowed = canEditEntity({ entity: material, user, role });

    const [isSaving, setIsSaving] = useState(false);
    const [saveError, setSaveError] = useState('');
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleSave = async () => {
        setSaveError('');
        setSaveSuccess(false);
        if (!title.trim()) {
            setSaveError('Введите название материала');
            return;
        }
        if (!allowed) {
            setSaveError('Недостаточно прав для редактирования');
            return;
        }

        setIsSaving(true);
        try {
            await educationService.changeMaterial(sectionId, {
                id: materialId,
                title,
                type,
                content: content ? JSON.stringify(content) : '',
                order: material?.order ?? 1,
            });
            setSaveSuccess(true);
            setTimeout(() => navigate(backPath), 800);
        } catch (e) {
            setSaveError(e?.response?.data?.detail || JSON.stringify(e?.response?.data) || 'Ошибка при сохранении');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async () => {
        setSaveError('');
        setSaveSuccess(false);
        if (!allowed) {
            setSaveError('Недостаточно прав для удаления');
            return;
        }
        const ok = window.confirm('Удалить материал? Это действие необратимо.');
        if (!ok) return;
        setIsDeleting(true);
        try {
            await educationService.deleteMaterial(sectionId, materialId);
            setTimeout(() => navigate(backPath), 200);
        } catch (e) {
            setSaveError(e?.response?.data?.detail || JSON.stringify(e?.response?.data) || 'Ошибка при удалении');
        } finally {
            setIsDeleting(false);
        }
    };

    if (isLoading && !material) {
        return (
            <div className="page-wrapper section-page-wrapper">
                <div className="education-section-page">
                    <div className="education-block__loader">
                        <Loader />
                    </div>
                </div>
            </div>
        );
    }

    if (error && !material) {
        return (
            <div className="page-wrapper section-page-wrapper">
                <div className="education-section-page">
                    <p className="education-block__error">Ошибка: {String(error)}</p>
                </div>
            </div>
        );
    }

    if (material && !allowed) {
        return (
            <div className="page-wrapper section-page-wrapper">
                <div className="education-section-page">
                    <div className="education-back-link-wrap">
                        <Link className="education-back-link" to={backPath}>
                            <span className="education-back-link__icon" aria-hidden="true">←</span>
                            Назад
                        </Link>
                    </div>
                    <p className="education-block__error">У вас нет прав редактировать этот материал.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="page-wrapper">
            <Helmet>
                <title>{material.title || 'Лекция'}</title>
            </Helmet>
            <div className="education-back-link-wrap">
                <Link className="education-back-link" to={backPath}>
                    <span className="education-back-link__icon" aria-hidden="true">←</span>
                    {backLabel}
                </Link>
            </div>
            <div className="page-card">
                <h1 className="page-title">Редактирование материала</h1>

                <div className="edu-create">
                    <div className="edu-create__lecture">
                        <input
                            className="edu-input edu-input--title"
                            placeholder="Название материала *"
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                        />

                        <label className="edu-label edu-label--required">Содержимое</label>
                        <div className="edu-create__editor-wrap">
                            <MyEditor
                                content={content}
                                onChange={setContent}
                                onAddImage={(file) => {
                                    if (!file?.type?.startsWith('image/')) return null;
                                    const id = nextEditorImageIdRef.current++;
                                    const previewUrl = URL.createObjectURL(file);
                                    setImages(prev => [...prev, { id, file, previewUrl }]);
                                    return id;
                                }}
                                images={images.map(i => ({ id: i.id, image: i.previewUrl }))}
                            />
                        </div>

                        <div className="edu-create__lecture-bottom">
                            <select
                                className="edu-select edu-select--type"
                                value={type}
                                onChange={e => setType(e.target.value)}
                            >
                                <option value="text">Лекция</option>
                                <option value="video">Видео</option>
                            </select>
                        </div>
                    </div>

                    <div className="edu-create__footer">
                        {saveError && <p className="edu-create__error">{saveError}</p>}
                        {saveSuccess && <p className="edu-create__success">Сохранено!</p>}
                        <div
                            className="edu-create__footer-btns"
                            style={{ justifyContent: 'space-between', alignItems: 'flex-end', width: '100%' }}
                        >
                            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                                <button
                                    type="button"
                                    className="edu-create__save-btn"
                                    onClick={handleDelete}
                                    disabled={isSaving || isDeleting}
                                    style={{
                                        background: 'var(--color-danger, #e55)',
                                        color: '#fff',
                                    }}
                                >
                                    {isDeleting ? 'Удаляем...' : 'Удалить материал'}
                                </button>
                            </div>

                            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                                <button
                                    type="button"
                                    className="edu-create__save-btn edu-create__save-btn--moderation"
                                    onClick={handleSave}
                                    disabled={isSaving || isDeleting}
                                >
                                    {isSaving ? 'Сохранение...' : 'Сохранить'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MaterialEditPage;

