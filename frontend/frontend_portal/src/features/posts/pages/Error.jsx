import React from 'react';
import {Helmet} from "react-helmet";

const Error = () => {
    return (
        <div className="page-wrapper error-page">
            <Helmet>
                <title>404</title>
            </Helmet>
            <div className="page-card">
                <h1>Такой страницы не существует!</h1>
            </div>
        </div>
    );
};

export default Error;