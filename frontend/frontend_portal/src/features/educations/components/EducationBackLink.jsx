import React from 'react';
import { Link } from 'react-router-dom';

const EducationBackLink = ({ to, children = 'Назад' }) => (
    <Link className="education-back-link" to={to}>
        <span className="education-back-link__icon" aria-hidden="true">←</span>
        {children}
    </Link>
);

export default EducationBackLink;
