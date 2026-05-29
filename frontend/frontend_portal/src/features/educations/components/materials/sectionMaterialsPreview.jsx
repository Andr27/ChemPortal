import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useFetching } from "../../../../hooks/useFetching";
import Loader from "../../../../components/UI/loader/loader";
import educationService from "../../API/EducationService";
import MaterialItem from "./materialsItem";

const PREVIEW_LIMIT = 12;

const SectionMaterialsPreview = ({ section = null }) => {
    const params = useParams();
    const sectionId = section?.id ?? params.id;
    const [materials, setMaterials] = useState([]);
    const [fetchMaterials, isLoading, error] = useFetching(async (id) => {
        const response = await educationService.getSectionMaterials(PREVIEW_LIMIT, 1, id);
        const data = response.data;
        const list = Array.isArray(data) ? data : (data?.results ?? []);
        setMaterials(list);
    });

    useEffect(() => {
        if (sectionId != null) {
            fetchMaterials(sectionId);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [sectionId]);

    const sectionForLink = section || (sectionId != null ? { id: sectionId } : null);

    return (
        <section className="education-block">
            <div className="education-block__header">
                <h2 className="education-block__title">Лекции</h2>
                {sectionForLink && (
                    <Link to={`/educations/${sectionForLink.id}/materials`} className="education-block__link">
                        Посмотреть всё
                    </Link>
                )}
            </div>
            <div className="education-preview-grid">
                {error && (
                    <p className="education-block__error">Произошла ошибка: {String(error)}</p>
                )}
                {isLoading && (
                    <div className="education-block__loader">
                        <Loader />
                    </div>
                )}
                {!isLoading && !error && materials.length === 0 && (
                    <p className="education-block__empty">Лекций пока нет</p>
                )}
                {!isLoading && !error && materials.map((item, index) => (
                    <MaterialItem
                        key={item.id || index}
                        materials={item}
                        section={sectionForLink}
                        backPath={sectionForLink ? `/educations/${sectionForLink.id}` : undefined}
                    />
                ))}
            </div>
        </section>
    );
};

export default SectionMaterialsPreview;
