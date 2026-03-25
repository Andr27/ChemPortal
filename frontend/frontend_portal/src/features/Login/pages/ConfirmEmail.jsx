import React, {useEffect, useState} from 'react';
import {useNavigate, useSearchParams} from "react-router-dom";
import AuthService from "../API/AuthService";

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

                    setTimeout(() => {
                        navigate("/login");
                    }, 2000);
                } else {
                    setStatus("error");
                    setMessage("Не удалось подтвердить email");
                }
            } catch (error) {
                console.error('Ошибка:', error);
                setStatus("error");

                if (error.response?.data?.detail) {
                    setMessage(error.response.data.detail);
                } else if (error.response?.status === 400) {
                    setMessage('Недействительный или просроченный токен');
                } else {
                    setMessage('Произошла ошибка при подтверждении email');
                }

                setTimeout(() => {
                    navigate("/login");
                }, 3000);
            }
        };

        confirmEmail();
    }, [searchParams, navigate]);

    return (
        <div className="auth-page">
            <div className="auth-card" style={{ textAlign: 'center' }}>
                <h1>
                    {status === 'loading' && '⏳ '}
                    {status === 'success' && '✓ '}
                    {status === 'error' && '✗ '}
                    {message}
                </h1>
                {status === 'loading' && <p style={{ color: 'var(--color-text-muted)' }}>Пожалуйста, подождите...</p>}
                {status === 'success' && <p style={{ color: 'var(--color-text-muted)' }}>Сейчас вы будете перенаправлены на страницу входа</p>}
                {status === 'error' && <p style={{ color: 'var(--color-text-muted)' }}>Перенаправление на страницу входа через несколько секунд...</p>}
            </div>
        </div>
    );
};

export default ConfirmEmail;