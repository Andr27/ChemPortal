import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import Loader from "../../../components/UI/loader/loader";
import { useFetching } from "../../../hooks/useFetching";
import educationService from "../API/EducationService";
import MyEditor from "../../../components/UI/MyEditor/MyEditor";
import { useUser } from "../../../hooks/useUser";

let _localIdCounter = 0;
const localId = () => `l_${++_localIdCounter}`;

const moveItem = (arr, idx, dir) => {
    const next = idx + dir;
    if (next < 0 || next >= arr.length) return arr;
    const a = [...arr];
    [a[idx], a[next]] = [a[next], a[idx]];
    return a;
};

const parseDoc = (raw) => {
    if (raw == null || raw === '') return null;
    if (typeof raw !== 'string') return raw;
    try {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') return parsed;
    } catch (_) {}
    return {
        type: 'doc',
        content: [{ type: 'paragraph', content: [{ type: 'text', text: raw }] }]
    };
};

const canEditEntity = ({ entity, user, role }) => {
    if (!entity) return false;
    if (role === 'admin') return true;
    const ownerId = entity?.created_by?.id ?? entity?.created_by_id ?? entity?.author?.id ?? entity?.user?.id;
    return ownerId != null && user?.id != null && Number(ownerId) === Number(user.id);
};

const getCourseEditBackLabel = (fromPath, courseId) => {
    if (!fromPath) return 'К разделу';
    if (fromPath === '/account') return 'В аккаунт';
    if (fromPath.includes(`/courses/${courseId}/progress`)) return 'К прогрессу';
    if (fromPath.includes(`/courses/${courseId}`)) return 'К курсу';
    if (fromPath.includes('/courses')) return 'К курсам';
    return 'К разделу';
};

const makeOption = (seed = {}) => ({
    id: seed.id ?? localId(),
    text: seed.text ?? '',
    isCorrect: !!seed.isCorrect,
});

const makeQuestion = (type = 'single', seed = {}) => ({
    id: seed.id ?? localId(),
    type,
    text: seed.text ?? '',
    points: seed.points ?? 1,
    hint: seed.hint ?? '',
    explanation: seed.explanation ?? '',
    options: type === 'string'
        ? []
        : (seed.options ?? [makeOption(), makeOption()]),
    correctStringAnswer: seed.correctStringAnswer ?? '',
    correctStringAlternatives: seed.correctStringAlternatives ?? '',
});

const buildQuestionPayload = (q) => {
    const base = { text: q.text, type: q.type, points: q.points };
    if (q.hint) base.hint = q.hint;
    if (q.explanation) base.explanation = q.explanation;
    if (q.type === 'string') {
        base.correct_string_answer = q.correctStringAnswer;
        if (q.correctStringAlternatives) base.correct_string_alternatives = q.correctStringAlternatives;
    } else {
        base.options = (q.options || []).map((o, i) => ({ text: o.text, is_correct: o.isCorrect, order: i + 1 }));
        if (q.type === 'multiple') base.partial_credit = true;
    }
    return base;
};

const mapAdminQuizToBuilder = (adminQuiz) => {
    const rawQuestions = adminQuiz?.questions || adminQuiz?.quiz_questions || [];
    const list = Array.isArray(rawQuestions) ? rawQuestions : (rawQuestions?.results ?? []);
    return {
        id: adminQuiz?.id,
        questions: list.map((q) => {
            const type = q.type || 'single';
            const optionsRaw = Array.isArray(q.options) ? q.options : (q.options?.results ?? []);
            return makeQuestion(type, {
                id: q.id ?? localId(),
                text: q.text ?? '',
                points: q.points ?? 1,
                hint: q.hint ?? '',
                explanation: q.explanation ?? '',
                options: optionsRaw.map((o) => makeOption({
                    id: o.id ?? localId(),
                    text: o.text ?? '',
                    isCorrect: !!(o.is_correct ?? o.isCorrect),
                })),
                correctStringAnswer: q.correct_string_answer ?? q.correctStringAnswer ?? '',
                correctStringAlternatives: q.correct_string_alternatives ?? q.correctStringAlternatives ?? '',
            });
        }),
    };
};

