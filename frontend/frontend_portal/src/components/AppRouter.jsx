import React, { useContext, Suspense } from 'react';
import { Route, Routes, useLocation } from "react-router-dom";
import { publicRoutes, privateRoutes, moderationRoutes, creatorRoutes, NotFound } from "../router";
import {AuthContext, CreatorContext, ModeratorContext} from "../context";
import Loader from "./UI/loader/loader";
import PageTransition from "./UI/PageTransition/PageTransition";

const AppRouter = () => {
    const { isAuth, isLoading } = useContext(AuthContext);
    const { isModerator } = useContext(ModeratorContext);
    const { isCreator } = useContext(CreatorContext);
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

            <Route path="*" element={<NotFound />} />
        </Routes>
        </PageTransition>
        </Suspense>
    );
};

export default AppRouter;
