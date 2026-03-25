import React, {useState} from 'react';
import {useNavigate, useSearchParams} from "react-router-dom";
import AuthService from "../API/AuthService";
import Myinput from "../../../components/UI/input/Myinput";
import Mybutton from "../../../components/UI/button/Mybutton";

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
        <div className="auth-page">
            <div className="auth-card">
                <h1>Смена пароля</h1>
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
                    <div className={status === 'success' ? '' : 'auth-form__error'} style={status === 'success' ? { marginTop: 16, padding: 12, borderRadius: 12, background: '#ecfdf5', color: '#065f46', border: '1px solid #a7f3d0' } : undefined}>
                        {message}
                    </div>
                )}
            </div>
        </div>
    );
}

export default RefreshEmail;