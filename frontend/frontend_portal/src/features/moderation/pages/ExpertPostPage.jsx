import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { useFetching } from '../../../hooks/useFetching';
import PostService from '../../posts/API/PostService';
import Loader from '../../../components/UI/loader/loader';
import ArticleViewer from '../../../components/UI/MyEditor/ArticleViewer';
import MyModal from '../../../components/UI/MyModal/MyModal';

const ExpertPostPage = () => {
    const params = useParams();
    const location = useLocation();
    const navigate = useNavigate();

    const [post, setPost] = useState({});
    const [tally, setTally] = useState(null);        // { approve, reject, total }
    const [voteLoading, setVoteLoading] = useState(false);
    const [error, setError] = useState('');
    const [toast, setToast] = useState('');

    const [rejectModalOpen, setRejectModalOpen] = useState(false);
    const [rejectComment, setRejectComment] = useState('');

    const backPath = location.state?.from || '/moderation';
    const backLabel = backPath === '/moderation' ? 'К экспертизе' : 'Назад';

    const [fetchPost, isLoading] = useFetching(async () => {
        const response = await PostService.getAllById(params.id);
        setPost(response.data);
    });

    useEffect(() => {
        fetchPost(params.id);
        // подгружаем текущие голоса экспертов (если уже кто-то голосовал)
        PostService.getPostExpertReviews(params.id)
            .then(res => setTally(res.data?.votes ?? null))
            .catch(() => {});
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [params.id]);

    const applyResult = (data) => {
        setTally(data?.votes ?? null);
        if (data?.decision === 'approved') {
            setToast('Одобрено экспертным советом');
            setTimeout(() => navigate('/moderation'), 1400);
        } else if (data?.decision === 'rejected') {
            setToast('Отклонено экспертным советом');
            setTimeout(() => navigate('/moderation'), 1400);
        } else {
            setToast(data?.detail || 'Голос учтён, ждём остальных экспертов');
            setTimeout(() => navigate('/moderation'), 1400);
        }
    };

    const vote = async (decision, comment = '') => {
        setError('');
        setVoteLoading(true);
        try {
            const response = await PostService.expertVotePost(post.id, decision, comment);
            applyResult(response.data);
        } catch (e) {
            setError(e?.response?.data?.detail || 'Не удалось сохранить голос');
        } finally {
            setVoteLoading(false);
        }
    };

    const handleApprove = () => vote('approve');

    const openRejectModal = () => {
        setRejectComment('');
        setRejectModalOpen(true);
    };

    const confirmReject = () => {
        setRejectModalOpen(false);
        vote('reject', rejectComment.trim());
    };

    return (
        <div className="page-wrapper section-page-wrapper">
            <div className="education-section-page">
                <div className="education-back-link-wrap">
                    <Link className="education-back-link" to={backPath}>
                        <span className="education-back-link__icon" aria-hidden="true">←</span>
                        {backLabel}
                    </Link>
                </div>

                {/* Панель эксперта */}
                <div className="mod-bar">
                    <div className="mod-bar__info">
                        <span className="mod-bar__label">Экспертная оценка</span>
                        {tally && (
                            <span className="mod-bar__author">
                                Голоса: за {tally.approve} · против {tally.reject}
                            </span>
                        )}
                    </div>
                    <div className="mod-bar__actions">
                        {error && <span className="mod-bar__error">{error}</span>}
                        <button
                            className="mod-bar__btn mod-bar__btn--reject"
                            onClick={openRejectModal}
                            disabled={voteLoading}
                        >
                            {voteLoading ? 'Обрабатываем...' : 'Отклонить'}
                        </button>
                        <button
                            className="mod-bar__btn mod-bar__btn--approve"
                            onClick={handleApprove}
                            disabled={voteLoading}
                        >
                            {voteLoading ? 'Обрабатываем...' : 'Принять'}
                        </button>
                    </div>
                </div>

                {/* Контент статьи */}
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

                {toast && <div className="mod-bar__toast">{toast}</div>}
            </div>

            <MyModal visible={rejectModalOpen} setVisible={setRejectModalOpen} width="520px">
                <div className="mod-reject-modal">
                    <h3 className="mod-reject-modal__title">Комментарий к отклонению</h3>
                    <textarea
                        className="mod-reject-modal__textarea"
                        placeholder="Почему статью стоит отклонить (необязательно)..."
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

export default ExpertPostPage;
