import React, { useContext, Suspense } from 'react';
import { Route, Routes, Navigate, useLocation } from "react-router-dom";
import { publicRoutes, privateRoutes, moderationRoutes, expertRoutes, creatorRoutes, NotFound } from "../router";
import {AuthContext, CreatorContext, ExpertContext, ModeratorContext} from "../context";
import Loader from "./UI/loader/loader";
import PageTransition from "./UI/PageTransition/PageTransition";

const AppRouter = () => {
    const { isAuth, isLoading } = useContext(AuthContext);
    const { isModerator } = useContext(ModeratorContext);
    const { isCreator } = useContext(CreatorContext);
    const { isExpert } = useContext(ExpertContext);
    const location = useLocation();

    if (isLoading) {
        return <Loader/>;
    }

    return (
        <Suspense fallback={<Loader/>}>
        <PageTransition locationKey={location.pathname}>
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

                    {!isModerator && isExpert && expertRoutes.map(route => (
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

            <Route path="/" element={<Navigate to="/posts" replace />} />
            <Route path="*" element={<NotFound />} />
        </Routes>
        </PageTransition>
        </Suspense>
    );
};

export default AppRouter;
