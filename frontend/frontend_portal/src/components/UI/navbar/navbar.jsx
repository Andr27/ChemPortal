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
import iconLogin from '../../../img/icon/login.svg';
import UserPanel from '../UserPanel/UserPanel';

const THEME_STORAGE_KEY = "site-theme";
const A11Y_STORAGE_KEY = "site-accessible";
const DEFAULT_THEME = "theme-chem";

const POSTGET_ROUTES = ['/feed', '/posts', '/moderation', '/bookmarks', '/news', '/videos', '/educations'];

const Navbar = () => {
    const {isAuth, setIsAuth} = useContext(AuthContext);
    const {isModerator, setIsModerator} = useContext(ModeratorContext);
    const {isCreator, setIsCreator} = useContext(CreatorContext);
    const {clearUser} = useUser();
    const navigate = useNavigate();
    const location = useLocation();
    const [activeTheme, setActiveTheme] = useState(() => localStorage.getItem(THEME_STORAGE_KEY) || DEFAULT_THEME);
    const [isAccessible, setIsAccessible] = useState(() => localStorage.getItem(A11Y_STORAGE_KEY) === 'true');
    const [prevTheme, setPrevTheme] = useState(() => localStorage.getItem('site-theme-before-a11y') || DEFAULT_THEME);
    const [isScrolled, setIsScrolled] = useState(false);
    const [settingsOpen, setSettingsOpen] = useState(false);
    const settingsRef = useRef(null);

    const hasPostGet = POSTGET_ROUTES.some(route => location.pathname === route) || /^\/educations\/[^/]+\/(materials|courses)$/.test(location.pathname);

    const logout = () => {
        AuthService.logout();
        clearUser();
        setIsAuth(false);
        setIsModerator(false);
        setIsCreator(false);
    };

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

    const handleAccountClick = () => navigate('/account');

    const navbarClassName = cl.navbar;
    const setTheme = (themeName) => {
        setActiveTheme(themeName);
        window.dispatchEvent(new CustomEvent('site-theme-change', { detail: { theme: themeName } }));
    };

    const toggleAccessible = () => {
        if (!isAccessible) {
            const current = activeTheme !== 'theme-accessible' ? activeTheme : prevTheme;
            setPrevTheme(current);
            localStorage.setItem('site-theme-before-a11y', current);
            localStorage.setItem(A11Y_STORAGE_KEY, 'true');
            setIsAccessible(true);
            setTheme('theme-accessible');
        } else {
            localStorage.setItem(A11Y_STORAGE_KEY, 'false');
            setIsAccessible(false);
            setTheme(prevTheme);
        }
    };

    const selectTheme = (themeName) => {
        if (themeName === 'theme-accessible') {
            if (!isAccessible) toggleAccessible();
        } else {
            if (isAccessible) {
                localStorage.setItem(A11Y_STORAGE_KEY, 'false');
                setIsAccessible(false);
            }
            setPrevTheme(themeName);
            localStorage.setItem('site-theme-before-a11y', themeName);
            setTheme(themeName);
        }
        setSettingsOpen(false);
    };

    useEffect(() => {
        if (!settingsOpen) return;
        const handleClickOutside = (e) => {
            if (settingsRef.current && !settingsRef.current.contains(e.target)) {
                setSettingsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [settingsOpen]);

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
                            <UserPanel
                                onLogout={logout}
                                onNavigateAccount={handleAccountClick}
                            />
                        ) : (
                            <MyLink to="/login" className={cl.navbar__navLink}>
                                <span className={cl.navbar__navIcon} style={{ maskImage: `url(${iconLogin})`, WebkitMaskImage: `url(${iconLogin})` }} aria-hidden="true" />
                                <span className={cl.navbar__navText}>Войти</span>
                            </MyLink>
                        )}

                        <div className={cl.navbar__themeSwitch} ref={settingsRef}>
                            <button
                                type="button"
                                className={`${cl.navbar__themeBtn} ${settingsOpen ? cl.navbar__themeBtnActive : ''}`}
                                onClick={() => setSettingsOpen(o => !o)}
                                aria-label="Настройки отображения"
                                title="Настройки отображения"
                            >
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                    <circle cx="12" cy="12" r="3"/>
                                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
                                </svg>
                            </button>

                            {settingsOpen && (
                                <div className={cl.navbar__settingsMenu}>
                                    {[
                                        { key: 'theme-chem',       label: 'Светлая тема' },
                                        { key: 'theme-nano',       label: 'Тёмная тема' },
                                        { key: 'theme-accessible', label: 'Для слабовидящих' },
                                    ].map(({ key, label }) => {
                                        const isActive = isAccessible
                                            ? key === 'theme-accessible'
                                            : activeTheme === key;
                                        return (
                                            <button
                                                key={key}
                                                type="button"
                                                className={`${cl.navbar__settingsItem} ${isActive ? cl.navbar__settingsItemActive : ''}`}
                                                onClick={() => selectTheme(key)}
                                            >
                                                <span className={cl.navbar__settingsItemCheck} aria-hidden="true">
                                                    {isActive ? '✓' : ''}
                                                </span>
                                                {label}
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Navbar;