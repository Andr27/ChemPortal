import React from 'react';
import {createPortal} from 'react-dom';
import AccountService from "../API/AccountService";
import MyModal from "../../../components/UI/MyModal/MyModal";

const STATUS_MAP = {
    pending:  { label: 'На рассмотрении', color: '#f59e0b' },
    approved: { label: 'Одобрена',        color: '#22c55e' },
    rejected: { label: 'Отклонена',       color: '#ef4444' },
};

const RequestRole = ({ onSuccess }) => {
    const [loading, setLoading] = React.useState(false);
    const [fetchingApp, setFetchingApp] = React.useState(false);
    const [modal, setModal] = React.useState(false);
    const [success, setSuccess] = React.useState(false);
    const [error, setError] = React.useState('');

    // «Моё заявление»
    const [myApp, setMyApp] = React.useState(null);       // данные заявки
    const [viewMode, setViewMode] = React.useState(false); // просмотр заявки

    const [requestData, setRequestData] = React.useState({
        bio: '',
        affiliation: '',
        scientific_interests: '',
        vk_url: '',
        telegram_url: '',
        website_url: '',
    });

    // Загрузить свою заявку
    const fetchMyApplication = async () => {
        setFetchingApp(true);
        try {
            const response = await AccountService.MyApplication();
            const data = response.data;
            if (data && data.id) {
                setMyApp(data);
                // Заполнить поля из заявки
                setRequestData({
                    bio: data.bio || '',
                    affiliation: data.affiliation || '',
                    scientific_interests: data.scientific_interests || '',
                    vk_url: data.vk_url || '',
                    telegram_url: data.telegram_url || '',
                    website_url: data.website_url || '',
                });
            } else {
                setMyApp(null);
            }
        } catch {
            setMyApp(null);
        } finally {
            setFetchingApp(false);
        }
    };

    const openModal = async () => {
        setModal(true);
        setSuccess(false);
        setError('');
        setViewMode(false);
        await fetchMyApplication();
    };

    const requestRole = async (e) => {
        e.preventDefault();
        setError('');
        try {
            setLoading(true);
            await AccountService.RequestCreatorRole(requestData);
            setSuccess(true);
            onSuccess?.();
            await fetchMyApplication();
        } catch (err) {
            if (err.response?.status === 400) {
                setError('Заявка уже отправлена или данные некорректны');
            } else {
                setError('Ошибка сервера. Попробуйте позже');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setModal(false);
        setSuccess(false);
        setError('');
        setViewMode(false);
    };

    const isPending  = myApp?.status === 'pending';
    const isRejected = myApp?.status === 'rejected';
    const statusInfo = myApp ? STATUS_MAP[myApp.status] || { label: myApp.status, color: '#64748b' } : null;

    // Форма для отправки/повторной отправки
    const renderForm = () => (
        <form onSubmit={requestRole}>
            <h3 className="request-role-modal__title">Заявка на роль автора</h3>
            <p className="request-role-modal__desc">
                Заполните информацию о себе для рассмотрения модератором
            </p>

            <label className="request-role-modal__label">
                <span>Биография <span className="request-role-modal__req">*</span></span>
                <textarea
                    className="request-role-modal__input request-role-modal__textarea"
                    value={requestData.bio}
                    onChange={(e) => setRequestData({...requestData, bio: e.target.value})}
                    placeholder="Расскажите о себе..."
                    disabled={loading || isPending}
                    required
                    rows={3}
                />
            </label>

            <label className="request-role-modal__label">
                <span>Место работы<span className="request-role-modal__req">*</span></span>
                <input
                    className="request-role-modal__input"
                    type="text"
                    value={requestData.affiliation}
                    onChange={(e) => setRequestData({...requestData, affiliation: e.target.value})}
                    placeholder="Университет, компания, должность..."
                    required
                    disabled={loading || isPending}
                />
            </label>

            <label className="request-role-modal__label">
                <span>Научные интересы <span className="request-role-modal__req">*</span></span>
                <input
                    className="request-role-modal__input"
                    type="text"
                    value={requestData.scientific_interests}
                    onChange={(e) => setRequestData({...requestData, scientific_interests: e.target.value})}
                    placeholder="Органическая химия, катализ..."
                    disabled={loading || isPending}
                    required
                />
            </label>

            <div className="request-role-modal__details-body">
                <p className="request-role-modal__desc">Ссылки (необязательно):</p>
                <label className="request-role-modal__label">
                    ВКонтакте
                    <input className="request-role-modal__input" type="url" value={requestData.vk_url}
                        onChange={(e) => setRequestData({...requestData, vk_url: e.target.value})}
                        placeholder="https://vk.com/..." disabled={loading || isPending} />
                </label>
                <label className="request-role-modal__label">
                    Telegram
                    <input className="request-role-modal__input" type="url" value={requestData.telegram_url}
                        onChange={(e) => setRequestData({...requestData, telegram_url: e.target.value})}
                        placeholder="https://t.me/..." disabled={loading || isPending} />
                </label>
                <label className="request-role-modal__label">
                    Сайт
                    <input className="request-role-modal__input" type="url" value={requestData.website_url}
                        onChange={(e) => setRequestData({...requestData, website_url: e.target.value})}
                        placeholder="https://..." disabled={loading || isPending} />
                </label>
            </div>

            {isPending && (
                <div className="request-role-modal__status-banner request-role-modal__status-banner--pending">
                    Заявка ещё на рассмотрении. Отправить повторно нельзя.
                </div>
            )}

            {error && <p className="request-role-modal__error">{error}</p>}

            <div className="request-role-modal__actions">
                <div style={{flex: 1}} />

                <button type="button" className="request-role-modal__btn request-role-modal__btn--ghost"
                    onClick={handleClose} disabled={loading}>
                    Отмена
                </button>
                {myApp && (
                <button type="button" className="request-role-modal__btn request-role-modal__btn--ghost"
                        onClick={() => setViewMode(true)}>
                    Статус
                </button>
            )}
                {!isPending && (
                    <button type="submit" className="request-role-modal__btn request-role-modal__btn--primary"
                        disabled={loading}>
                        {loading ? 'Отправка...' : isRejected ? 'Отправить повторно' : 'Отправить заявку'}
                    </button>
                )}
            </div>
        </form>
    );

    // Просмотр своей заявки
    const renderMyApplication = () => {
        const createdAt = myApp.created_at
            ? new Date(myApp.created_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })
            : '';

        return (
            <div className="request-role-modal__app-view">
                <h3 className="request-role-modal__title">Моё заявление</h3>

                <div className="request-role-modal__status-row">
                    <span className="request-role-modal__status-dot" style={{ background: statusInfo.color }} />
                    <span className="request-role-modal__status-label" style={{ color: statusInfo.color }}>
                        {statusInfo.label}
                    </span>
                    {createdAt && <span className="request-role-modal__status-date">{createdAt}</span>}
                </div>

                {isRejected && myApp.reject_comment && (
                    <div className="request-role-modal__reject-banner">
                        <span className="request-role-modal__reject-title">Причина отклонения:</span>
                        <p className="request-role-modal__reject-text">{myApp.reject_comment}</p>
                    </div>
                )}

                <div className="request-role-modal__app-fields">
                    <div className="request-role-modal__app-field">
                        <span className="request-role-modal__app-field-label">Биография</span>
                        <p className="request-role-modal__app-field-value">{myApp.bio || '—'}</p>
                    </div>
                    {myApp.scientific_interests && (
                        <div className="request-role-modal__app-field">
                            <span className="request-role-modal__app-field-label">Научные интересы</span>
                            <p className="request-role-modal__app-field-value">{myApp.scientific_interests}</p>
                        </div>
                    )}
                    {myApp.affiliation && (
                        <div className="request-role-modal__app-field">
                            <span className="request-role-modal__app-field-label">Место работы</span>
                            <p className="request-role-modal__app-field-value">{myApp.affiliation}</p>
                        </div>
                    )}
                    {(myApp.vk_url || myApp.telegram_url || myApp.website_url) && (
                        <div className="request-role-modal__app-field">
                            <span className="request-role-modal__app-field-label">Ссылки</span>
                            <div className="request-role-modal__app-links">
                                {myApp.vk_url && <a href={myApp.vk_url} target="_blank" rel="noopener noreferrer">ВК</a>}
                                {myApp.telegram_url && <a href={myApp.telegram_url} target="_blank" rel="noopener noreferrer">Telegram</a>}
                                {myApp.website_url && <a href={myApp.website_url} target="_blank" rel="noopener noreferrer">Сайт</a>}
                            </div>
                        </div>
                    )}
                </div>
                <div className="request-role-modal__actions">
                    <button type="button" className="request-role-modal__btn request-role-modal__btn--ghost"
                        onClick={handleClose}>
                        Отмена
                    </button>
                    {isRejected && (
                        <button type="button" className="request-role-modal__btn request-role-modal__btn--primary"
                                onClick={() => setViewMode(false)}>
                            Вернуться назад
                        </button>
                    )}
                </div>
            </div>
        );
    };

    return (
        <>
            <span
                role="button"
                tabIndex={0}
                className="request-role__trigger"
                onClick={openModal}
                onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && openModal()}
            >
                Стать автором
            </span>

            {createPortal(
                <MyModal visible={modal} setVisible={handleClose} width="min(520px, 94vw)">
                    <div className="request-role-modal">
                        {fetchingApp ? (
                            <div style={{ textAlign: 'center', padding: '32px 0' }}>
                                <p className="request-role-modal__desc">Загрузка...</p>
                            </div>
                        ) : success ? (
                            <div className="request-role-modal__success">
                                <div className="request-role-modal__success-icon">&#10003;</div>
                                <h3 className="request-role-modal__title">Заявка отправлена</h3>
                                <p className="request-role-modal__desc">
                                    Модератор рассмотрит вашу заявку в ближайшее время
                                </p>
                                <button type="button"
                                    className="request-role-modal__btn request-role-modal__btn--primary"
                                    onClick={handleClose}>
                                    Закрыть
                                </button>
                            </div>
                        ) : viewMode && myApp ? (
                            renderMyApplication()
                        ) : (
                            renderForm()
                        )}
                    </div>
                </MyModal>,
                document.body
            )}
        </>
    );
};

export default RequestRole;
