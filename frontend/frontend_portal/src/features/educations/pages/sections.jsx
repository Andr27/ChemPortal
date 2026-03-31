import React from 'react';
import SectionGet from "../components/section/sectionGet";
import CategoriesBlock from "../components/section/CategoriesBlock";
import {Helmet} from "react-helmet";

const Sections = () => {
    return (
        <div className="App">
            <Helmet>
                <title>Учебный центр</title>
            </Helmet>
            <SectionGet
                disableScroll={true}
                preContent={<CategoriesBlock />}
            />
        </div>
    );
};

export default Sections;