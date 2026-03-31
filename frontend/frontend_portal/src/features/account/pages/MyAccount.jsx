import React, { useContext, useEffect, useRef, useState } from 'react';
import InformationBoard from "../../../components/UI/InformationBoard/InformationBoard";
import MyModal from "../../../components/UI/MyModal/MyModal";
import { useUser } from "../../../hooks/useUser";
import Loader from "../../../components/UI/loader/loader";
import PostGet from "../../posts/components/PostGet";
import UserService from "../../../API/UserService";
import { CreatorContext, ModeratorContext } from "../../../context";
import EduAccountPanel from '../component/EduAccountPanel';
import AuthService from "../../Login/API/AuthService";
import api from "../../../API/api";
import {useToast} from "../../../components/UI/Toast/ToastContext";

/** Абсолютный URL для отображения медиа с бэка */
function resolveMediaUrl(path) {
    if (!path || typeof path !== 'string') return null;
    if (path.startsWith('http://') || path.startsWith('https://')) return path;
    try {
        const origin = new URL(api.defaults.baseURL || '').origin;
        const clean = path.startsWith('/') ? path : `/${path}`;
        return `${origin}${clean}`;
    } catch {
        return path;
    }
}

/** Картинка профиля из объекта пользователя (разные варианты полей API) */
function getServerAvatarSrc(user) {
    if (!user) return null;
    const raw =
        user.avatar_url ??
        user.avatar ??
        user.profile_image ??
        user.photo ??
        user.image;
    if (typeof raw === 'object' && raw !== null) {
        const url = raw.url ?? raw.image ?? raw.src;
        return resolveMediaUrl(url);
    }
    return resolveMediaUrl(raw);
}

