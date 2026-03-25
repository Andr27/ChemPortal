import React, {useContext, useState, useRef} from 'react';
import {AuthContext, ModeratorContext, CreatorContext} from "../../../context";
import AuthService from "../API/AuthService";
import {useNavigate} from "react-router-dom";

const Login = () => {
    const {setIsAuth} = useContext(AuthContext);
    const {setIsCreator} = useContext(CreatorContext);
    const {setIsModerator} = useContext(ModeratorContext);
    const navigate = useNavigate();

    // Login state
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    // Register state
    const [regData, setRegData] = useState({email: '', password: '', first_name: '', last_name: ''});
    const [regError, setRegError] = useState('');
    const [regLoading, setRegLoading] = useState(false);
    const [regSuccess, setRegSuccess] = useState(false);

    // Forgot password state
    const [fpEmail, setFpEmail] = useState('');
    const [fpLoading, setFpLoading] = useState(false);
    const [fpMessage, setFpMessage] = useState('');
    const [showForgot, setShowForgot] = useState(false);

    // Switch animation
    const [isSignUp, setIsSignUp] = useState(false);
    const [isAnimating, setIsAnimating] = useState(false);
    const switchRef = useRef(null);

    const toggleForm = () => {
        if (isAnimating) return;
        setIsAnimating(true);
        setIsSignUp(prev => !prev);
        setShowForgot(false);
        setError('');
        setRegError('');
        setFpMessage('');
        setTimeout(() => setIsAnimating(false), 1250);
    };

    const login = async (event) => {
        event.preventDefault();
        setError('');
        setLoading(true);
        try {
            const response = await AuthService.login(username, password);
            if (response.access) {
                setIsAuth(true);
                localStorage.setItem("auth", 'true');
                try {
                    await AuthService.fetchAndSaveUserRole();
                    const role = localStorage.getItem('role');
                    if (role === 'moderator' || role === 'admin') setIsModerator(true);
                    if (role === 'creator' || role === 'moderator' || role === 'admin') setIsCreator(true);
                } catch (roleError) {
                    localStorage.setItem('role', 'user');
                }
                navigate('/posts');
            } else {
                setError('Неверный ответ от сервера');
            }
        } catch (err) {
            if (err.response?.status === 401) {
                setError('Неверный логин или пароль');
            } else if (err.response?.data?.detail) {
                setError(err.response.data.detail);
            } else {
                setError('Ошибка сервера. Попробуйте позже');
            }
        } finally {
            setLoading(false);
        }
    };

    const register = async (e) => {
        e.preventDefault();
        setRegError('');
        setRegLoading(true);
        try {
            await AuthService.register(regData.email, regData.password, regData.first_name, regData.last_name);
            setRegSuccess(true);
        } catch (err) {
            if (err.response?.status === 400) {
                setRegError('Пользователь с таким email уже существует');
            } else if (err.response?.status === 422) {
                setRegError('Некорректный email или пароль');
            } else {
                setRegError('Ошибка сервера. Попробуйте позже');
            }
        } finally {
            setRegLoading(false);
        }
    };

    const forgotPassword = async (e) => {
        e.preventDefault();
        setFpLoading(true);
        setFpMessage('');
        try {
            const response = await AuthService.FPassword(fpEmail);
            if (response.status === 200) {
                setFpMessage('✓ Инструкция отправлена на почту');
            }
        } catch (error) {
            if (error.response?.data?.email) {
                setFpMessage(error.response.data.email[0]);
            } else {
                setFpMessage('Ошибка отправки');
            }
        } finally {
            setFpLoading(false);
        }
    };

    return (
        <div className="neu-auth-page">
            <div className={`neu-main ${isSignUp ? 'is-signup' : ''}`}>

                {/* Sign Up Container (left side) */}
                <div className={`neu-container neu-a-container ${isSignUp ? 'is-txl' : ''}`}>
                    {regSuccess ? (
                        <div className="neu-form">
                            <h2 className="neu-title">Проверьте почту</h2>
                            <p className="neu-description">
                                Мы отправили письмо с подтверждением на <strong>{regData.email}</strong>
                            </p>
                            <p className="neu-description">Перейдите по ссылке для активации аккаунта</p>
                            <button className="neu-btn" onClick={() => {setRegSuccess(false); toggleForm();}}>
                                Войти
                            </button>
                        </div>
                    ) : (
                        <form className="neu-form" onSubmit={register}>
                            <h2 className="neu-title">Регистрация</h2>
                            <input
                                className="neu-input"
                                type="text"
                                placeholder="Имя"
                                value={regData.first_name}
                                onChange={e => setRegData({...regData, first_name: e.target.value})}
                                disabled={regLoading}
                                required
                            />
                            <input
                                className="neu-input"
                                type="text"
                                placeholder="Фамилия"
                                value={regData.last_name}
                                onChange={e => setRegData({...regData, last_name: e.target.value})}
                                disabled={regLoading}
                                required
                            />
                            <input
                                className="neu-input"
                                type="email"
                                placeholder="Email"
                                value={regData.email}
                                onChange={e => setRegData({...regData, email: e.target.value})}
                                disabled={regLoading}
                                required
                            />
                            <input
                                className="neu-input"
                                type="password"
                                placeholder="Пароль"
                                value={regData.password}
                                onChange={e => setRegData({...regData, password: e.target.value})}
                                disabled={regLoading}
                                required
                                minLength={8}
                            />
                            {regError && <div className="neu-error">{regError}</div>}
                            <button className="neu-btn" type="submit" disabled={regLoading}>
                                {regLoading ? 'Отправка...' : 'Зарегистрироваться'}
                            </button>
                        </form>
                    )}
                </div>

                {/* Sign In Container (right side) */}
                <div className={`neu-container neu-b-container ${isSignUp ? 'is-txl is-z200' : ''}`}>
                    {showForgot ? (
                        <form className="neu-form" onSubmit={forgotPassword}>
                            <h2 className="neu-title">Восстановление</h2>
                            <p className="neu-description">Введите email для сброса пароля</p>
                            <input
                                className="neu-input"
                                type="email"
                                placeholder="Email"
                                value={fpEmail}
                                onChange={e => setFpEmail(e.target.value)}
                                disabled={fpLoading}
                                required
                            />
                            {fpMessage && (
                                <div className={`neu-message ${fpMessage.startsWith('✓') ? 'neu-message--success' : 'neu-message--error'}`}>
                                    {fpMessage}
                                </div>
                            )}
                            <button className="neu-btn" type="submit" disabled={fpLoading}>
                                {fpLoading ? 'Отправка...' : 'Отправить'}
                            </button>
                            <span className="neu-link" onClick={() => setShowForgot(false)}>
                                Назад к входу
                            </span>
                        </form>
                    ) : (
                        <form className="neu-form" onSubmit={login}>
                            <h2 className="neu-title">Вход</h2>
                            <input
                                className="neu-input"
                                type="text"
                                placeholder="Email"
                                value={username}
                                onChange={e => setUsername(e.target.value)}
                                disabled={loading}
                                required
                            />
                            <input
                                className="neu-input"
                                type="password"
                                placeholder="Пароль"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                disabled={loading}
                                required
                            />
                            {error && <div className="neu-error">{error}</div>}
                            <span className="neu-link" onClick={() => setShowForgot(true)}>
                                Забыли пароль?
                            </span>
                            <button className="neu-btn" type="submit" disabled={loading}>
                                {loading ? 'Вход...' : 'Войти'}
                            </button>
                        </form>
                    )}
                </div>

                {/* Switch Panel */}
                <div
                    ref={switchRef}
                    className={`neu-switch ${isSignUp ? 'is-txr' : ''} ${isAnimating ? 'is-gx' : ''}`}
                >
                    <div className="neu-switch__circle" />
                    <div className="neu-switch__circle neu-switch__circle--t" />

                    {/* Show when on Sign In side -> invite to Sign Up */}
                    <div className={`neu-switch__container ${isSignUp ? 'is-hidden' : ''}`}>
                        <h2 className="neu-title">Привет!</h2>
                        <p className="neu-description">
                            Введите свои данные и начните путешествие вместе с нами
                        </p>
                        <button className="neu-btn neu-switch__btn" onClick={toggleForm}>
                            Войти
                        </button>
                    </div>

                    {/* Show when on Sign Up side -> invite to Sign In */}
                    <div className={`neu-switch__container ${!isSignUp ? 'is-hidden' : ''}`}>
                        <h2 className="neu-title">С возвращением!</h2>
                        <p className="neu-description">
                            Для входа используйте свои данные
                        </p>
                        <button className="neu-btn neu-switch__btn" onClick={toggleForm}>
                            Зарегистрироваться
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
