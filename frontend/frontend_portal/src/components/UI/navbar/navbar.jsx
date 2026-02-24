import React, {useContext} from 'react';
import {Link} from "react-router-dom";
import Mybutton from "../button/Mybutton";
import {AuthContext, CreatorContext, ModeratorContext, UserContext} from "../../../context";
import AuthService from "../../../API/AuthService";
import MyLink from "../MyLink/MyLink";
import {useUser} from "../../../hooks/useUser";
import cl from './navbar.module.css'

const Navbar = () => {
    const {isAuth, setIsAuth} = useContext(AuthContext);
    const {isModerator, setIsModerator} = useContext(ModeratorContext);
    const {isCreator, setIsCreator} = useContext(CreatorContext);
    const AuthLogout = AuthService.logout;
    const {user, updateUser, clearUser} = useUser();

    const logout = () => {
        AuthService.logout();
        clearUser();
        setIsAuth(false);
        setIsModerator(false);
        setIsCreator(false);

    }
    return (
        <div className={cl.navbar}>
            {isAuth
                ?   <div><strong>Здравствуйте {!user ? '...' : user.first_name || 'Пользователь' }!</strong>
                    <MyLink to='/account' style={{margin: 5}}>Личный кабинет</MyLink>
                    <MyLink to='/bookmarks' style={{margin: 5}}>Закладки</MyLink>
                    <Mybutton onClick={logout}>
                        Выйти
                    </Mybutton>
                </div>
                : null
            }
                <div style={{marginLeft: 150}}>
                     {isCreator
                         ? <MyLink to="/create/post" style={{}}>Создать статью</MyLink>
                         : null
                     }
                </div>
            <div className={cl.navbar__links}>
                {isModerator
                    ? <MyLink to="/moderation" style={{marginRight: 5}}>Модерация</MyLink>
                    : null
                }
                <MyLink  to="/about" style={{marginRight: 5}}>О проекте</MyLink>
                <MyLink to="/posts">Статьи и новости</MyLink>
            </div>
        </div>
    );
};

export default Navbar;