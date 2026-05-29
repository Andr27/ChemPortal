import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { useFetching } from "../../../hooks/useFetching";
import PostService from "../../posts/API/PostService";
import Loader from "../../../components/UI/loader/loader";
import ArticleViewer from "../../../components/UI/MyEditor/ArticleViewer";
import MyModal from "../../../components/UI/MyModal/MyModal";
import AiAnalysisPanel from "../components/AiAnalysisPanel";

const ModerationPostPage = () => {
    const params = useParams();
    const location = useLocation();
    const [post, setPost] = useState({});
    const [apError, setApError] = useState("");
    const [loadingAp, setLoadingAp] = useState(false);
    const [loadingRe, setLoadingRe] = useState(false);
    const [modToast, setModToast] = useState('');

    const [rejectModalOpen, setRejectModalOpen] = useState(false);
    const [rejectComment, setRejectComment] = useState('');

    const [aiData,    setAiData]    = useState(null);
    const [aiLoading, setAiLoading] = useState(false);
    const [aiError,   setAiError]   = useState('');
    const [aiVisible, setAiVisible] = useState(false);

    const navigate = useNavigate();
    const backPath = location.state?.from || '/moderation';
    const backLabel = backPath === '/moderation' ? 'К модерации' : 'Назад';

    const [fetchModPostsById, isLoading] = useFetching(async () => {
        const response = await PostService.getAllById(params.id);
        setPost(response.data);
    });

    const approve = async (event) => {
        event.preventDefault();
        setApError('');
        setLoadingAp(true);

        try {
            const response = await PostService.approvePost(post.id);

            if (response.data.detail === "Подтверждено") {
                setModToast('Статья одобрена и опубликована!');
                setTimeout(() => {
                    navigate('/moderation/');
                }, 1000);
            } else {
                setApError(`Не получилось принять: ${response.data?.status || 'неизвестный ответ'}`);
            }

        } catch (error) {
            console.log('Ошибка:', error);

            if (error.response && error.response.data) {
                setApError(`Ошибка: ${error.response.data.status || 'неизвестная ошибка'}`);
            } else {
                setApError('Произошла ошибка при принятии поста');
            }
        } finally {
            setLoadingAp(false);
        }
    };

    const openRejectModal = (event) => {
        event.preventDefault();
        setRejectComment('');
        setRejectModalOpen(true);
    };

    const confirmReject = async () => {
        setApError('');
        setLoadingRe(true);
        setRejectModalOpen(false);

        try {
            const response = await PostService.rejectPost(post.id, rejectComment.trim() || undefined);

            if (response.data.detail === "Отклонено") {
                setModToast('Статья отклонена.');
                setTimeout(() => {
                    navigate('/moderation/');
                }, 1000);
            } else {
                setApError(`Не получилось отклонить: ${response.data?.status || 'неизвестный ответ'}`);
            }

        } catch (error) {
            console.log('Ошибка:', error);

            if (error.response && error.response.data) {
                setApError(`Ошибка: ${error.response.data.status || 'неизвестная ошибка'}`);
            } else {
                setApError('Произошла ошибка при отклонении поста');
            }
        } finally {
            setLoadingRe(false);
        }
    };

    const handleAiAnalyze = async () => {
        if (aiVisible && aiData) { setAiVisible(false); return; }
        setAiVisible(true);
        setAiError('');
        setAiLoading(true);
        try {
            const response = await PostService.aiAnalyzePost(params.id);
            setAiData(response.data);
        } catch (e) {
            setAiError('Не удалось выполнить анализ');
        } finally {
            setAiLoading(false);
        }
    };

    useEffect(() => {
        fetchModPostsById(params.id);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [params.id]);

    return (
        <div className="page-wrapper section-page-wrapper">
            <div className="education-section-page">
                <div className="education-back-link-wrap">
                    <Link className="education-back-link" to={backPath}>
                        <span className="education-back-link__icon" aria-hidden="true">←</span>
                        {backLabel}
                    </Link>
                </div>

                {/* Панель модерации — как у курсов */}
                <div className="mod-bar">
                    <div className="mod-bar__info">
                        <span className="mod-bar__label">Режим модерации</span>
                    </div>
                    <div className="mod-bar__actions">
                        {apError && <span className="mod-bar__error">{apError}</span>}
                        <button
                            className="mod-bar__btn mod-bar__btn--ai"
                            onClick={handleAiAnalyze}
                            disabled={aiLoading}
                        >
                            {aiLoading ? 'Анализ...' : aiVisible ? 'Скрыть анализ' : 'ИИ-анализ'}
                        </button>
                        <button
                            className="mod-bar__btn mod-bar__btn--reject"
                            onClick={openRejectModal}
                            disabled={loadingAp || loadingRe}
                        >
                            {loadingRe ? 'Обрабатываем...' : 'Отклонить'}
                        </button>
                        <button
                            className="mod-bar__btn mod-bar__btn--approve"
                            onClick={approve}
                            disabled={loadingAp || loadingRe}
                        >
                            {loadingAp ? 'Обрабатываем...' : 'Одобрить'}
                        </button>
                    </div>
                </div>

                {/* ИИ-анализ */}
                {aiVisible && (
                    <AiAnalysisPanel
                        data={aiData}
                        loading={aiLoading}
                        error={aiError}
                    />
                )}

                {/* Белая карточка контента под mod-bar */}
                <div className="post-article-card" style={{ marginBottom: 24 }}>
                    {isLoading ? (
                        <Loader />
                    ) : (
                        <ArticleViewer
                            articleContent={post.body}
                            articleTitle={post.title}
                            images={post.images || []}
                        />
                    )}
                </div>

                {modToast && (
                    <div className="mod-bar__toast">{modToast}</div>
                )}
            </div>

            <MyModal
                visible={rejectModalOpen}
                setVisible={setRejectModalOpen}
                width="520px"
            >
                <div className="mod-reject-modal">
                    <h3 className="mod-reject-modal__title">Причина отклонения</h3>
                    <textarea
                        className="mod-reject-modal__textarea"
                        placeholder="Укажите причину отклонения (необязательно)..."
                        value={rejectComment}
                        onChange={(e) => setRejectComment(e.target.value)}
                        rows={4}
                    />
                    <div className="mod-reject-modal__actions">
                        <button
                            type="button"
                            className="mod-bar__btn mod-bar__btn--cancel"
                            onClick={() => setRejectModalOpen(false)}
                        >
                            Отмена
                        </button>
                        <button
                            type="button"
                            className="mod-bar__btn mod-bar__btn--reject"
                            onClick={confirmReject}
                        >
                            Отклонить
                        </button>
                    </div>
                </div>
            </MyModal>
        </div>
    );
};

export default ModerationPostPage;
