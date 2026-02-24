import React, { useState } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import cl from './MyModal.module.css';

const MathModal = ({ isOpen, onClose, onInsert }) => {
    const [latex, setLatex] = useState('');
    const [isBlock, setIsBlock] = useState(false);

    if (!isOpen) return null;

    const insertFormula = () => {
        if (!latex.trim()) return;
        onInsert({ latex, isBlock });
        setLatex('');
        setIsBlock(false);
        onClose();
    };

    const renderPreview = () => {
        try {
            return {
                __html: katex.renderToString(latex || ' ', {
                    throwOnError: false,
                    displayMode: isBlock,
                }),
            };
        } catch {
            return { __html: '' };
        }
    };

    const addTemplate = (template) => {
        setLatex(prev => prev + template);
    };

    return (
        <div className={cl.overlay}>
            <div className={cl.modal}>
                <h3>Редактор формулы</h3>

                <textarea
                    value={latex}
                    onChange={(e) => setLatex(e.target.value)}
                    placeholder="Введите LaTeX (например: E = mc^2)"
                    className={cl.textarea}
                    autoFocus
                />

                <div className={cl.templateButtons}>
                    <button onClick={() => addTemplate('\\frac{}{}')}>Дробь</button>
                    <button onClick={() => addTemplate('^{}')}>Степень</button>
                    <button onClick={() => addTemplate('\\sqrt{}')}>Корень</button>
                    <button onClick={() => addTemplate('\\int_{}^{}')}>Интеграл</button>
                    <button onClick={() => addTemplate('\\sum_{}^{}')}>Сумма</button>
                    <button onClick={() => addTemplate('\\alpha')}>α</button>
                    <button onClick={() => addTemplate('\\beta')}>β</button>
                    <button onClick={() => addTemplate('\\pi')}>π</button>
                </div>

                <div className={cl.preview}>
                    <div dangerouslySetInnerHTML={renderPreview()} />
                </div>

                <label className={cl.checkbox}>
                    <input
                        type="checkbox"
                        checked={isBlock}
                        onChange={() => setIsBlock(!isBlock)}
                    />
                    Блочная формула (отдельным абзацем)
                </label>

                <div className={cl.actions}>
                    <button onClick={insertFormula} className={cl.insertBtn}>
                        Вставить
                    </button>
                    <button onClick={onClose} className={cl.cancelBtn}>
                        Отмена
                    </button>
                </div>
            </div>
        </div>
    );
};

export default MathModal;