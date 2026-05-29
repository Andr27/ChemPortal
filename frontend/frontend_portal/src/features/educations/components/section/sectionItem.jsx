import React from 'react';
import { useNavigate, useLocation } from "react-router-dom";
import iconCube from "../../../../img/icon/cube.svg";

const SectionItem = (props) => {
    const navigate = useNavigate();
    const location = useLocation();
    const openSection = () => navigate(
        `/educations/${props.section.id}`,
        { state: { from: location.pathname } }
    );

    return (
        <article
            className="section-card"
            role="link"
            tabIndex={0}
            onClick={openSection}
            onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    openSection();
                }
            }}
            aria-label={`Раздел: ${props.section.title}`}
        >
            <div className="section-card__strip" aria-hidden="true" />
            <div className="section-card__body">
                <div className="section-card__head">
                    <div className="section-card__icon" aria-hidden="true">
                        <span
                            className="section-card__icon-img"
                            style={{ maskImage: `url(${iconCube})`, WebkitMaskImage: `url(${iconCube})` }}
                        />
                    </div>
                    <h3 className="section-card__title">{props.section.title}</h3>
                </div>
            </div>
        </article>
    );
};

export default SectionItem;