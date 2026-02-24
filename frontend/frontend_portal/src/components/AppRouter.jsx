import React, { useContext } from 'react';
import { Navigate, Route, Routes } from "react-router-dom";
import { publicRoutes, privateRoutes, moderationRoutes, creatorRoutes } from "../router";
import {AuthContext, CreatorContext, ModeratorContext} from "../context";
import Loader from "./UI/loader/loader";

const AppRouter = () => {
    const { isAuth, isLoading } = useContext(AuthContext);
    const { isModerator } = useContext(ModeratorContext);
    const { isCreator } = useContext(CreatorContext);

    if (isLoading) {
        return <Loader/>;
    }

    return (
        <Routes>
            {!isAuth && publicRoutes.map(route => (
                <Route
                    key={route.path}
                    path={route.path}
                    element={<route.element />}
                />
            ))}

            {isAuth && (
                <>
                    {isModerator && moderationRoutes.map(route => (
                        <Route
                            key={route.path}
                            path={route.path}
                            element={<route.element />}
                        />
                    ))}

                    {privateRoutes.map(route => (
                        <Route
                            key={route.path}
                            path={route.path}
                            element={<route.element />}
                        />
                    ))}

                    {isCreator && creatorRoutes.map(route => (
                        <Route
                            key={route.path}
                            path={route.path}
                            element={<route.element />}
                        />
                    ))}
                </>
            )}

            <Route
                path="*"
                element={
                    !isAuth ? (
                        <Navigate to="/login" replace />
                    ) : (
                        <Navigate to="/posts" replace />
                    )
                }
            />
        </Routes>
    );
};

export default AppRouter;