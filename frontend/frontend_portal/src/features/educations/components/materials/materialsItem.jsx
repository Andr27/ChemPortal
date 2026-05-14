import React from 'react';
import { useNavigate } from "react-router-dom";

const MaterialItem = (props) => {
    const navigate = useNavigate();
    const backPath = props.backPath ?? `/educations/${props.section?.id}`;
    const openMaterial = () => navigate(`/educations/${props.section.id}/materials/${props.materials.id}`, { state: { from: backPath } });

    return (
        <div
            className="post post--clickable"
            role="link"
            tabIndex={0}
            onClick={openMaterial}
            onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    openMaterial();
                }
            }}
        >
            <div className="post__top">
                <div className="post__main">
                    <div className="post__header-row">
                        <div className="post__content">
                            {props.materials.title}
                        </div>
                    </div>

                    <div className="post__excerpt">
                        {props.materials.description || 'Здесь будет краткое описание лекции в пару строк, чтобы заинтересовать читателя.'}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MaterialItem;