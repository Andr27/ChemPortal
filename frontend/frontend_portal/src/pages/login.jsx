import React, {useContext, useState} from 'react';
import Myinput from "../components/UI/input/Myinput";
import Mybutton from "../components/UI/button/Mybutton";
import {AuthContext, ModeratorContext, CreatorContext} from "../context"; // Импортируем ModeratorContext
import AuthService from "../API/AuthService";
import MyModal from "../components/UI/MyModal/MyModal";
import Registration from "../components/Registration";
import {useNavigate} from "react-router-dom";
import FPassword from "../components/FPassword"; // Добавляем useNavigate

const Login = () => {
    const {setIsAuth} = useContext(AuthContext);
    const {setIsCreator} = useContext(CreatorContext);
    const {setIsModerator} = useContext(ModeratorContext);
    const navigate = useNavigate();

    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [modal, setModal] = useState(false);
    const [fPassword, setFPassword] = useState(false);


    const login = async (event) => {
        event.preventDefault();
        setError('')
        setLoading(true);

        try {
            const response = await AuthService.login(username, password);

            if (response.access) {
                setIsAuth(true);
                localStorage.setItem("auth", 'true');

                try {
                    const userData = await AuthService.fetchAndSaveUserRole();
                    console.log('User data after login:', userData);

                    const role = localStorage.getItem('role');
                    console.log('User role:', role);


                    if (role === 'moderator' || role === 'admin') {
                        setIsModerator(true);
                    }

                    if (role === 'creator' || role === 'moderator' || role === 'admin') {
                        setIsCreator(true);
                    }
                } catch (roleError) {
                    console.error('Error fetching user role:', roleError);

                    localStorage.setItem('role', 'user');
                }

                navigate('/posts');
            } else {
                setError('Неверный ответ от сервера');
            }

        } catch (err) {
            console.log('Полная ошибка:', err);
            console.log('response.data:', err.response?.data);
            console.log('response.status:', err.response?.status);

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

    return (
        <div>
            <h1>Авторизация на сайте</h1>
            <form onSubmit={login}>
                <Myinput
                    type="text"
                    value={username}
                    placeholder="Введите адрес электронной почты"
                    onChange={event => setUsername(event.target.value)}
                    disabled={loading}
                    required
                />
                <Myinput
                    type="password"
                    value={password}
                    placeholder="Введите пароль"
                    onChange={event => setPassword(event.target.value)}
                    disabled={loading}
                    required
                />
                {error && (
                    <div style={{
                        color: 'red',
                        marginBottom: 15,
                        padding: 10,
                        borderRadius: 5,
                        backgroundColor: '#ffeeee'
                    }}>
                        {error}
                    </div>
                )}
                <div style={{display: 'flex', justifyContent: 'space-between'}}>
                    <Mybutton type="submit" disabled={loading}>
                        {loading ? 'Вход...' : 'Войти'}
                    </Mybutton>
                    <Mybutton
                        type="button"
                        style={{marginLeft: 'auto'}}
                        onClick={() => setModal(true)}
                        disabled={loading}
                    >
                        Регистрация
                    </Mybutton>
                </div>

                <Mybutton
                    type="button"
                    style={{marginLeft: 'auto'}}
                    onClick={() => {setModal(true); setFPassword(true)}}
                    disabled={loading}
                >
                    Забыли пароль?
                </Mybutton>
            </form>
            <MyModal visible={modal} setVisible={() => {
                setModal(false);
                setFPassword(false);
            }}>
                {fPassword ? <FPassword/> : <Registration/>}
            </MyModal>
        </div>
    );
};

export default Login;