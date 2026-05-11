import React from 'react';
import { useParams } from 'react-router-dom';
import CoursesGet from "../components/courses/coursesGet";
import {Helmet} from "react-helmet";

const SectionCoursesPage = () => {
    const params = useParams();
    const sectionId = params.id ? Number(params.id) : null;

    if (sectionId == null) {
        return null;
    }

    return (
        <div className="App">
            <Helmet>
                <title>Курсы раздела</title>
            </Helmet>
            <CoursesGet
                sectionId={sectionId}
                section={{ id: sectionId }}
                title="Курсы"
                showSearch={true}
                disableScroll={true}
                backLink={{ to: `/educations/${params.id}`, label: 'К разделу' }}
            />
        </div>
    );
};

export default SectionCoursesPage;
