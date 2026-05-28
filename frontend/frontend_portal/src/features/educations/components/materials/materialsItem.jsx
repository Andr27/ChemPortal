import React from 'react';
import { useNavigate } from "react-router-dom";
import { makeExcerpt } from "../../../../utils/textExcerpt";

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
                        {makeExcerpt(props.materials.content || props.materials.body || props.materials.description, 15) || 'Здесь будет краткое описание лекции.'}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MaterialItem;