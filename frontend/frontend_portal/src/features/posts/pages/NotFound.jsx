import React from 'react';
import { Link } from 'react-router-dom';
import {Helmet} from "react-helmet";

const NotFound = () => {
    return (
        <div className="not-found-page">
            <Helmet>
                <title>404</title>
            </Helmet>
            <div className="not-found-page__code">404</div>
            <h1 className="not-found-page__title">Страница не найдена</h1>
            <p className="not-found-page__description">
                Возможно, она была удалена или вы перешли по неверной ссылке
            </p>
            <Link to="/posts" className="not-found-page__btn">
                На главную
            </Link>
        </div>
    );
};

export default NotFound;
