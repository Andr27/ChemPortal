import React, { useState } from 'react';
import Myinput from "../../../components/UI/input/Myinput";
import Mybutton from "../../../components/UI/button/Mybutton";
import AuthService from "../API/AuthService";

const Registration = () => {
    const [userRegister, setUserRegister] = useState({
        password: '',
        email: '',
        first_name: '',
        last_name: ''
    });

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false); // для подтверждения email

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {

          const response = await AuthService.register(userRegister.email, userRegister.password, userRegister.first_name, userRegister.last_name);

            console.log('Ответ сервера:', response);

            setSuccess(true);

        } catch (err) {
            console.error('Ошибка регистрации:', err);

            if (err.response?.status === 400) {
                setError('Пользователь с таким email уже существует');
            } else if (err.response?.status === 422) {
                setError('Некорректный email или пароль');
            } else {
                setError('Ошибка сервера. Попробуйте позже');
            }
        } finally {
            setIsLoading(false);
        }
    };

    if (success) {
        return (
            <div style={{ textAlign: 'center', padding: '20px' }}>
                <h2>Подтвердите email</h2>
                <p>Мы отправили письмо с подтверждением на <strong>{userRegister.username}</strong></p>
                <p>Пожалуйста, проверьте вашу почту и перейдите по ссылке для активации аккаунта.</p>
                <Mybutton onClick={() => setSuccess(false)}>
                    Назад к регистрации
                </Mybutton>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} style={{ maxWidth: '400px', margin: '0 auto' }}>
            <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>Регистрация</h2>

            <Myinput
                value={userRegister.email}
                onChange={(e) => setUserRegister({...userRegister, email: e.target.value})}
                type="email"
                placeholder="Введите email"
                disabled={isLoading}
                required
            />
            <Myinput
                value={userRegister.first_name}
                onChange={(e) => setUserRegister({...userRegister, first_name: e.target.value})}
                type="first_name"
                placeholder="Введите имя"
                disabled={isLoading}
                required
            />
            <Myinput
                value={userRegister.last_name}
                onChange={(e) => setUserRegister({...userRegister, last_name: e.target.value})}
                type="last_name"
                placeholder="Введите фамилию"
                disabled={isLoading}
                required
            />

            <Myinput
                value={userRegister.password}
                onChange={(e) => setUserRegister({...userRegister, password: e.target.value})}
                type="password"
                placeholder="Введите пароль"
                disabled={isLoading}
                required
                minLength={8}
            />

            {error && (
                <div style={{
                    color: 'red',
                    marginTop: '10px',
                    padding: '10px',
                    backgroundColor: '#ffeeee',
                    borderRadius: '5px'
                }}>
                    Ошибка: {error}
                </div>
            )}

            <Mybutton
                type="submit"
                disabled={isLoading}
                style={{ width: '100%', marginTop: '20px' }}
            >
                {isLoading ? 'Отправка...' : 'Зарегистрироваться'}
            </Mybutton>

            <p style={{ textAlign: 'center', marginTop: '15px', color: '#666' }}>
                После регистрации вам придёт письмо с подтверждением
            </p>
        </form>
    );
};

export default Registration;