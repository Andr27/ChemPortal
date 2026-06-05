import React, {useEffect, useRef, useState} from "react";
import './styles/App.css';
import {BrowserRouter, useLocation, useNavigate} from "react-router-dom";
import Navbar from "./components/UI/navbar/navbar";
import AppRouter from "./components/AppRouter";
import {AuthContext, CreatorContext, ExpertContext, ModeratorContext, UserContext} from "./context";
import AuthService from "./features/Login/API/AuthService";
import ScrollTopButton from "./components/UI/ScrollTopButton/ScrollTopButton";
import {ToastProvider, useToast} from "./components/UI/Toast/ToastContext";

// Маршруты, требующие авторизации — с них перебрасываем на /login при истечении сессии
const PROTECTED_PREFIXES = ['/account', '/moderation', '/bookmarks', '/create', '/educations/my-courses'];

// Обработчик события auth-expired внутри Router+ToastProvider:
// показывает тост и редиректит с защищённых страниц на /login.
const AuthExpiredHandler = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const toast = useToast();
    useEffect(() => {
        const onExpired = () => {
            toast.error('Сессия истекла. Войдите снова.');
            const onProtected = PROTECTED_PREFIXES.some(p => location.pathname.startsWith(p));
            if (onProtected) {
                navigate('/login', { state: { from: location.pathname } });
            }
        };
        window.addEventListener('auth-expired', onExpired);
        return () => window.removeEventListener('auth-expired', onExpired);
    }, [navigate, location.pathname, toast]);
    return null;
};

const MAIN_SCROLL_EVENT = 'main-scroll';

const THEME_STORAGE_KEY = "site-theme";
const AVAILABLE_THEMES = ["theme-chem", "theme-nano", "theme-accessible"];
const DEFAULT_THEME = "theme-chem";

function App() {
    const mainContentRef = useRef(null);
    const [isModerator, setIsModerator] = useState(false);
    const [isAuth, setIsAuth] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [user, setUser] = useState(null);
    const [isCreator, setIsCreator] = useState(false);
    const [isExpert, setIsExpert] = useState(false);

    useEffect(() => {
        const loadUser = () => {
            const savedUser = localStorage.getItem('user');
            if (savedUser) {
                try {
                    const parsedUser = JSON.parse(savedUser);
                    setUser(parsedUser);
                } catch (e) {}
            }

            const auth = localStorage.getItem('auth');
            if (auth) setIsAuth(true);

            const role = localStorage.getItem('role');
            if (role) {
                setIsModerator(role === 'admin' || role === 'moderator');

                // эксперт на бэке тоже относится к создателям контента (IsCreator)
                setIsCreator(role === 'creator' || role === 'admin' || role === 'moderator' || role === 'expert');

                setIsExpert(role === 'expert');
            }

            setIsLoading(false);
        };

        loadUser();

        const handleUserUpdate = () => {
            const updatedUser = localStorage.getItem('user');
            if (updatedUser) {
                try {
                    const parsed = JSON.parse(updatedUser);
                    setUser(parsed);
                } catch (e) {}
            }
        };

        window.addEventListener('user-updated', handleUserUpdate);

        const updateFromServer = async () => {
            if (AuthService.getToken()) {
                try {
                    await AuthService.fetchAndSaveUserRole();
                    window.dispatchEvent(new Event('user-updated'));
                } catch (error) {
                }
            }
        };

        updateFromServer();

        return () => {
            window.removeEventListener('user-updated', handleUserUpdate);
        };
    }, []);

    useEffect(() => {
        const applyTheme = (themeName) => {
            const safeTheme = AVAILABLE_THEMES.includes(themeName) ? themeName : DEFAULT_THEME;
            document.body.classList.remove(...AVAILABLE_THEMES);
            document.body.classList.add(safeTheme);
            localStorage.setItem(THEME_STORAGE_KEY, safeTheme);
        };

        const savedTheme = localStorage.getItem(THEME_STORAGE_KEY) || DEFAULT_THEME;
        applyTheme(savedTheme);

        // Allows switching without UI, e.g. from console:
        // window.dispatchEvent(new CustomEvent('site-theme-change', { detail: { theme: 'theme-nano' } }))
        const onThemeChange = (event) => {
            const nextTheme = event?.detail?.theme;
            if (typeof nextTheme === "string") {
                applyTheme(nextTheme);
            }
        };

        window.addEventListener("site-theme-change", onThemeChange);
        return () => window.removeEventListener("site-theme-change", onThemeChange);
    }, []);

    // При истечении сессии — сбрасываем React-состояние,
    // чтобы UI сразу показал "вышедшего" пользователя без перезагрузки страницы.
    useEffect(() => {
        const onAuthExpired = () => {
            setIsAuth(false);
            setIsModerator(false);
            setIsCreator(false);
            setIsExpert(false);
            setUser(null);
        };
        window.addEventListener('auth-expired', onAuthExpired);
        return () => window.removeEventListener('auth-expired', onAuthExpired);
    }, []);

    // Событие скролла из main (на мобильных скролл в layout__content) — для анимации навбара как на ПК
    useEffect(() => {
        const el = mainContentRef.current;
        if (!el) return;
        const handler = () => {
            window.dispatchEvent(new CustomEvent(MAIN_SCROLL_EVENT, { detail: { scrollTop: el.scrollTop } }));
        };
        el.addEventListener('scroll', handler, { passive: true });
        handler();
        return () => el.removeEventListener('scroll', handler);
    }, []);

    return (
        <UserContext.Provider value={{ user, setUser }}>
            <AuthContext.Provider value={{ isAuth, setIsAuth, isLoading }}>
                <ModeratorContext.Provider value={{ isModerator, setIsModerator }}>
                    <CreatorContext.Provider value={{isCreator, setIsCreator}}>
                    <ExpertContext.Provider value={{isExpert, setIsExpert}}>
                    <BrowserRouter>
                        <ToastProvider>
                        <AuthExpiredHandler />
                        <div className="layout">
                            <aside className="layout__sidebar">
                                <Navbar/>
                            </aside>
                            <main ref={mainContentRef} className="layout__content">
                                <AppRouter/>
                                <ScrollTopButton />
                            </main>
                        </div>
                        </ToastProvider>
                    </BrowserRouter>
                    </ExpertContext.Provider>
                    </CreatorContext.Provider>
                </ModeratorContext.Provider>
            </AuthContext.Provider>
        </UserContext.Provider>
    );
}

export default App;