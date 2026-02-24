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
        <div style={{
            maxWidth: 500,
            margin: '100px auto',
            padding: 40,
            textAlign: 'center',
            borderRadius: 12,
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
            backgroundColor: status === 'success' ? '#e8f5e9' :
                status === 'error' ? '#ffebee' : '#e3f2fd'
        }}>
            <h2 style={{
                color: status === 'success' ? '#2e7d32' :
                    status === 'error' ? '#c62828' : '#1976d2'
            }}>
                {status === 'loading' && '⏳'}
                {status === 'success' && '✓'}
                {status === 'error' && '✗'} {message}
            </h2>

            {status === 'loading' && (
                <p>Пожалуйста, подождите...</p>
            )}

            {status === 'success' && (
                <p>{message}. Сейчас вы будете перенаправлены на страницу входа</p>
            )}

            {status === 'error' && (
                <p>{message}. Перенаправление на страницу входа через несколько секунд...</p>
            )}
        </div>
    );
};

export default ConfirmEmail;