import React from 'react';
import MaterialItem from "./materialsItem";

const MaterialsList = ({ section, materials, title, backPath }) => {
    return (
        <div>
            {title && (
                <h1 style={{textAlign: 'center'}}>
                    {title}
                </h1>
            )}
            <div className="posts-grid">
                {materials.map((item, index) =>
                    <MaterialItem
                        key={item.id || index}
                        number={index + 1}
                        materials={item}
                        section={section}
                        backPath={backPath}
                    />
                )}
            </div>
        </div>
    );
};

export default MaterialsList;