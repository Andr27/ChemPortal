import React, {useEffect, useState} from "react";
import './styles/App.css';
import {BrowserRouter} from "react-router-dom";
import Navbar from "./components/UI/navbar/navbar";
import AppRouter from "./components/AppRouter";
import {AuthContext, CreatorContext, ModeratorContext, UserContext} from "./context";
import AuthService from "./API/AuthService";

function App() {
    const [isModerator, setIsModerator] = useState(false);
    const [isAuth, setIsAuth] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [user, setUser] = useState(null);
    const [isCreator, setIsCreator] = useState(false);

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

                setIsCreator(role === 'creator' || role === 'admin' || role === 'moderator');
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
                    const result = await AuthService.fetchAndSaveUserRole();

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

    return (
        <UserContext.Provider value={{ user, setUser }}>
            <AuthContext.Provider value={{ isAuth, setIsAuth, isLoading }}>
                <ModeratorContext.Provider value={{ isModerator, setIsModerator }}>
                    <CreatorContext.Provider value={{isCreator, setIsCreator}}>
                    <BrowserRouter>
                        <Navbar/>
                        <AppRouter/>
                    </BrowserRouter>
                    </CreatorContext.Provider>
                </ModeratorContext.Provider>
            </AuthContext.Provider>
        </UserContext.Provider>
    );
}

export default App;