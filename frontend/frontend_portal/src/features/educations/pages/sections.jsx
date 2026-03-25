import React from 'react';
import SectionGet from "../components/section/sectionGet";
import CategoriesBlock from "../components/section/CategoriesBlock";

const Sections = () => {
    return (
        <div className="App">
            <SectionGet
                disableScroll={true}
                preContent={<CategoriesBlock />}
            />
        </div>
    );
};

export default Sections;