const makeLesson = (seed = {}) => ({
    id: seed.id ?? localId(),
    title: seed.title ?? '',
    content: seed.content ?? null,
    images: seed.images ?? [],
    quiz: seed.quiz ?? null, // { id?, questions:[] }
    quizIdOriginal: seed.quizIdOriginal ?? null, // numeric quiz id if existed on backend
});

const makeChapter = (seed = {}) => ({
    id: seed.id ?? localId(),
    title: seed.title ?? '',
    description: seed.description ?? '',
    lessons: Array.isArray(seed.lessons) && seed.lessons.length > 0 ? seed.lessons : [makeLesson()],
});

const CourseEditPage = () => {
    const params = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const { user } = useUser();

    const sectionId = params.id;
    const courseId = params.courseId;
    const backPath = location.state?.from || (sectionId ? `/educations/${sectionId}` : '/educations');
    const backLabel = getCourseEditBackLabel(location.state?.from, courseId);
    const role = useMemo(() => localStorage.getItem('role') || 'user', []);

    const [course, setCourse] = useState(null);
    const [courseTitle, setCourseTitle] = useState('');
    const [courseDescription, setCourseDescription] = useState('');
    const [chapters, setChapters] = useState([makeChapter()]);

    const initialIdsRef = useRef({ chapterIds: new Set(), lessonsByChapter: new Map() });

    const [fetchAll, isLoading, error] = useFetching(async (sId, cId) => {
        const courseResp = await educationService.getCoursesById(sId, cId);
        const courseData = courseResp.data;
        setCourse(courseData);
        setCourseTitle(courseData?.title ?? '');
        setCourseDescription(courseData?.description ?? '');

        const nestedChapters = Array.isArray(courseData?.chapters) ? courseData.chapters : null;
        const chList = nestedChapters != null ? nestedChapters : (() => {
            // fallback if backend doesn't include nesting
            return [];
        })();

        const built = [];
        const chapterIds = new Set();
        const lessonsByChapter = new Map();

        for (const ch of chList) {
            chapterIds.add(Number(ch.id));
            const lsList = Array.isArray(ch?.lessons) ? ch.lessons : [];

            const lessonIds = new Set();
            const lessonsBuilt = [];
            for (const ls of lsList) {
                lessonIds.add(Number(ls.id));
                const detail = ls;

                let quiz = null;
                let quizIdOriginal = null;
                try {
                    const byLessonResp = await educationService.getQuizByLesson({ lesson_id: detail.id });
                    const baseQuiz = byLessonResp?.data || null;
                    // some backends return `lesson` as id, or embed object
                    const lessonRef = baseQuiz.lesson?.id ?? baseQuiz.lesson;
                    if (baseQuiz?.id && String(lessonRef ?? '') === String(detail.id)) {
                        quizIdOriginal = baseQuiz.id;
                        const adminResp = await educationService.getQuizAdminDetail(baseQuiz.id);
                        const builder = mapAdminQuizToBuilder(adminResp.data);
                        quiz = { id: builder.id, questions: builder.questions };
                    }
                } catch (_) {
                    // quiz is optional; ignore
                }
                lessonsBuilt.push(makeLesson({
                    id: detail.id,
                    title: detail.title ?? '',
                    content: parseDoc(detail.content ?? ''),
                    images: [],
                    quiz,
                    quizIdOriginal,
                }));
            }

            lessonsByChapter.set(Number(ch.id), lessonIds);
            built.push(makeChapter({
                id: ch.id,
                title: ch.title ?? '',
                description: ch.description ?? '',
                lessons: lessonsBuilt.length > 0 ? lessonsBuilt : [makeLesson()],
            }));
        }

        initialIdsRef.current = { chapterIds, lessonsByChapter };
        setChapters(built.length > 0 ? built : [makeChapter()]);
    });

    useEffect(() => {
        if (sectionId != null && courseId != null) {
            fetchAll(sectionId, courseId);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [sectionId, courseId]);

    const allowed = canEditEntity({ entity: course, user, role });
    const isDraft = (course?.status ?? '').toLowerCase() === 'draft';

    const updateChapter = (id, updated) => setChapters(prev => prev.map(c => c.id === id ? updated : c));
    const removeChapter = (id) => setChapters(prev => prev.filter(c => c.id !== id));
    const moveChapter = (id, dir) => setChapters(prev => moveItem(prev, prev.findIndex(c => c.id === id), dir));

    const [isSaving, setIsSaving] = useState(false);
    const [saveError, setSaveError] = useState('');
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const validate = () => {
        if (!courseTitle.trim()) return 'Введите название курса';
        if (chapters.length === 0) return 'Добавьте хотя бы одну главу';

        for (let ci = 0; ci < chapters.length; ci++) {
            const ch = chapters[ci];
            const chNum = ci + 1;
            if (!String(ch.title || '').trim()) return `Глава ${chNum}: введите название`;
            if (!Array.isArray(ch.lessons) || ch.lessons.length === 0) return `Глава ${chNum} «${ch.title}»: добавьте хотя бы один урок`;
            for (let li = 0; li < ch.lessons.length; li++) {
                const ls = ch.lessons[li];
                const lsNum = li + 1;
                if (!String(ls.title || '').trim()) return `Глава ${chNum}, урок ${lsNum}: введите название урока`;
                if (!ls.content) return `Глава ${chNum}, урок ${lsNum} «${ls.title}»: добавьте содержимое урока`;
            }
        }
        return null;
    };

    const handleSave = async (sendToModeration = false) => {
        setSaveError('');
        setSaveSuccess(false);

        if (!allowed) {
            setSaveError('Недостаточно прав для редактирования');
            return;
        }

        const v = validate();
        if (v) {
            setSaveError(v);
            return;
        }

        setIsSaving(true);
        try {
            await educationService.changeCourse(sectionId, courseId, {
                title: courseTitle,
                description: courseDescription,
            });

            const initial = initialIdsRef.current;
            const currentChapterIds = new Set();
            const currentLessonIdsByChapter = new Map();

            // create/update chapters + lessons
            for (let ci = 0; ci < chapters.length; ci++) {
                const ch = chapters[ci];
                const chapterOrder = ci + 1;
                const isNewChapter = typeof ch.id === 'string' && ch.id.startsWith('l_');

                let chapterId = ch.id;
                if (isNewChapter) {
                    const chResp = await educationService.createChapter(sectionId, courseId, {
                        title: ch.title,
                        description: ch.description,
                        order: chapterOrder,
                    });
                    chapterId = chResp.data.id;
                    updateChapter(ch.id, { ...ch, id: chapterId });
                } else {
                    currentChapterIds.add(Number(chapterId));
                    await educationService.changeChapter(sectionId, courseId, chapterId, {
                        title: ch.title,
                        description: ch.description,
                        order: chapterOrder,
                    });
                }

                const currentLessonIds = new Set();
                for (let li = 0; li < ch.lessons.length; li++) {
                    const ls = ch.lessons[li];
                    const lessonOrder = li + 1;
                    const isNewLesson = typeof ls.id === 'string' && ls.id.startsWith('l_');

                    let effectiveLessonId = ls.id;
                    if (isNewLesson) {
                        const lsResp = await educationService.createLessons(sectionId, courseId, chapterId, {
                            title: ls.title || `Урок ${lessonOrder}`,
                            type: 'lecture',
                            content: ls.content ? JSON.stringify(ls.content) : '',
                            order: lessonOrder,
                        });
                        const newLessonId = lsResp.data.id;
                        effectiveLessonId = newLessonId;
                        updateChapter(ch.id, {
                            ...ch,
                            lessons: ch.lessons.map(x => x.id === ls.id ? { ...x, id: newLessonId } : x),
                        });
                    } else {
                        currentLessonIds.add(Number(ls.id));
                        effectiveLessonId = ls.id;
                        await educationService.changeLessons(sectionId, courseId, chapterId, ls.id, {
                            title: ls.title || `Урок ${lessonOrder}`,
                            type: 'lecture',
                            content: ls.content ? JSON.stringify(ls.content) : '',
                            order: lessonOrder,
                        });
                    }

                    // quizzes sync (per-lesson)
                    if (!ls.quiz && ls.quizIdOriginal) {
                        await educationService.deleteQuiz(ls.quizIdOriginal);
                    }

                    if (ls.quiz && Array.isArray(ls.quiz.questions) && ls.quiz.questions.length > 0) {
                        const quizTitle = `Тест: ${ls.title || `Урок ${lessonOrder}`}`;
                        let quizId = ls.quiz.id || ls.quizIdOriginal || null;

                        if (!quizId) {
                            const quizResp = await educationService.createQuiz({
                                title: quizTitle,
                                lesson: effectiveLessonId,
                                chapter: null,
                                passing_score: 60,
                                max_attempts: 3,
                                time_limit_minutes: null,
                                show_explanation_after: true,
                            });
                            quizId = quizResp.data.id;
                        } else {
                            await educationService.updateQuiz(quizId, {
                                title: quizTitle,
                                lesson: effectiveLessonId,
                                chapter: null,
                                passing_score: 60,
                                max_attempts: 3,
                                time_limit_minutes: null,
                                show_explanation_after: true,
                            });
                        }

                        // delete existing questions (only numeric ids) then recreate
                        const existingIds = (ls.quiz.questions || [])
                            .map(q => q.id)
                            .filter(id => typeof id === 'number' || (typeof id === 'string' && /^\d+$/.test(id)))
                            .map(id => Number(id));
                        for (const qId of existingIds) {
                            await educationService.deleteQuizQuestion(quizId, qId);
                        }
                        for (const q of ls.quiz.questions) {
                            await educationService.addQuizQuestion(quizId, buildQuestionPayload(q));
                        }
                    }
                }

                currentLessonIdsByChapter.set(Number(chapterId), currentLessonIds);
            }

            // deletions
            for (const prevChapterId of initial.chapterIds) {
                if (!currentChapterIds.has(prevChapterId)) {
                    await educationService.deleteChapter(sectionId, courseId, prevChapterId);
                }
            }
            for (const [prevChapterId, prevLessonIds] of initial.lessonsByChapter.entries()) {
                const current = currentLessonIdsByChapter.get(prevChapterId);
                for (const prevLessonId of prevLessonIds) {
                    if (!current || !current.has(prevLessonId)) {
                        await educationService.deleteLessons(sectionId, courseId, prevChapterId, prevLessonId);
                    }
                }
            }

            if (sendToModeration) {
                await educationService.sendToModerationCourse(sectionId, courseId);
            }

            // refresh initial snapshot to avoid accidental deletes next save
            const refreshedChaptersResp = await educationService.getChapters(sectionId, courseId);
            const refreshedChData = refreshedChaptersResp.data;
            const refreshedChList = Array.isArray(refreshedChData) ? refreshedChData : (refreshedChData?.results ?? []);
            const chapterIds = new Set(refreshedChList.map(x => Number(x.id)));
            const lessonsByChapter = new Map();
            for (const ch of refreshedChList) {
                const lsResp = await educationService.getLessons(sectionId, courseId, ch.id);
                const lsData = lsResp.data;
                const lsList = Array.isArray(lsData) ? lsData : (lsData?.results ?? []);
                lessonsByChapter.set(Number(ch.id), new Set(lsList.map(x => Number(x.id))));
            }
            initialIdsRef.current = { chapterIds, lessonsByChapter };

            setSaveSuccess(true);
            setTimeout(() => navigate(backPath), 900);
        } catch (e) {
            setSaveError(e?.response?.data?.detail || JSON.stringify(e?.response?.data) || 'Ошибка при сохранении');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteCourse = async () => {
        setSaveError('');
        setSaveSuccess(false);
        if (!allowed) {
            setSaveError('Недостаточно прав для удаления');
            return;
        }
        const ok = window.confirm('Удалить курс? Это действие необратимо.');
        if (!ok) return;
        setIsDeleting(true);
        try {
            await educationService.deleteCourse(sectionId, courseId);
            setTimeout(() => navigate(backPath), 200);
        } catch (e) {
            setSaveError(e?.response?.data?.detail || JSON.stringify(e?.response?.data) || 'Ошибка при удалении');
        } finally {
            setIsDeleting(false);
        }
    };

    if (isLoading && !course) {
        return (
            <div className="page-wrapper section-page-wrapper">
                <div className="education-section-page">
                    <div className="education-block__loader">
                        <Loader />
                    </div>
                </div>
            </div>
        );
    }

    if (error && !course) {
        return (
            <div className="page-wrapper section-page-wrapper">
                <div className="education-section-page">
                    <p className="education-block__error">Ошибка: {String(error)}</p>
                </div>
            </div>
        );
    }

    if (course && !allowed) {
        return (
            <div className="page-wrapper section-page-wrapper">
                <div className="education-section-page">
                    <div className="education-back-link-wrap">
                        <Link className="education-back-link" to={backPath}>
                            <span className="education-back-link__icon" aria-hidden="true">←</span>
                            Назад
                        </Link>
                    </div>
                    <p className="education-block__error">У вас нет прав редактировать этот курс.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="page-wrapper">
            <div className="education-back-link-wrap">
                <Link className="education-back-link" to={backPath}>
                    <span className="education-back-link__icon" aria-hidden="true">←</span>
                    {backLabel}
                </Link>
            </div>
            <div className="page-card">
                <h1 className="page-title">Редактирование курса</h1>

                {course?.status !== 'published' && course?.reject_comment && (
                    <div className="reject-comment-banner" style={{ marginBottom: 18 }}>
                        <span className="reject-comment-banner__icon">⚠</span>
                        <div className="reject-comment-banner__body">
                            <span className="reject-comment-banner__title">Причина отклонения</span>
                            <span className="reject-comment-banner__text">{course.reject_comment}</span>
                        </div>
                    </div>
                )}

                <div className="edu-create">
                    <div className="edu-create__course">
                        <input
                            className="edu-input edu-input--title"
                            placeholder="Название курса *"
                            value={courseTitle}
                            onChange={e => setCourseTitle(e.target.value)}
                        />
                        <textarea
                            className="edu-textarea"
                            placeholder="Описание курса (необязательно)"
                            rows={3}
                            value={courseDescription}
                            onChange={e => setCourseDescription(e.target.value)}
                        />

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
                                    onUpdate={(updated) => updateChapter(ch.id, updated)}
                                    onRemove={() => removeChapter(ch.id)}
                                />
                            ))}

                            <button
                                type="button"
                                className="edu-course-builder__add-chapter"
                                onClick={() => setChapters(prev => [...prev, makeChapter()])}
                            >
                                + Добавить главу
                            </button>
                        </div>
                    </div>

                    <div className="edu-create__footer">
                        {saveError && <p className="edu-create__error">{saveError}</p>}
                        {saveSuccess && <p className="edu-create__success">Сохранено!</p>}

                        <div
                            className="edu-create__footer-btns"
                            style={{ justifyContent: 'space-between', alignItems: 'flex-end', width: '100%' }}
                        >
                            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                                <button
                                    type="button"
                                    className="edu-create__save-btn"
                                    onClick={handleDeleteCourse}
                                    disabled={isSaving || isDeleting}
                                    style={{
                                        background: 'var(--color-danger, #e55)',
                                        color: '#fff',
                                    }}
                                >
                                    {isDeleting ? 'Удаляем...' : 'Удалить курс'}
                                </button>
                            </div>

                            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                                <button
                                    type="button"
                                    className={`edu-create__save-btn ${isDraft ? 'edu-create__save-btn--draft' : 'edu-create__save-btn--moderation'}`}
                                    onClick={() => handleSave(false)}
                                    disabled={isSaving || isDeleting}
                                >
                                    {isSaving ? 'Сохранение...' : 'Сохранить'}
                                </button>

                                <button
                                    type="button"
                                    className="edu-create__save-btn edu-create__save-btn--moderation"
                                    onClick={() => handleSave(true)}
                                    disabled={isSaving || isDeleting}
                                >
                                    {isSaving ? 'Отправка...' : 'Сохранить и отправить на модерацию'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const QuestionItem = ({ question: q, index: qi, onUpdate, onRemove }) => {
    const [collapsed, setCollapsed] = useState(false);

    const updateOption = (oId, patch) =>
        onUpdate({ options: q.options.map(o => o.id === oId ? { ...o, ...patch } : o) });

    const removeOption = (oId) =>
        onUpdate({ options: q.options.filter(o => o.id !== oId) });

    const addOption = () =>
        onUpdate({ options: [...q.options, makeOption()] });

    const typeLabel = q.type === 'single' ? 'Один ответ' : q.type === 'multiple' ? 'Несколько ответов' : 'Текстовый ответ';
    const preview = q.text ? q.text.slice(0, 50) + (q.text.length > 50 ? '…' : '') : `Вопрос ${qi + 1}`;

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
                    <button type="button" className="edu-quiz-builder__add-btn" onClick={() => addQuestion('multiple')}>+ Несколько ответов</button>
                    <button type="button" className="edu-quiz-builder__add-btn" onClick={() => addQuestion('string')}>+ Текстовый ответ</button>
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

const LessonRow = ({ lesson, index, total, onMove, onUpdate, onRemove }) => {
    const [expanded, setExpanded] = useState(false);
    const [quizOpen, setQuizOpen] = useState(false);
    const nextEditorImageIdRef = useRef(1);

    const hasQuiz = !!lesson.quiz;

    const handleImageAdd = (file) => {
        if (!file?.type?.startsWith('image/')) return null;
        const id = nextEditorImageIdRef.current++;
        const previewUrl = URL.createObjectURL(file);
        onUpdate({ ...lesson, images: [...(lesson.images || []), { id, file, previewUrl }] });
        return id;
    };

    const handleQuizChange = (quiz) => onUpdate({ ...lesson, quiz });
    const handleQuizRemove = () => { onUpdate({ ...lesson, quiz: null }); setQuizOpen(false); };

    return (
        <div className={`edu-lesson-row${expanded ? ' edu-lesson-row--open' : ''}`}>
            <div
                className="edu-lesson-row__header"
                onClick={() => setExpanded(v => !v)}
                role="button"
                tabIndex={0}
                onKeyDown={e => e.key === 'Enter' && setExpanded(v => !v)}
            >
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

            {expanded && (
                <div className="edu-lesson-row__body">
                    <label className="edu-label edu-label--required" style={{ marginBottom: 0 }}>Название урока</label>
                    <input
                        className="edu-input edu-input--title"
                        placeholder={`Название урока ${index + 1} *`}
                        value={lesson.title}
                        onChange={e => onUpdate({ ...lesson, title: e.target.value })}
                        onClick={e => e.stopPropagation()}
                    />
                    <label className="edu-label edu-label--required" style={{ marginBottom: 0 }}>Содержимое урока</label>
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

const ChapterBlock = ({ chapter, index, total, onMove, onUpdate, onRemove }) => {
    const updateLesson = (lessonId, updated) =>
        onUpdate({ ...chapter, lessons: chapter.lessons.map(l => l.id === lessonId ? updated : l) });

    const addLesson = () =>
        onUpdate({ ...chapter, lessons: [...chapter.lessons, makeLesson()] });

    const removeLesson = (lessonId) =>
        onUpdate({ ...chapter, lessons: chapter.lessons.filter(l => l.id !== lessonId) });

    const moveLesson = (lessonId, dir) =>
        onUpdate({
            ...chapter,
            lessons: moveItem(chapter.lessons, chapter.lessons.findIndex(l => l.id === lessonId), dir)
        });

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

export default CourseEditPage;

