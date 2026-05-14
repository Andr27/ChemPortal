import React from 'react';
import SectionItem from "./sectionItem";

const SectionsList = ({section, title}) => {
    return (
        <div>
            {title && (
                <h1 style={{textAlign: 'center'}}>
                    {title}
                </h1>
            )}
            <div className="posts-grid">
                {section.map((item, index) =>
                    <SectionItem
                        key={item.id || index}
                        number={index + 1}
                        section={item}
                    />
                )}
            </div>
        </div>
    );
};

export default SectionsList;