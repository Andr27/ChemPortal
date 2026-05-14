import React, {useState} from 'react';
import {useNavigate, useSearchParams} from "react-router-dom";
import AuthService from "../API/AuthService";
import {Helmet} from "react-helmet";

const RefreshEmail = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [status, setStatus] = useState(null);
    const [message, setMessage] = useState(null);
    const [newPassword, setNewPassword] = useState("");
    const [approvePassword, setApprovePassword] = useState("");
    const [loading, setLoading] = useState(false);

    const NewPassword = async (e) => {
        e.preventDefault();
        const token = searchParams.get("token");

        if (!token) {
            setStatus("error");
            setMessage("Такой ссылки не существует");
            return;
        }

        if (newPassword !== approvePassword) {
            setMessage("Пароли не совпадают");
            setStatus("error");
            return;
        }

        try {
            setLoading(true);
            const response = await AuthService.refreshPassword(token, newPassword);

            if (response.status === 200) {
                setStatus("success");
                setMessage("Пароль успешно изменён!");
                setTimeout(() => navigate("/login"), 2000);
            } else {
                setStatus("error");
                setMessage("Не удалось изменить пароль");
            }
        } catch (error) {
            setStatus("error");
            if (error.response?.data?.detail) {
                setMessage(error.response.data.detail);
            } else if (error.response?.status === 400) {
                setMessage('Недействительный или просроченный токен');
            } else {
                setMessage('Произошла ошибка при изменении пароля');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="neu-auth-page">
            <Helmet>
                <title>Сброс пароля</title>
            </Helmet>
            <div className="neu-standalone-card">
                <div className="neu-standalone-icon">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#4B70E2" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                </div>
                <h2 className="neu-standalone-title">Смена пароля</h2>
                <p className="neu-standalone-desc">Введите новый пароль для вашего аккаунта</p>

                <form className="neu-standalone-form" onSubmit={NewPassword}>
                    <input
                        className="neu-input"
                        type="password"
                        value={newPassword}
                        placeholder="Новый пароль"
                        onChange={e => setNewPassword(e.target.value)}
                        disabled={loading}
                        required
                        minLength={8}
                    />
                    <input
                        className="neu-input"
                        type="password"
                        value={approvePassword}
                        placeholder="Подтвердите пароль"
                        onChange={e => setApprovePassword(e.target.value)}
                        disabled={loading}
                        required
                        minLength={8}
                    />

                    {message && (
                        <div className={`neu-standalone-alert ${status === 'success' ? 'neu-standalone-alert--success' : 'neu-standalone-alert--error'}`}>
                            {status === 'success' && (
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 6L9 17l-5-5"/></svg>
                            )}
                            {status === 'error' && (
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
                            )}
                            <span>{message}</span>
                        </div>
                    )}

                    <button className="neu-btn" type="submit" disabled={loading}>
                        {loading ? 'Изменение...' : 'Изменить пароль'}
                    </button>
                </form>
            </div>
        </div>
    );
}

export default RefreshEmail;
