import React, { useEffect, useState } from 'react';
import { Link, useParams, useLocation, useNavigate } from 'react-router-dom';
import AccountService from "../../account/API/AccountService";
import Loader from "../../../components/UI/loader/loader";
import MyModal from "../../../components/UI/MyModal/MyModal";
import { Helmet } from "react-helmet";
import api from "../../../API/api";

const toAbsoluteUrl = (url) => {
    if (!url || typeof url !== "string") return "";
    if (/^https?:\/\//i.test(url)) return url;
    try { return new URL(url, api?.defaults?.baseURL || "").toString(); } catch { return url; }
};

const RequestRolePage = () => {
    const { id } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const backPath = location.state?.from || '/moderation';

    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [loadingApprove, setLoadingApprove] = useState(false);
    const [loadingReject, setLoadingReject] = useState(false);
    const [error, setError] = useState('');
    const [modToast, setModToast] = useState('');

    const [rejectModalOpen, setRejectModalOpen] = useState(false);
    const [rejectComment, setRejectComment] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const response = await AccountService.RequestDetail(id);
                const result = Array.isArray(response.data) ? response.data[0] : response.data;
                setData(result);
            } catch (err) {
                setError('Не удалось загрузить заявку');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id]);

    const handleApprove = async () => {
        setError('');
        setLoadingApprove(true);
        try {
            await AccountService.RequestApprove({ application_id: Number(id) });
            setModToast('Заявка одобрена!');
            setTimeout(() => navigate('/moderation'), 1200);
        } catch (err) {
            setError(err?.response?.data?.detail || 'Ошибка при одобрении');
        } finally {
            setLoadingApprove(false);
        }
    };

    const openRejectModal = () => {
        setRejectComment('');
        setRejectModalOpen(true);
    };

    const confirmReject = async () => {
        setError('');
        setLoadingReject(true);
        setRejectModalOpen(false);
        try {
            await AccountService.RequestReject({
                application_id: Number(id),
                comment: rejectComment.trim() || undefined,
            });
            setModToast('Заявка отклонена.');
            setTimeout(() => navigate('/moderation'), 1200);
        } catch (err) {
            setError(err?.response?.data?.detail || 'Ошибка при отклонении');
        } finally {
            setLoadingReject(false);
        }
    };

    const user = data?.user || {};
    const fullName = `${user.last_name || ''} ${user.first_name || ''}`.trim() || 'Без имени';
    const avatarSrc = toAbsoluteUrl(user.avatar_url || user.avatar);
    const createdAt = data?.created_at
        ? new Date(data.created_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })
        : '';

    return (
        <div className="page-wrapper section-page-wrapper">
            <Helmet><title>Заявка — {fullName}</title></Helmet>
            <div className="education-section-page">
                <div className="education-back-link-wrap">
                    <Link className="education-back-link" to={backPath}>
                        <span className="education-back-link__icon" aria-hidden="true">←</span>
                        К модерации
                    </Link>
                </div>

                {loading ? (
                    <Loader />
                ) : error && !data ? (
                    <p className="mod-edu-empty">{error}</p>
                ) : (
                    <>
                        {/* Панель модерации */}
                        <div className="mod-bar">
                            <div className="mod-bar__info">
                                <span className="mod-bar__label">Заявка на роль креатора</span>
                            </div>
                            <div className="mod-bar__actions">
                                {error && <span className="mod-bar__error">{error}</span>}
                                <button
                                    className="mod-bar__btn mod-bar__btn--reject"
                                    onClick={openRejectModal}
                                    disabled={loadingApprove || loadingReject}
                                >
                                    {loadingReject ? 'Обрабатываем...' : 'Отклонить'}
                                </button>
                                <button
                                    className="mod-bar__btn mod-bar__btn--approve"
                                    onClick={handleApprove}
                                    disabled={loadingApprove || loadingReject}
                                >
                                    {loadingApprove ? 'Обрабатываем...' : 'Одобрить'}
                                </button>
                            </div>
                        </div>

                        {/* Карточка заявки */}
                        <div className="req-detail">
                            <div className="req-detail__user">
                                <div className="req-detail__avatar">
                                    {avatarSrc
                                        ? <img src={avatarSrc} alt="" className="req-detail__avatar-img" />
                                        : <span className="req-detail__avatar-placeholder">
                                            {(user.first_name?.[0] || '?').toUpperCase()}
                                          </span>
                                    }
                                </div>
                                <div className="req-detail__user-info">
                                    <h2 className="req-detail__name">{fullName}</h2>
                                    <span className="req-detail__email">{user.email}</span>
                                    {createdAt && <span className="req-detail__date">Подана: {createdAt}</span>}
                                </div>
                            </div>

                            <div className="req-detail__fields">
                                <div className="req-detail__field">
                                    <span className="req-detail__field-label">Биография</span>
                                    <p className="req-detail__field-value">{data.bio || '—'}</p>
                                </div>

                                {data.scientific_interests && (
                                    <div className="req-detail__field">
                                        <span className="req-detail__field-label">Научные интересы</span>
                                        <p className="req-detail__field-value">{data.scientific_interests}</p>
                                    </div>
                                )}

                                {data.affiliation && (
                                    <div className="req-detail__field">
                                        <span className="req-detail__field-label">Место работы</span>
                                        <p className="req-detail__field-value">{data.affiliation}</p>
                                    </div>
                                )}

                                {(data.vk_url || data.telegram_url || data.website_url) && (
                                    <div className="req-detail__field">
                                        <span className="req-detail__field-label">Ссылки</span>
                                        <div className="req-detail__links">
                                            {data.vk_url && (
                                                <a href={data.vk_url} target="_blank" rel="noopener noreferrer" className="req-detail__link">
                                                    ВКонтакте
                                                </a>
                                            )}
                                            {data.telegram_url && (
                                                <a href={data.telegram_url} target="_blank" rel="noopener noreferrer" className="req-detail__link">
                                                    Telegram
                                                </a>
                                            )}
                                            {data.website_url && (
                                                <a href={data.website_url} target="_blank" rel="noopener noreferrer" className="req-detail__link">
                                                    Сайт
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {modToast && <div className="mod-bar__toast">{modToast}</div>}
                    </>
                )}
            </div>

            <MyModal visible={rejectModalOpen} setVisible={setRejectModalOpen} width="520px">
                <div className="mod-reject-modal">
                    <h3 className="mod-reject-modal__title">Причина отклонения</h3>
                    <textarea
                        className="mod-reject-modal__textarea"
                        placeholder="Укажите причину отклонения..."
                        value={rejectComment}
                        onChange={(e) => setRejectComment(e.target.value)}
                        rows={4}
                        required
                    />
                    <div className="mod-reject-modal__actions">
                        <button
                            type="button"
                            className="mod-bar__btn mod-bar__btn--cancel"
                            onClick={() => setRejectModalOpen(false)}
                        >
                            Отмена
                        </button>
                        <button
                            type="button"
                            className="mod-bar__btn mod-bar__btn--reject"
                            onClick={confirmReject}
                        >
                            Отклонить
                        </button>
                    </div>
                </div>
            </MyModal>
        </div>
    );
};

export default RequestRolePage;
