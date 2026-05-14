import React from 'react';
import { useNavigate } from 'react-router-dom';
import api from "../../../API/api";

const toAbsoluteUrl = (url) => {
    if (!url || typeof url !== "string") return "";
    if (/^https?:\/\//i.test(url)) return url;
    try { return new URL(url, api?.defaults?.baseURL || "").toString(); } catch { return url; }
};

const RequestRoleItem = ({ request }) => {
    const navigate = useNavigate();
    const user = request.user || {};
    const fullName = `${user.last_name || ''} ${user.first_name || ''}`.trim() || 'Без имени';
    const avatarSrc = toAbsoluteUrl(user.avatar_url || user.avatar);

    const createdAt = request.created_at
        ? new Date(request.created_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' })
        : '';

    const goToDetail = () => navigate(
        `/moderation/requests/${request.id}`,
        { state: { from: '/moderation' } }
    );

    return (
        <div
            className="mcard mcard--link"
            onClick={goToDetail}
            role="button"
            tabIndex={0}
            onKeyDown={e => e.key === 'Enter' && goToDetail()}
        >
            <div className="mcard__accent mcard__accent--request" />

            <div className="mcard__avatar">
                {avatarSrc
                    ? <img src={avatarSrc} alt="" className="mcard__avatar-img" />
                    : <span className="mcard__avatar-placeholder">{(user.first_name?.[0] || '?').toUpperCase()}</span>
                }
            </div>

            <div className="mcard__body">
                <div className="mcard__top">
                    <span className="mcard__badge mcard__badge--request">Заявка</span>
                    <span className="mcard__title">{fullName}</span>
                </div>
                <div className="mcard__meta">
                    <span>{user.email}</span>
                    {request.scientific_interests && <span>{request.scientific_interests}</span>}
                    {createdAt && <span>{createdAt}</span>}
                </div>
                {request.bio && <p className="mcard__desc">{request.bio}</p>}
            </div>

            <div className="mcard__nav">
                <span className="mcard__nav-label">Просмотреть</span>
                <span className="mcard__nav-arrow">→</span>
            </div>
        </div>
    );
};

export default RequestRoleItem;
