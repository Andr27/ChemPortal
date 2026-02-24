import React, {useEffect, useState} from 'react';
import {useNavigate, useSearchParams} from "react-router-dom";
import AuthService from "../API/AuthService";
import Myinput from "../components/UI/input/Myinput";
import Mybutton from "../components/UI/button/Mybutton";

const RefreshEmail = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [status, setStatus] = useState("loading");
    const [message, setMessage] = useState(null);
    const [newPassword, setNewPassword] = useState("");
    const [approvePassword, setApprovePassword] = useState("");
    const [loading, setLoading] = useState(false);  // ← добавил

    const NewPassword = async () => {
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
                setTimeout(() => {
                    navigate("/login");
                }, 2000);
            } else {
                setStatus("error");
                setMessage("Не удалось изменить пароль");
            }
        } catch (error) {
            console.error('Ошибка:', error);
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
        <div style={{maxWidth: '400px', margin: '50px auto', padding: '20px'}}>
            <h2>Смена пароля</h2>

            <Myinput
                type="password"  // ← исправил на password
                value={newPassword}
                placeholder="Введите новый пароль"
                onChange={event => setNewPassword(event.target.value)}
                disabled={loading}
                required
            />

            <Myinput
                type="password"  // ← исправил на password
                value={approvePassword}
                placeholder="Подтвердите пароль"
                onChange={event => setApprovePassword(event.target.value)}
                disabled={loading}
                required
            />

            <Mybutton onClick={NewPassword} disabled={loading}>
                {loading ? 'Изменение...' : 'Изменить пароль'}
            </Mybutton>

            {message && (
                <div style={{
                    marginTop: '20px',
                    padding: '10px',
                    borderRadius: '4px',
                    backgroundColor: status === 'success' ? '#d4edda' : '#f8d7da',
                    color: status === 'success' ? '#155724' : '#721c24'
                }}>
                    {message}
                </div>
            )}
        </div>
    );
}

export default RefreshEmail;