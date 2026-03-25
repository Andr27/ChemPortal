import React, { useState } from 'react';
import PostForm from "../components/PostForm";
import EducationCreatePage from "../../educations/pages/EducationCreatePage";

const CreateForm = () => {
    const [mode, setMode] = useState('article'); // 'article' | 'education'

    return (
        <div className="page-wrapper">
            <div className="page-card">
                <div className="edu-create__mode-toggle">
                    <button
                        type="button"
                        className={`edu-create__mode-btn${mode === 'article' ? ' edu-create__mode-btn--active' : ''}`}
                        onClick={() => setMode('article')}
                    >
                        Статья
                    </button>
                    <button
                        type="button"
                        className={`edu-create__mode-btn${mode === 'education' ? ' edu-create__mode-btn--active' : ''}`}
                        onClick={() => setMode('education')}
                    >
                        Образовательный раздел
                    </button>
                </div>

                {mode === 'article' && (
                    <>
                        <h1 className="page-title">Создать статью</h1>
                        <PostForm />
                    </>
                )}

                {mode === 'education' && (
                    <>
                        <h1 className="page-title">Создать образовательный контент</h1>
                        <EducationCreatePage />
                    </>
                )}
            </div>
        </div>
    );
};

export default CreateForm;
