import React, {useEffect, useState} from 'react';
import {useNavigate, useSearchParams} from "react-router-dom";
import AuthService from "../API/AuthService";
import {Helmet} from "react-helmet";

const ConfirmEmail = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [status, setStatus] = useState("loading");
    const [message, setMessage] = useState("");

    useEffect(() => {
        const confirmEmail = async () => {
            const token = searchParams.get("token");

            if (!token) {
                setStatus("error");
                setMessage("Такой ссылки не существует");
                return;
            }

            try {
                const response = await AuthService.confirmEmail(token);

                if (response.status === 200) {
                    setStatus("success");
                    setMessage("Email успешно подтверждён!");
                    setTimeout(() => navigate("/login"), 2000);
                } else {
                    setStatus("error");
                    setMessage("Не удалось подтвердить email");
                }
            } catch (error) {
                setStatus("error");
                if (error.response?.data?.detail) {
                    setMessage(error.response.data.detail);
                } else if (error.response?.status === 400) {
                    setMessage('Недействительный или просроченный токен');
                } else {
                    setMessage('Произошла ошибка при подтверждении email');
                }
                setTimeout(() => navigate("/login"), 3000);
            }
        };

        confirmEmail();
    }, [searchParams, navigate]);

    return (
        <div className="neu-auth-page">
            <Helmet>
                <title>Подтверждение почты</title>
            </Helmet>
            <div className="neu-standalone-card">
                {status === 'loading' && (
                    <>
                        <div className="neu-standalone-icon">
                            <div className="neu-spinner" />
                        </div>
                        <h2 className="neu-standalone-title">Подтверждение email</h2>
                        <p className="neu-standalone-desc">Пожалуйста, подождите...</p>
                    </>
                )}

                {status === 'success' && (
                    <>
                        <div className="neu-standalone-icon neu-standalone-icon--success">
                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                                <polyline points="22 4 12 14.01 9 11.01" />
                            </svg>
                        </div>
                        <h2 className="neu-standalone-title">Email подтверждён!</h2>
                        <p className="neu-standalone-desc">Перенаправление на страницу входа...</p>
                    </>
                )}

                {status === 'error' && (
                    <>
                        <div className="neu-standalone-icon neu-standalone-icon--error">
                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10" />
                                <line x1="15" y1="9" x2="9" y2="15" />
                                <line x1="9" y1="9" x2="15" y2="15" />
                            </svg>
                        </div>
                        <h2 className="neu-standalone-title">Ошибка</h2>
                        <p className="neu-standalone-desc">{message}</p>
                        <p className="neu-standalone-hint">Перенаправление на страницу входа...</p>
                    </>
                )}
            </div>
        </div>
    );
};

export default ConfirmEmail;
