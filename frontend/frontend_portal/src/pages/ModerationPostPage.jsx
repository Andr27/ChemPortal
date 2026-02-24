import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from "react-router-dom";
import { useFetching } from "../hooks/useFetching";
import PostService from "../API/PostService";
import Loader from "../components/UI/loader/loader";
import Mybutton from "../components/UI/button/Mybutton";
import MyModal from "../components/UI/MyModal/MyModal";
import ArticleViewer from "../components/UI/MyEditor/ArticleViewer";

const ModerationPostPage = () => {
    const params = useParams();
    const [post, setPost] = useState({});
    const [apError, setApError] = useState("");
    const [loadingAp, setLoadingAp] = useState(false);
    const [loadingRe, setLoadingRe] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [modalMessage, setModalMessage] = useState('');

    const navigate = useNavigate();

    const [fetchModPostsById, isLoading, error] = useFetching(async () => {
        const response = await PostService.getAllById(params.id);
        setPost(response.data);
    });

    const approve = async (event) => {
        event.preventDefault();
        setApError('');
        setLoadingAp(true);

        try {
            const response = await PostService.approvePost(post.id);

            if (response.data && response.data.status === "approved post") {

                setModalMessage('Пост успешно принят!');
                setModalVisible(true);

                setTimeout(() => {
                    setModalVisible(false);
                    navigate('/moderation/');
                }, 1000);
            } else {
                // Неожиданный статус
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

    const reject = async (event) => {
        event.preventDefault();
        setApError('');
        setLoadingRe(true);

        try {
            const response = await PostService.rejectPost(post.id);

            if (response.data && response.data.status === "rejected post") {
                // Успех
                setModalMessage('Пост успешно отклонён!');
                setModalVisible(true);

                setTimeout(() => {
                    setModalVisible(false);
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

    useEffect(() => {
        fetchModPostsById(params.id);
    }, []);

    return (
        <div>
            {apError && (
                <div style={{
                    color: 'red',
                    marginBottom: 10,
                    padding: '10px',
                    border: '1px solid red',
                    borderRadius: '4px',
                    backgroundColor: '#ffeeee'
                }}>
                    {apError}
                </div>
            )}

            <div>
                {isLoading ? (
                    <Loader />
                ) : (
                    <ArticleViewer
                        articleContent={post.body}
                        articleTitle={post.title}
                    />
                )}
            </div>

            {/* Кнопки действий */}
            <div style={{ display: 'flex', marginTop: 20 }}>
                <Mybutton
                    onClick={approve}
                    style={{ marginRight: 50 }}
                    disabled={loadingAp || loadingRe}
                >
                    {loadingAp ? 'Подождите...' : 'Принять'}
                </Mybutton>

                <Mybutton
                    onClick={reject}
                    disabled={loadingAp || loadingRe}
                >
                    {loadingRe ? 'Подождите...' : 'Отклонить'}
                </Mybutton>
            </div>

            {/* Модальное окно с результатом */}
            <MyModal
                visible={modalVisible}
                setVisible={setModalVisible}
            >
                <div style={{ textAlign: 'center', padding: '20px' }}>
                    <h2 style={{ color: '#4CAF50' }}>{modalMessage}</h2>
                    <p>Перенаправление через 1 секунды...</p>
                </div>
            </MyModal>
        </div>
    );
};

export default ModerationPostPage;