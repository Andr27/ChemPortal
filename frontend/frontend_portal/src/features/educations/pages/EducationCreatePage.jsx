import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import EducationService from '../API/EducationService';
import MyEditor from '../../../components/UI/MyEditor/MyEditor';
import MyModal from '../../../components/UI/MyModal/MyModal';

/* ── Утилиты ──────────────────────────────────────────────────── */
let _localIdCounter = 0;
const localId = () => `l_${++_localIdCounter}`;

const moveItem = (arr, idx, dir) => {
    const next = idx + dir;
    if (next < 0 || next >= arr.length) return arr;
    const a = [...arr];
    [a[idx], a[next]] = [a[next], a[idx]];
    return a;
};

const makeOption  = ()          => ({ id: localId(), text: '', isCorrect: false });
const makeQuestion = (type = 'single') => ({
    id: localId(), type, text: '', points: 1, hint: '', explanation: '',
    options: type === 'string' ? [] : [makeOption(), makeOption()],
    correctStringAnswer: '', correctStringAlternatives: '',
});
const makeLesson  = ()          => ({ id: localId(), title: '', content: null, images: [], quiz: null });
const makeChapter = ()          => ({ id: localId(), title: '', description: '', lessons: [makeLesson()] });


/* ── QuestionItem (сворачиваемый вопрос) ─────────────────────── */
const QuestionItem = ({ question: q, index: qi, onUpdate, onRemove }) => {
    const [collapsed, setCollapsed] = useState(false);

    const updateOption = (oId, patch) =>
        onUpdate({ options: q.options.map(o => o.id === oId ? { ...o, ...patch } : o) });

    const removeOption = (oId) =>
        onUpdate({ options: q.options.filter(o => o.id !== oId) });

    const addOption = () =>
        onUpdate({ options: [...q.options, makeOption()] });

    const typeLabel = q.type === 'single' ? 'Один ответ' : q.type === 'multiple' ? 'Несколько ответов' : 'Текстовый ответ';
    const preview   = q.text ? q.text.slice(0, 50) + (q.text.length > 50 ? '…' : '') : `Вопрос ${qi + 1}`;

    return (
        <div className="edu-quiz-builder__question">
            <div
                className="edu-quiz-builder__q-header"
                onClick={() => setCollapsed(v => !v)}
                role="button"
                tabIndex={0}
                onKeyDown={e => e.key === 'Enter' && setCollapsed(v => !v)}
            >
                <span className="edu-quiz-builder__q-num">#{qi + 1}</span>
                <span className="edu-quiz-builder__q-type">{typeLabel}</span>
                <span className="edu-quiz-builder__q-preview">{preview}</span>
                <span className="edu-quiz-builder__q-arrow">{collapsed ? '▾' : '▴'}</span>
                <button
                    type="button"
                    className="edu-icon-btn edu-icon-btn--danger"
                    onClick={e => { e.stopPropagation(); onRemove(); }}
                    title="Удалить вопрос"
                >✕</button>
            </div>

            {!collapsed && (
                <div className="edu-quiz-builder__q-body">
                    <input
                        className="edu-input"
                        placeholder="Текст вопроса *"
                        value={q.text}
                        onChange={e => onUpdate({ text: e.target.value })}
                    />

                    <div className="edu-quiz-builder__q-meta">
                        <label className="edu-label">
                            Баллы:&nbsp;
                            <input
                                type="number"
                                className="edu-input edu-input--sm"
                                min={1}
                                value={q.points}
                                onChange={e => onUpdate({ points: Number(e.target.value) })}
                            />
                        </label>
                        <input className="edu-input" placeholder="Подсказка (необязательно)"
                            value={q.hint} onChange={e => onUpdate({ hint: e.target.value })} />
                        <input className="edu-input" placeholder="Пояснение после ответа (необязательно)"
                            value={q.explanation} onChange={e => onUpdate({ explanation: e.target.value })} />
                    </div>

                    {(q.type === 'single' || q.type === 'multiple') && (
                        <div className="edu-quiz-builder__options">
                            {q.options.map(opt => (
                                <div key={opt.id} className="edu-quiz-builder__option">
                                    <input
                                        type={q.type === 'single' ? 'radio' : 'checkbox'}
                                        className="edu-quiz-builder__option-check"
                                        checked={opt.isCorrect}
                                        onChange={e => {
                                            if (q.type === 'single') {
                                                onUpdate({ options: q.options.map(o => ({ ...o, isCorrect: o.id === opt.id ? e.target.checked : false })) });
                                            } else {
                                                updateOption(opt.id, { isCorrect: e.target.checked });
                                            }
                                        }}
                                        title="Правильный ответ"
                                    />
                                    <input
                                        className="edu-input edu-input--flex"
                                        placeholder={`Вариант ${q.options.indexOf(opt) + 1}`}
                                        value={opt.text}
                                        onChange={e => updateOption(opt.id, { text: e.target.value })}
                                    />
                                    <button type="button" className="edu-icon-btn edu-icon-btn--danger"
                                        onClick={() => removeOption(opt.id)} title="Удалить вариант">✕</button>
                                </div>
                            ))}
                            <button type="button" className="edu-quiz-builder__add-option"
                                onClick={addOption}>+ Добавить вариант</button>
                        </div>
                    )}

                    {q.type === 'string' && (
                        <div className="edu-quiz-builder__string-answer">
                            <input className="edu-input" placeholder="Правильный ответ *"
                                value={q.correctStringAnswer}
                                onChange={e => onUpdate({ correctStringAnswer: e.target.value })} />
                            <input className="edu-input" placeholder="Альтернативы через | (необязательно)"
                                value={q.correctStringAlternatives}
                                onChange={e => onUpdate({ correctStringAlternatives: e.target.value })} />
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};


/* ── QuizBuilder ──────────────────────────────────────────────── */
const QuizBuilder = ({ quiz, onChange, onRemove }) => {
    const questions = quiz?.questions || [];

    const updateQuestion = (qId, patch) =>
        onChange({ ...quiz, questions: questions.map(q => q.id === qId ? { ...q, ...patch } : q) });

    const addQuestion = (type) =>
        onChange({ ...quiz, questions: [...questions, makeQuestion(type)] });

    const removeQuestion = (qId) =>
        onChange({ ...quiz, questions: questions.filter(q => q.id !== qId) });

    return (
        <div className="edu-quiz-builder">
            <div className="edu-quiz-builder__header">
                <span className="edu-quiz-builder__title">Тест к уроку</span>
                <div className="edu-quiz-builder__add-btns">
                    <button type="button" className="edu-quiz-builder__add-btn" onClick={() => addQuestion('single')}>+ Один ответ</button>
                    <button type="button" className="edu-quiz-builder__add-btn" onClick={() => addQuestion('multiple')}>+ Несколько</button>
                    <button type="button" className="edu-quiz-builder__add-btn" onClick={() => addQuestion('string')}>+ Текст</button>
                    <button type="button" className="edu-quiz-builder__remove-btn" onClick={onRemove}>Убрать тест</button>
                </div>
            </div>

            {questions.length === 0 && (
                <p className="edu-quiz-builder__empty">Нет вопросов. Добавьте первый выше.</p>
            )}

            {questions.map((q, qi) => (
                <QuestionItem
                    key={q.id}
                    question={q}
                    index={qi}
                    onUpdate={(patch) => updateQuestion(q.id, patch)}
                    onRemove={() => removeQuestion(q.id)}
                />
            ))}
        </div>
    );
};


/* ── LessonRow (разворачиваемый) ─────────────────────────────── */
const LessonRow = ({ lesson, index, total, onMove, onUpdate, onRemove }) => {
    const [expanded, setExpanded] = useState(false);
    const [quizOpen, setQuizOpen]  = useState(false);
    const imgIdRef = useRef(1);

    const hasQuiz = !!lesson.quiz;

    const handleImageAdd = (file) => {
        if (!file?.type?.startsWith('image/')) return null;
        const id = imgIdRef.current++;
        const previewUrl = URL.createObjectURL(file);
        onUpdate({ ...lesson, images: [...(lesson.images || []), { id, file, previewUrl }] });
        return id;
    };

    const handleQuizChange  = (quiz) => onUpdate({ ...lesson, quiz });
    const handleQuizRemove  = ()     => { onUpdate({ ...lesson, quiz: null }); setQuizOpen(false); };

    return (
        <div className={`edu-lesson-row${expanded ? ' edu-lesson-row--open' : ''}`}>
            {/* Заголовок строки — клик раскрывает редактор */}
            <div
                className="edu-lesson-row__header"
                onClick={() => setExpanded(v => !v)}
                role="button"
                tabIndex={0}
                onKeyDown={e => e.key === 'Enter' && setExpanded(v => !v)}
            >
                <span className="edu-lesson-row__icon" aria-hidden="true">
                    <svg viewBox="0 0 16 16" fill="none" width="13" height="13">
                        <rect x="2" y="1" width="10" height="13" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
                        <line x1="5" y1="5" x2="10" y2="5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                        <line x1="5" y1="8" x2="10" y2="8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                        <line x1="5" y1="11" x2="8" y2="11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                </span>
                <span className="edu-lesson-row__title">
                    {lesson.title || `Урок ${index + 1}`}
                </span>
                <span className="edu-lesson-row__arrow">{expanded ? '▴' : '▾'}</span>
                <div className="edu-lesson-row__actions" onClick={e => e.stopPropagation()}>
                    <button type="button" className="edu-icon-btn" onClick={() => onMove(-1)} disabled={index === 0} title="Выше">↑</button>
                    <button type="button" className="edu-icon-btn" onClick={() => onMove(1)} disabled={index === total - 1} title="Ниже">↓</button>
                    <button type="button" className="edu-icon-btn edu-icon-btn--danger" onClick={onRemove} title="Удалить">✕</button>
                </div>
            </div>

            {/* Тело урока */}
            {expanded && (
                <div className="edu-lesson-row__body">
                    <label className="edu-label edu-label--required" style={{marginBottom: 0}}>Название урока</label>
                    <input
                        className="edu-input edu-input--title"
                        placeholder={`Название урока ${index + 1} *`}
                        value={lesson.title}
                        onChange={e => onUpdate({ ...lesson, title: e.target.value })}
                        onClick={e => e.stopPropagation()}
                    />
                    <label className="edu-label edu-label--required" style={{marginBottom: 0}}>Содержимое урока</label>
                    <div className="edu-lesson-row__editor">
                        <MyEditor
                            content={lesson.content}
                            onChange={val => onUpdate({ ...lesson, content: val })}
                            onAddImage={handleImageAdd}
                            images={(lesson.images || []).map(i => ({ id: i.id, image: i.previewUrl }))}
                        />
                    </div>
                </div>
            )}

            {/* Полоса теста */}
            <button
                type="button"
                className={`edu-lesson-row__quiz-bar${hasQuiz ? ' edu-lesson-row__quiz-bar--has-quiz' : ''}`}
                onClick={e => {
                    e.stopPropagation();
                    if (!hasQuiz) {
                        handleQuizChange({ questions: [] });
                        setQuizOpen(true);
                    } else {
                        const willClose = quizOpen;
                        if (willClose && lesson.quiz?.questions?.length === 0) {
                            handleQuizRemove();
                        } else {
                            setQuizOpen(v => !v);
                        }
                    }
                }}
            >
                <span className="edu-quiz-bar-icon" aria-hidden="true">
                    <svg viewBox="0 0 16 16" fill="none" width="12" height="12">
                        <path d="M2 3h8l3 3v7a1 1 0 01-1 1H2a1 1 0 01-1-1V4a1 1 0 011-1z" stroke="currentColor" strokeWidth="1.5"/>
                        <path d="M10 3v3h3" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
                        <line x1="4" y1="8" x2="9" y2="8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                        <line x1="4" y1="11" x2="7" y2="11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                </span>
                {hasQuiz
                    ? (quizOpen ? `Скрыть тест (${lesson.quiz.questions.length} вопр.)` : `Тест · ${lesson.quiz.questions.length} вопр. — нажмите чтобы открыть`)
                    : '+ Добавить тест к уроку'}
            </button>

            {quizOpen && hasQuiz && (
                <QuizBuilder
                    quiz={lesson.quiz}
                    onChange={handleQuizChange}
                    onRemove={handleQuizRemove}
                />
            )}
        </div>
    );
};


/* ── ChapterBlock ─────────────────────────────────────────────── */
const ChapterBlock = ({ chapter, index, total, onMove, onUpdate, onRemove }) => {
    const updateLesson = (lessonId, updated) =>
        onUpdate({ ...chapter, lessons: chapter.lessons.map(l => l.id === lessonId ? updated : l) });

    const addLesson = () =>
        onUpdate({ ...chapter, lessons: [...chapter.lessons, makeLesson()] });

    const removeLesson = (lessonId) =>
        onUpdate({ ...chapter, lessons: chapter.lessons.filter(l => l.id !== lessonId) });

    const moveLesson = (lessonId, dir) =>
        onUpdate({ ...chapter, lessons: moveItem(chapter.lessons, chapter.lessons.findIndex(l => l.id === lessonId), dir) });

    return (
        <div className="edu-chapter-block">
            <div className="edu-chapter-block__header">
                <div className="edu-chapter-block__header-left">
                    <span className="edu-chapter-block__badge">{index + 1}</span>
                    <input
                        className="edu-input edu-input--chapter-title"
                        placeholder={`Название главы ${index + 1} *`}
                        value={chapter.title}
                        onChange={e => onUpdate({ ...chapter, title: e.target.value })}
                    />
                </div>
                <div className="edu-chapter-block__header-right">
                    <button type="button" className="edu-icon-btn" onClick={() => onMove(-1)} disabled={index === 0} title="Выше">↑</button>
                    <button type="button" className="edu-icon-btn" onClick={() => onMove(1)} disabled={index === total - 1} title="Ниже">↓</button>
                    <button type="button" className="edu-icon-btn edu-icon-btn--danger" onClick={onRemove} title="Удалить главу">✕</button>
                </div>
            </div>

            <input
                className="edu-input edu-chapter-block__desc"
                placeholder="Описание главы (необязательно)"
                value={chapter.description}
                onChange={e => onUpdate({ ...chapter, description: e.target.value })}
            />

            <div className="edu-chapter-block__lessons">
                {chapter.lessons.length === 0 && (
                    <p className="edu-empty-hint">Нет уроков. Добавьте первый.</p>
                )}
                {chapter.lessons.map((lesson, li) => (
                    <LessonRow
                        key={lesson.id}
                        lesson={lesson}
                        index={li}
                        total={chapter.lessons.length}
                        onMove={dir => moveLesson(lesson.id, dir)}
                        onUpdate={updated => updateLesson(lesson.id, updated)}
                        onRemove={() => removeLesson(lesson.id)}
                    />
                ))}
            </div>

            <button type="button" className="edu-add-lesson-btn" onClick={addLesson}>
                + Добавить урок
            </button>
        </div>
    );
};


/* ── EducationCreatePage ──────────────────────────────────────── */
const EducationCreatePage = () => {
    const navigate = useNavigate();
    const nextEditorImageIdRef = useRef(1);

    const [sections, setSections] = useState([]);
    const [selectedSectionId, setSelectedSectionId] = useState('');
    const [isSectionModalOpen, setIsSectionModalOpen] = useState(false);

    // Данные нового раздела
    const [newSectionData, setNewSectionData] = useState({ title: '', description: '' });

    // Категории
    const [categories, setCategories] = useState([]);
    const [selectedCategoryId, setSelectedCategoryId] = useState('');

    const [isSectionCreating, setIsSectionCreating] = useState(false);
    const [sectionCreateError, setSectionCreateError] = useState('');

    const [contentType, setContentType] = useState('lecture');

    const [lectureTitle, setLectureTitle] = useState('');
    const [lectureType, setLectureType] = useState('text');
    const [lectureContent, setLectureContent] = useState(null);
    const [lectureImages, setLectureImages] = useState([]);

    const [courseTitle, setCourseTitle] = useState('');
    const [courseDescription, setCourseDescription] = useState('');
    const [chapters, setChapters] = useState([makeChapter()]);

    const [isSaving, setIsSaving] = useState(false);
    const [saveError, setSaveError] = useState('');
    const [saveSuccess, setSaveSuccess] = useState(false);

    useEffect(() => {
        let cancelled = false;
        EducationService.getSection(100, 1)
            .then(resp => {
                if (cancelled) return;
                const data = resp.data;
                setSections(Array.isArray(data) ? data : (data?.results ?? []));
            })
            .catch(e => console.error('Failed to load sections', e)); // eslint-disable-line no-console
        EducationService.getCategories()
            .then(resp => {
                if (cancelled) return;
                const data = resp.data;
                setCategories(Array.isArray(data) ? data : (data?.results ?? []));
            })
            .catch(e => console.error('Failed to load categories', e)); // eslint-disable-line no-console
        return () => { cancelled = true; };
    }, []);

    /* Запросить раздел через единый endpoint */
    const handleRequestSection = async () => {
        if (!selectedCategoryId) {
            setSectionCreateError('Выберите категорию');
            return;
        }
        if (!newSectionData.title.trim()) {
            setSectionCreateError('Введите название раздела');
            return;
        }

        setIsSectionCreating(true);
        setSectionCreateError('');
        try {
            const resp = await EducationService.createAndSendSectionToModeration({
                title: newSectionData.title,
                description: newSectionData.description,
                category: selectedCategoryId,
            });
            const created = resp.data;
            setSections(prev => [...prev, created]);
            setSelectedSectionId(String(created.id));
            setIsSectionModalOpen(false);
            setNewSectionData({ title: '', description: '' });
            setSelectedCategoryId('');
        } catch (e) {
            setSectionCreateError(e?.response?.data?.detail || JSON.stringify(e?.response?.data) || 'Ошибка при создании запроса');
        } finally {
            setIsSectionCreating(false);
        }
    };

    const updateChapter = (id, updated) => setChapters(prev => prev.map(c => c.id === id ? updated : c));
    const removeChapter = (id)          => setChapters(prev => prev.filter(c => c.id !== id));
    const moveChapter   = (id, dir)     => setChapters(prev => moveItem(prev, prev.findIndex(c => c.id === id), dir));

    /* Билдер payload вопроса */
    const buildQuestionPayload = (q) => {
        const base = { text: q.text, type: q.type, points: q.points };
        if (q.hint)        base.hint        = q.hint;
        if (q.explanation) base.explanation = q.explanation;
        if (q.type === 'string') {
            base.correct_string_answer = q.correctStringAnswer;
            if (q.correctStringAlternatives) base.correct_string_alternatives = q.correctStringAlternatives;
        } else {
            base.options = q.options.map((o, i) => ({ text: o.text, is_correct: o.isCorrect, order: i + 1 }));
            if (q.type === 'multiple') base.partial_credit = true;
        }
        return base;
    };

    const handleSave = async (sendToModeration = false) => {
        setSaveError('');
        setSaveSuccess(false);

        if (!selectedSectionId) { setSaveError('Выберите раздел'); return; }

        if (contentType === 'lecture') {
            if (!lectureTitle.trim()) { setSaveError('Введите название материала'); return; }
        }

        if (contentType === 'course') {
            if (!courseTitle.trim()) { setSaveError('Введите название курса'); return; }
            if (chapters.length === 0) { setSaveError('Добавьте хотя бы одну главу'); return; }

            for (let ci = 0; ci < chapters.length; ci++) {
                const ch = chapters[ci];
                const chNum = ci + 1;

                if (!ch.title.trim()) {
                    setSaveError(`Глава ${chNum}: введите название`);
                    return;
                }
                if (ch.lessons.length === 0) {
                    setSaveError(`Глава ${chNum} «${ch.title}»: добавьте хотя бы один урок`);
                    return;
                }

                for (let li = 0; li < ch.lessons.length; li++) {
                    const ls = ch.lessons[li];
                    const lsNum = li + 1;

                    if (!ls.title.trim()) {
                        setSaveError(`Глава ${chNum}, урок ${lsNum}: введите название урока`);
                        return;
                    }
                    if (!ls.content) {
                        setSaveError(`Глава ${chNum}, урок ${lsNum} «${ls.title}»: добавьте содержимое урока`);
                        return;
                    }

                    if (ls.quiz) {
                        if (ls.quiz.questions.length === 0) {
                            setSaveError(`Глава ${chNum}, урок ${lsNum} «${ls.title}»: в тесте нет вопросов — добавьте вопрос или удалите тест`);
                            return;
                        }
                        for (let qi = 0; qi < ls.quiz.questions.length; qi++) {
                            const q = ls.quiz.questions[qi];
                            if (!q.text.trim()) {
                                setSaveError(`Глава ${chNum}, урок ${lsNum}, вопрос ${qi + 1}: введите текст вопроса`);
                                return;
                            }
                            if ((q.type === 'single' || q.type === 'multiple') && q.options.length < 2) {
                                setSaveError(`Глава ${chNum}, урок ${lsNum}, вопрос ${qi + 1}: добавьте минимум 2 варианта ответа`);
                                return;
                            }
                            if ((q.type === 'single' || q.type === 'multiple') && !q.options.some(o => o.isCorrect)) {
                                setSaveError(`Глава ${chNum}, урок ${lsNum}, вопрос ${qi + 1}: отметьте хотя бы один правильный ответ`);
                                return;
                            }
                            if (q.type === 'string' && !q.correctStringAnswer.trim()) {
                                setSaveError(`Глава ${chNum}, урок ${lsNum}, вопрос ${qi + 1}: введите правильный ответ`);
                                return;
                            }
                        }
                    }
                }
            }
        }

        setIsSaving(true);
        try {
            if (contentType === 'lecture') {
                // Лекция сразу добавляется в раздел, модерация не нужна
                await EducationService.createMaterial(selectedSectionId, {
                    title: lectureTitle,
                    type: lectureType,
                    content: lectureContent ? JSON.stringify(lectureContent) : '',
                    order: 1,
                });
            } else {
                // Курс: создаём через обычный или moderation-endpoint
                const createFn = sendToModeration
                    ? () => EducationService.createAndSendCourseToModeration(selectedSectionId, {
                        title: courseTitle,
                        description: courseDescription,
                    })
                    : () => EducationService.createCourse(selectedSectionId, {
                        title: courseTitle,
                        description: courseDescription,
                    });

                const courseResp = await createFn();
                const courseId = courseResp.data.id;

                // Главы, уроки, тесты — создаём в любом случае
                // (тесты автоматически наследуют статус курса)
                for (let ci = 0; ci < chapters.length; ci++) {
                    const ch = chapters[ci];
                    const chapterResp = await EducationService.createChapter(selectedSectionId, courseId, {
                        title: ch.title, description: ch.description, order: ci + 1,
                    });
                    const chapterId = chapterResp.data.id;

                    for (let li = 0; li < ch.lessons.length; li++) {
                        const ls = ch.lessons[li];
                        const lessonResp = await EducationService.createLessons(
                            selectedSectionId, courseId, chapterId,
                            { title: ls.title || `Урок ${li + 1}`, type: 'lecture', content: ls.content ? JSON.stringify(ls.content) : '', order: li + 1 }
                        );
                        const lessonId = lessonResp.data.id;

                        if (ls.quiz && ls.quiz.questions.length > 0) {
                            const quizResp = await EducationService.createQuiz({
                                title: `Тест: ${ls.title || `Урок ${li + 1}`}`,
                                lesson: lessonId,
                                passing_score: 60,
                                max_attempts: 3,
                                time_limit_minutes: null,
                                show_explanation_after: true,
                            });
                            const quizId = quizResp.data.id;
                            for (const q of ls.quiz.questions) {
                                await EducationService.addQuizQuestion(quizId, buildQuestionPayload(q));
                            }
                        }
                    }
                }
            }

            setSaveSuccess(true);
            setTimeout(() => navigate('/educations'), 2000);
        } catch (e) {
            setSaveError(e?.response?.data?.detail || JSON.stringify(e?.response?.data) || 'Ошибка при сохранении');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="edu-create">

            {/* Выбор раздела */}
            <div className="edu-create__section-row">
                <label className="edu-label edu-label--required">Раздел</label>
                <div className="edu-create__section-select-wrap">
                    <select className="edu-select" value={selectedSectionId}
                        onChange={e => setSelectedSectionId(e.target.value)}>
                        <option value="">— Выберите раздел —</option>
                        {sections.map(s => (
                            <option key={s.id} value={String(s.id)}>{s.title}</option>
                        ))}
                    </select>
                    <button type="button" className="edu-create__new-section-btn"
                        onClick={() => setIsSectionModalOpen(true)}>
                        Не нашли нужный?
                    </button>
                </div>
            </div>

            {/* Тип */}
            <div className="edu-create__type-toggle">
                <button type="button"
                    className={`edu-create__type-btn${contentType === 'lecture' ? ' edu-create__type-btn--active' : ''}`}
                    onClick={() => setContentType('lecture')}>
                    Лекция / Материал
                </button>
                <button type="button"
                    className={`edu-create__type-btn${contentType === 'course' ? ' edu-create__type-btn--active' : ''}`}
                    onClick={() => setContentType('course')}>
                    Курс
                </button>
            </div>

            {/* Лекция */}
            {contentType === 'lecture' && (
                <div className="edu-create__lecture">
                    <div className="edu-create__course-divider" />
                    <input className="edu-input edu-input--title" placeholder="Название материала *"
                        value={lectureTitle} onChange={e => setLectureTitle(e.target.value)} />
                    <label className="edu-label edu-label--required">Содержимое</label>
                    <div className="edu-create__editor-wrap">
                        <MyEditor
                            content={lectureContent}
                            onChange={setLectureContent}
                            onAddImage={(file) => {
                                if (!file?.type?.startsWith('image/')) return null;
                                const id = nextEditorImageIdRef.current++;
                                const previewUrl = URL.createObjectURL(file);
                                setLectureImages(prev => [...prev, { id, file, previewUrl }]);
                                return id;
                            }}
                            images={lectureImages.map(i => ({ id: i.id, image: i.previewUrl }))}
                        />
                    </div>
                    <div className="edu-create__lecture-bottom">
                        <select className="edu-select edu-select--type" value={lectureType}
                            onChange={e => setLectureType(e.target.value)}>
                            <option value="text">Лекция</option>
                            <option value="video">Видео</option>
                        </select>
                    </div>
                </div>
            )}

            {/* Курс */}
            {contentType === 'course' && (
                <div className="edu-create__course">
                    <div className="edu-create__course-divider" />
                    <input className="edu-input edu-input--title" placeholder="Название курса *"
                        value={courseTitle} onChange={e => setCourseTitle(e.target.value)} />
                    <textarea className="edu-textarea" placeholder="Описание курса (необязательно)"
                        rows={3} value={courseDescription} onChange={e => setCourseDescription(e.target.value)} />

                    <div className="edu-create__course-divider" />
                    <div className="edu-course-builder">
                        <div className="edu-course-builder__header">
                            <span className="edu-course-builder__label">Программа курса</span>
                        </div>
                        {chapters.map((ch, ci) => (
                            <ChapterBlock
                                key={ch.id}
                                chapter={ch}
                                index={ci}
                                total={chapters.length}
                                onMove={dir => moveChapter(ch.id, dir)}
                                onUpdate={updated => updateChapter(ch.id, updated)}
                                onRemove={() => removeChapter(ch.id)}
                            />
                        ))}
                        <button type="button" className="edu-course-builder__add-chapter"
                            onClick={() => setChapters(prev => [...prev, makeChapter()])}>
                            + Добавить главу
                        </button>
                    </div>
                </div>
            )}

            {/* Кнопки */}
            <div className="edu-create__footer">
                {saveError   && <p className="edu-create__error">{saveError}</p>}
                {saveSuccess && <p className="edu-create__success">
                    {contentType === 'lecture' ? 'Материал добавлен!' : 'Сохранено!'} Переход на страницу разделов...
                </p>}
                <div className="edu-create__footer-btns">
                    {contentType === 'lecture' ? (
                        <button type="button" className="edu-create__save-btn edu-create__save-btn--moderation"
                            onClick={() => handleSave(false)} disabled={isSaving}>
                            {isSaving ? 'Добавляем...' : 'Добавить'}
                        </button>
                    ) : (
                        <>
                            <button type="button" className="edu-create__save-btn edu-create__save-btn--draft"
                                onClick={() => handleSave(false)} disabled={isSaving}>
                                {isSaving ? 'Сохранение...' : 'Сохранить в черновик'}
                            </button>
                            <button type="button" className="edu-create__save-btn edu-create__save-btn--moderation"
                                onClick={() => handleSave(true)} disabled={isSaving}>
                                {isSaving ? 'Отправка...' : 'Создать и отправить на модерацию'}
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Модалка: запросить раздел */}
            <MyModal visible={isSectionModalOpen} setVisible={setIsSectionModalOpen} width="500px" height="auto">
                <div className="edu-create__section-modal">
                    <h3 className="edu-create__section-modal-title">Запросить раздел</h3>
                    <p className="edu-create__section-modal-hint">
                        Заявка будет отправлена администратору на рассмотрение.
                        После одобрения раздел появится в списке.
                    </p>

                    {/* Категория */}
                    <div className="edu-create__section-modal-group">
                        <label className="edu-label edu-label--required">Категория</label>
                        <select
                            className="edu-select"
                            value={selectedCategoryId}
                            onChange={e => setSelectedCategoryId(e.target.value)}
                        >
                            <option value="">— Выберите категорию —</option>
                            {categories.map(c => (
                                <option key={c.id} value={String(c.id)}>{c.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* Раздел */}
                    <div className="edu-create__section-modal-group">
                        <label className="edu-label edu-label--required">Раздел</label>
                        <input
                            className="edu-input edu-input--title"
                            placeholder="Название раздела"
                            value={newSectionData.title}
                            onChange={e => setNewSectionData(p => ({ ...p, title: e.target.value }))}
                        />
                        <textarea
                            className="edu-textarea"
                            placeholder="Описание раздела (необязательно)"
                            rows={3}
                            value={newSectionData.description}
                            onChange={e => setNewSectionData(p => ({ ...p, description: e.target.value }))}
                        />
                    </div>

                    {sectionCreateError && <p className="edu-create__error">{sectionCreateError}</p>}

                    <div className="edu-create__section-modal-btns">
                        <button type="button" className="edu-create__save-btn edu-create__save-btn--moderation"
                            onClick={handleRequestSection} disabled={isSectionCreating}>
                            {isSectionCreating ? 'Отправляем...' : 'Запросить'}
                        </button>
                        <button type="button" className="edu-create__save-btn"
                            onClick={() => {
                                setIsSectionModalOpen(false);
                                setSectionCreateError('');
                                setSelectedCategoryId('');
                                setNewSectionData({ title: '', description: '' });
                            }}>
                            Отмена
                        </button>
                    </div>
                </div>
            </MyModal>
        </div>
    );
};

export default EducationCreatePage;
