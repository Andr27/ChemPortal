import React from 'react';
import { useParams } from 'react-router-dom';
import MaterialsGet from "../components/materials/materialsGet";
import {Helmet} from "react-helmet";

const SectionMaterialsPage = () => {
    const params = useParams();
    const sectionId = params.id ? Number(params.id) : null;

    if (sectionId == null) {
        return null;
    }

    return (
        <div className="App">
            <Helmet>
                <title>Материалы в секции: {params.title}</title>
            </Helmet>
            <MaterialsGet
                sectionId={sectionId}
                section={{ id: sectionId }}
                title="Лекции"
                showSearch={true}
                disableScroll={true}
                backLink={{ to: `/educations/${params.id}`, label: 'К разделу' }}
            />
        </div>
    );
};

export default SectionMaterialsPage;
