import React from 'react';
import MyEditor from "./MyEditor";
import cl from './ArticleViewer.module.css'

const ArticleViewer = ({ articleTitle, articleContent, editable = false, images = [] }) => {
    // articleContent может быть строкой JSON или простым текстом
    const parseContent = (content) => {
        if (!content) return null;

        if (typeof content === 'string') {
            try {
                return JSON.parse(content);
            } catch {
                return content;
            }
        }
        return content;
    };

    return (
        <div className={cl.articleViewer}>
            <h2 className={cl.articleViewerTitle}>{articleTitle}</h2>
            <MyEditor
                editable={editable}
                content={parseContent(articleContent)}
                images={images}
                borderless={!editable}
                onChange={() => {}}
            />
        </div>
    );
};

export default ArticleViewer;