const MyAccount = () => {
    const { user } = useUser();
    const { isModerator } = useContext(ModeratorContext);
    const { isCreator }   = useContext(CreatorContext);

    const [mode, setMode]           = useState('articles');
    const [articleTab, setArticleTab] = useState('draft');

    const toast = useToast();
    const [editOpen, setEditOpen] = useState(false);
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    /** Только для модалки: выбранный файл ещё не отправлен */
    const [avatarFile, setAvatarFile] = useState(null);
    const [avatarPreviewUrl, setAvatarPreviewUrl] = useState(null);
    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState('');
    const [modalFieldsLoading, setModalFieldsLoading] = useState(false);
    const [avatarUploading, setAvatarUploading] = useState(false);
    const [avatarCardError, setAvatarCardError] = useState('');

    const avatarInputRef = useRef(null);
    const modalAvatarInputRef = useRef(null);

    useEffect(() => {
        return () => {
            if (avatarPreviewUrl) URL.revokeObjectURL(avatarPreviewUrl);
        };
    }, [avatarPreviewUrl]);

    const openEditModal = async () => {
        if (!user) return;
        setSaveError('');
        setAvatarFile(null);
        setAvatarPreviewUrl((prev) => {
            if (prev) URL.revokeObjectURL(prev);
            return null;
        });
        setEditOpen(true);
        setModalFieldsLoading(true);
        try {
            const { data: me } = await api.get('auth/me/');
            setFirstName(me?.first_name ?? '');
            setLastName(me?.last_name ?? '');
            setEmail(me?.email ?? '');
        } catch {
            setFirstName(user.first_name || '');
            setLastName(user.last_name || '');
            setEmail(user.email || '');
        } finally {
            setModalFieldsLoading(false);
        }
    };

    /** С карточки: сразу сохраняем аватар, остальное — актуальное с GET auth/me/ */
    const onCardAvatarSelected = async (e) => {
        const f = e.target.files?.[0];
        e.target.value = '';
        if (!f || !f.type.startsWith('image/')) return;
        setAvatarCardError('');
        setAvatarUploading(true);
        try {
            const { data: me } = await api.get('auth/me/');
            const fd = new FormData();
            fd.append('first_name', me?.first_name ?? '');
            fd.append('last_name', me?.last_name ?? '');
            fd.append('email', me?.email ?? '');
            fd.append('avatar', f);
            await AuthService.changeUserInformation(fd);
            await AuthService.fetchAndSaveUserRole();
            window.dispatchEvent(new Event('user-updated'));
        } catch (err) {
            const d = err?.response?.data;
            const msg =
                (typeof d === 'string' && d) ||
                d?.detail ||
                d?.avatar?.[0] ||
                err?.message ||
                'Не удалось загрузить фото';
            setAvatarCardError(String(msg));
        } finally {
            setAvatarUploading(false);
        }
    };

    /** В модалке: только превью + файл к «Сохранить» */
    const onModalAvatarSelected = (e) => {
        const f = e.target.files?.[0];
        e.target.value = '';
        if (!f || !f.type.startsWith('image/')) return;
        setAvatarPreviewUrl((prev) => {
            if (prev) URL.revokeObjectURL(prev);
            return URL.createObjectURL(f);
        });
        setAvatarFile(f);
    };

    const handleSaveProfile = async () => {
        setSaveError('');
        setSaving(true);
        try {
            if (avatarFile) {
                const fd = new FormData();
                fd.append('first_name', firstName.trim());
                fd.append('last_name', lastName.trim());
                fd.append('email', email.trim());
                fd.append('avatar', avatarFile);
                await AuthService.changeUserInformation(fd);
            } else {
                await AuthService.changeUserInformation({
                    first_name: firstName.trim(),
                    last_name: lastName.trim(),
                    email: email.trim(),
                });
            }
            await AuthService.fetchAndSaveUserRole();
            window.dispatchEvent(new Event('user-updated'));
            setAvatarFile(null);
            setAvatarPreviewUrl((prev) => {
                if (prev) URL.revokeObjectURL(prev);
                return null;
            });
            setEditOpen(false);
            toast.success('Профиль сохранён');
        } catch (err) {
            const d = err?.response?.data;
            const msg =
                (typeof d === 'string' && d) ||
                d?.detail ||
                d?.email?.[0] ||
                d?.non_field_errors?.[0] ||
                err?.message ||
                'Не удалось сохранить';
            setSaveError(String(msg));
        } finally {
            setSaving(false);
        }
    };

    const closeModal = () => {
        setEditOpen(false);
        setSaveError('');
        setAvatarFile(null);
        setAvatarPreviewUrl((prev) => {
            if (prev) URL.revokeObjectURL(prev);
            return null;
        });
    };

    const serverAvatar = user ? getServerAvatarSrc(user) : null;
    const displayAvatarSrc = avatarPreviewUrl || serverAvatar;

    if (!user) {
        return (
            <div className="page-wrapper account-page">
                <div className="account-content">
                    <InformationBoard>
                        <h2>Личные данные</h2>
                        <Loader />
                    </InformationBoard>
                </div>
            </div>
        );
    }

    return (
        <div className="page-wrapper account-page">
            <div className="account-layout">
                <div className="account-content">
                    <InformationBoard>
                        <h2>Личные данные</h2>

                        <div className="account-profile">
                            <div className="account-profile__row">
                                <div className="account-profile__avatar-col">
                                    <button
                                        type="button"
                                        className={`account-profile__avatar-btn${avatarUploading ? ' account-profile__avatar-btn--loading' : ''}`}
                                        onClick={() => !avatarUploading && avatarInputRef.current?.click()}
                                        disabled={avatarUploading}
                                        aria-label={displayAvatarSrc ? 'Сменить фото профиля' : 'Добавить фото профиля'}
                                    >
                                        {displayAvatarSrc ? (
                                            <img
                                                src={displayAvatarSrc}
                                                alt=""
                                                className="account-profile__avatar-img"
                                            />
                                        ) : (
                                            <span className="account-profile__avatar-placeholder">
                                                <span className="account-profile__avatar-plus" aria-hidden="true">+</span>
                                                <span className="account-profile__avatar-hint">Добавить фото</span>
                                            </span>
                                        )}
                                        {avatarUploading && (
                                            <span className="account-profile__avatar-loading">Загрузка…</span>
                                        )}
                                    </button>
                                    <input
                                        ref={avatarInputRef}
                                        type="file"
                                        accept="image/*"
                                        className="account-profile__avatar-input-hidden"
                                        onChange={onCardAvatarSelected}
                                        disabled={avatarUploading}
                                    />
                                    {avatarCardError && (
                                        <p className="account-profile__card-error" role="alert">
                                            {avatarCardError}
                                        </p>
                                    )}
                                </div>

                                <div className="account-profile__info">
                                    <p><strong>Email:</strong> {user.email || 'Не указан'}</p>
                                    <p><strong>Фамилия:</strong> {user.last_name || 'Не указано'}</p>
                                    <p><strong>Имя:</strong> {user.first_name || 'Не указано'}</p>
                                    <p><strong>Уровень:</strong> {user.level ?? '—'}</p>
                                    <p><strong>Роль:</strong> {user.role || 'Пользователь'}</p>
                                </div>
                            </div>
                            <div className="account-profile__edit-row">
                                <button
                                    type="button"
                                    className="account-profile__edit-btn"
                                    onClick={() => void openEditModal()}
                                >
                                    Изменить
                                </button>
                            </div>
                        </div>
                    </InformationBoard>
                </div>

                {(isModerator || isCreator) && (
                    <div className="account-panel">
                        <div className="account-mode-toggle">
                            <button
                                type="button"
                                className={`account-mode-btn${mode === 'articles' ? ' account-mode-btn--active' : ''}`}
                                onClick={() => setMode('articles')}
                            >
                                Статьи
                            </button>
                            <button
                                type="button"
                                className={`account-mode-btn${mode === 'education' ? ' account-mode-btn--active' : ''}`}
                                onClick={() => setMode('education')}
                            >
                                Образовательный раздел
                            </button>
                        </div>

                        {mode === 'articles' && (
                            <>
                                <div className="account-panel__tabs">
                                    <button
                                        type="button"
                                        className={`account-panel__tab${articleTab === 'draft' ? ' account-panel__tab--active' : ''}`}
                                        onClick={() => setArticleTab('draft')}
                                    >
                                        Мои черновики
                                    </button>
                                    <button
                                        type="button"
                                        className={`account-panel__tab${articleTab === 'published' ? ' account-panel__tab--active' : ''}`}
                                        onClick={() => setArticleTab('published')}
                                    >
                                        Мои публикации
                                    </button>
                                </div>

                                <div className="account-panel__content">
                                    {articleTab === 'draft' ? (
                                        <PostGet
                                            key="account-draft"
                                            fetchMethods={[UserService.myDraftPosts, UserService.myRejectedPosts]}
                                            combineResults={true}
                                            title="Мои черновики"
                                            showHeader={false}
                                            disableScroll={false}
                                            scrollMaxHeight="430px"
                                            plainScroll={true}
                                            className="account-posts account-posts--compact"
                                            listPath="/account"
                                            compactList={true}
                                        />
                                    ) : (
                                        <PostGet
                                            key="account-published"
                                            fetchMethod={UserService.myPublishedPost}
                                            title="Мои публикации"
                                            showHeader={false}
                                            disableScroll={false}
                                            scrollMaxHeight="430px"
                                            plainScroll={true}
                                            className="account-posts account-posts--compact"
                                            listPath="/account"
                                            compactList={true}
                                        />
                                    )}
                                </div>
                            </>
                        )}

                        {mode === 'education' && <EduAccountPanel />}
                    </div>
                )}
            </div>

            <MyModal
                visible={editOpen}
                setVisible={(v) => (v == null ? closeModal() : undefined)}
                width="min(440px, 94vw)"
            >
                <div className="account-edit-modal">
                    <h3 className="account-edit-modal__title">Изменить данные</h3>
                    {modalFieldsLoading ? (
                        <div className="account-edit-modal__loader-wrap">
                            <Loader />
                        </div>
                    ) : (
                        <>
                    <label className="account-edit-modal__label">
                        Имя
                        <input
                            type="text"
                            className="account-edit-modal__input"
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            autoComplete="given-name"
                        />
                    </label>
                    <label className="account-edit-modal__label">
                        Фамилия
                        <input
                            type="text"
                            className="account-edit-modal__input"
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                            autoComplete="family-name"
                        />
                    </label>
                    <label className="account-edit-modal__label">
                        Email
                        <input
                            type="email"
                            className="account-edit-modal__input"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            autoComplete="email"
                        />
                    </label>

                    <div className="account-edit-modal__avatar-block">
                        <span className="account-edit-modal__label-text">Аватар</span>
                        <div className="account-edit-modal__avatar-row">
                            <div className="account-edit-modal__thumb-wrap">
                                {displayAvatarSrc ? (
                                    <img src={displayAvatarSrc} alt="" className="account-edit-modal__thumb" />
                                ) : (
                                    <button
                                        type="button"
                                        className="account-edit-modal__thumb-placeholder"
                                        onClick={() => modalAvatarInputRef.current?.click()}
                                    >
                                        +
                                    </button>
                                )}
                            </div>
                            <button
                                type="button"
                                className="account-edit-modal__file-btn"
                                onClick={() => modalAvatarInputRef.current?.click()}
                            >
                                {avatarFile ? 'Выбрать другое фото' : 'Выбрать фото'}
                            </button>
                            <input
                                ref={modalAvatarInputRef}
                                type="file"
                                accept="image/*"
                                className="account-profile__avatar-input-hidden"
                                onChange={onModalAvatarSelected}
                            />
                        </div>
                    </div>
                        </>
                    )}

                    {saveError && (
                        <p className="account-edit-modal__error" role="alert">
                            {saveError}
                        </p>
                    )}

                    <div className="account-edit-modal__actions">
                        <button
                            type="button"
                            className="account-edit-modal__btn account-edit-modal__btn--ghost"
                            onClick={closeModal}
                            disabled={saving || modalFieldsLoading}
                        >
                            Отмена
                        </button>
                        <button
                            type="button"
                            className="account-edit-modal__btn account-edit-modal__btn--primary"
                            onClick={handleSaveProfile}
                            disabled={saving || modalFieldsLoading}
                        >
                            {saving ? 'Сохранение…' : 'Сохранить'}
                        </button>
                    </div>
                </div>
            </MyModal>
        </div>
    );
};

export default MyAccount;
