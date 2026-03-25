import React from 'react';

const About = () => {
    return (
        <div className="page-wrapper about-page">
            <div className="page-card">
                <h1 className="page-title">О проекте</h1>
                <p style={{ color: 'var(--color-text-muted)', lineHeight: 1.6 }}>
                    Портал статей и новостей Тихоокеанского государственного университета.
                </p>
            </div>
        </div>
    );
};

export default About;