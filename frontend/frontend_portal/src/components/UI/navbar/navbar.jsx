import React, {useContext, useEffect, useRef, useState} from 'react';
import {AuthContext, CreatorContext, ModeratorContext} from "../../../context";
import AuthService from "../../../features/Login/API/AuthService";
import MyLink from "../MyLink/MyLink";
import {useUser} from "../../../hooks/useUser";
import {Link, useLocation, useNavigate} from "react-router-dom";
import cl from './navbar.module.css';
import Logo from '../../../img/Logo.png';
import iconPosts from '../../../img/icon/posts.svg';
import iconNews from '../../../img/icon/news.svg';
import iconVideo from '../../../img/icon/video.svg';
import iconEducation from '../../../img/icon/education.svg';
import iconMyCourses from '../../../img/icon/myCourses.svg';
import iconModeration from '../../../img/icon/moderation.svg';
import iconBookmarks from '../../../img/icon/bookmarks.svg';
import iconCreate from '../../../img/icon/create.svg';
import iconUser from '../../../img/icon/user.svg';
import iconLogin from '../../../img/icon/login.svg';

const THEME_STORAGE_KEY = "site-theme";
const DEFAULT_THEME = "theme-chem";

const POSTGET_ROUTES = ['/feed', '/posts', '/moderation', '/bookmarks', '/news', '/videos', '/educations'];

const Navbar = () => {
    const {isAuth, setIsAuth} = useContext(AuthContext);
    const {isModerator, setIsModerator} = useContext(ModeratorContext);
    const {isCreator, setIsCreator} = useContext(CreatorContext);
    const {clearUser} = useUser();
    const navigate = useNavigate();
    const location = useLocation();
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const [activeTheme, setActiveTheme] = useState(() => localStorage.getItem(THEME_STORAGE_KEY) || DEFAULT_THEME);
    const [isScrolled, setIsScrolled] = useState(false);
    const userMenuRef = useRef(null);

    const hasPostGet = POSTGET_ROUTES.some(route => location.pathname === route) || /^\/educations\/[^/]+\/(materials|courses)$/.test(location.pathname);

    const logout = () => {
        AuthService.logout();
        clearUser();
        setIsAuth(false);
        setIsModerator(false);
        setIsCreator(false);
        setIsUserMenuOpen(false);
    };

    useEffect(() => {
        const handleOutsideClick = (event) => {
            if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
                setIsUserMenuOpen(false);
            }
        };

        const handleEscape = (event) => {
            if (event.key === 'Escape') {
                setIsUserMenuOpen(false);
            }
        };

        document.addEventListener('mousedown', handleOutsideClick);
        document.addEventListener('keydown', handleEscape);

        return () => {
            document.removeEventListener('mousedown', handleOutsideClick);
            document.removeEventListener('keydown', handleEscape);
        };
    }, []);

    useEffect(() => {
        const syncTheme = (event) => {
            const nextTheme = event?.detail?.theme;
            if (typeof nextTheme === "string") {
                setActiveTheme(nextTheme);
            }
        };

        window.addEventListener('site-theme-change', syncTheme);
        return () => window.removeEventListener('site-theme-change', syncTheme);
    }, []);

    useEffect(() => {
        if (!hasPostGet) {
            setIsScrolled(false);
            return;
        }
        const threshold = 8;
        const updateFromMainScroll = (e) => {
            setIsScrolled((e.detail?.scrollTop ?? 0) > threshold);
        };
        const updateFromWindow = () => {
            setIsScrolled(window.scrollY > threshold);
        };
        window.addEventListener('main-scroll', updateFromMainScroll);
        window.addEventListener('scroll', updateFromWindow);
        updateFromWindow();
        return () => {
            window.removeEventListener('main-scroll', updateFromMainScroll);
            window.removeEventListener('scroll', updateFromWindow);
        };
    }, [hasPostGet]);

    const handleAccountClick = () => {
        setIsUserMenuOpen(false);
        navigate('/account');
    };

    const userMenuItems = [
        {id: 'account', label: 'Личный кабинет', onClick: handleAccountClick},
        {id: 'logout', label: 'Выход', onClick: logout, isDanger: true},
    ];

    const navbarClassName = cl.navbar;
    const setTheme = (themeName) => {
        setActiveTheme(themeName);
        window.dispatchEvent(new CustomEvent('site-theme-change', { detail: { theme: themeName } }));
    };

    return (
        <div className={navbarClassName}>
            <div className={cl.navbar__topSection}>
                <div
                    className={`${cl.navbar__shadowPad} ${hasPostGet && isScrolled ? cl.navbar__shadowPadActive : ''}`}
                    aria-hidden="true"
                />
                <div className={cl.navbar__logoBlock}>
                    <div className={cl.navbar__logoSpace}>
                        <div className={cl.navbar__brand}>
                            <Link to="/posts" className={cl.navbar__brandHomeLink}>
                                <img src={Logo} alt="Логотип портала" className={cl.navbar__brandLogo}/>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
            <div className={`${cl.navbar__bottomSection} ${hasPostGet && isScrolled ? cl.navbar__bottomSectionScrolled : ''}`}>
                <nav className={cl.navbar__bottomLinks} aria-label="Основная навигация">
                    <MyLink to="/posts" className={cl.navbar__navLink}>
                        <span className={cl.navbar__navIcon} style={{ maskImage: `url(${iconPosts})`, WebkitMaskImage: `url(${iconPosts})` }} aria-hidden="true" />
                        <span className={cl.navbar__navText}>Статьи</span>
                    </MyLink>
                    <MyLink to="/news" className={cl.navbar__navLink}>
                        <span className={cl.navbar__navIcon} style={{ maskImage: `url(${iconNews})`, WebkitMaskImage: `url(${iconNews})` }} aria-hidden="true" />
                        <span className={cl.navbar__navText}>Новости</span>
                    </MyLink>
                    <MyLink to="/videos" className={cl.navbar__navLink}>
                        <span className={cl.navbar__navIcon} style={{ maskImage: `url(${iconVideo})`, WebkitMaskImage: `url(${iconVideo})` }} aria-hidden="true" />
                        <span className={cl.navbar__navText}>Видео</span>
                    </MyLink>
                    {isAuth && (
                        <MyLink to="/bookmarks" className={`${cl.navbar__navLink} ${cl.navbar__bookmarksLink}`}>
                            <span className={cl.navbar__navIcon} style={{ maskImage: `url(${iconBookmarks})`, WebkitMaskImage: `url(${iconBookmarks})` }} aria-hidden="true" />
                            <span className={cl.navbar__navText}>Закладки</span>
                        </MyLink>
                    )}
                    <div className={cl.navbar__sectionDivider} aria-hidden="true" />
                    <MyLink to="/educations" end className={cl.navbar__navLink}>
                        <span className={cl.navbar__navIcon} style={{ maskImage: `url(${iconEducation})`, WebkitMaskImage: `url(${iconEducation})` }} aria-hidden="true" />
                        <span className={cl.navbar__navText}>Учебный центр</span>
                    </MyLink>
                    {isAuth && (
                        <MyLink to="/educations/my-courses" className={cl.navbar__navLink}>
                            <span className={cl.navbar__navIcon} style={{ maskImage: `url(${iconMyCourses})`, WebkitMaskImage: `url(${iconMyCourses})` }} aria-hidden="true" />
                            <span className={cl.navbar__navText}>Мои курсы</span>
                        </MyLink>
                    )}
                </nav>

                <div className={cl.navbar__right}>
                    <div className={cl.navbar__rightStack}>
                        {isModerator && (
                            <MyLink to="/moderation" className={cl.navbar__navLink}>
                                <span className={cl.navbar__navIcon} style={{ maskImage: `url(${iconModeration})`, WebkitMaskImage: `url(${iconModeration})` }} aria-hidden="true" />
                                <span className={cl.navbar__navText}>Модерация</span>
                            </MyLink>
                        )}
                        {isCreator && (
                            <MyLink
                                to="/create/post"
                                className={`${cl.navbar__navLink} ${cl.navbar__createLink}`}
                            >
                                <span className={cl.navbar__navIcon} style={{ maskImage: `url(${iconCreate})`, WebkitMaskImage: `url(${iconCreate})` }} aria-hidden="true" />
                                <span className={cl.navbar__navText}>Создать контент</span>
                            </MyLink>
                        )}
                    </div>

                    <div className={cl.navbar__bottomRow}>
                        {isAuth ? (
                            <div className={cl.navbar__userMenuWrapper} ref={userMenuRef}>
                                <button
                                    type="button"
                                    className={cl.navbar__userTrigger}
                                    onClick={() => setIsUserMenuOpen(prev => !prev)}
                                    aria-label="Открыть меню пользователя"
                                    aria-haspopup="menu"
                                    aria-expanded={isUserMenuOpen}
                                >
                                    <span className={cl.navbar__userIcon} style={{ maskImage: `url(${iconUser})`, WebkitMaskImage: `url(${iconUser})` }} aria-hidden="true" />
                                </button>
                                {isUserMenuOpen && (
                                    <div className={cl.navbar__dropdown} role="menu">
                                        {userMenuItems.map((item) => (
                                            <button
                                                key={item.id}
                                                type="button"
                                                className={`${cl.navbar__dropdownItem} ${item.isDanger ? cl.navbar__dropdownItemDanger : ''}`}
                                                onClick={item.onClick}
                                                role="menuitem"
                                            >
                                                {item.label}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <MyLink to="/login" className={cl.navbar__navLink}>
                                <span className={cl.navbar__navIcon} style={{ maskImage: `url(${iconLogin})`, WebkitMaskImage: `url(${iconLogin})` }} aria-hidden="true" />
                                <span className={cl.navbar__navText}>Войти</span>
                            </MyLink>
                        )}

                        <div className={cl.navbar__themeSwitch} aria-label="Переключение темы">
                            <button
                                type="button"
                                onClick={() => setTheme(activeTheme === "theme-chem" ? "theme-nano" : "theme-chem")}
                                className={cl.navbar__themeBtn}
                                aria-label={activeTheme === "theme-chem" ? "Включить тёмную тему" : "Включить светлую тему"}
                                aria-pressed={activeTheme === "theme-nano"}
                            >
                                {activeTheme === "theme-chem" ? (
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                                    </svg>
                                ) : (
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                        <circle cx="12" cy="12" r="5" />
                                        <line x1="12" y1="1" x2="12" y2="3" />
                                        <line x1="12" y1="21" x2="12" y2="23" />
                                        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                                        <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                                        <line x1="1" y1="12" x2="3" y2="12" />
                                        <line x1="21" y1="12" x2="23" y2="12" />
                                        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                                        <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                                    </svg>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Navbar;