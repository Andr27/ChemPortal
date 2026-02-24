import React, {useEffect, useState} from 'react';
import Myinput from "./UI/input/Myinput";
import Mybutton from "./UI/button/Mybutton";
import UserService from "../API/UserService";
import {useFetching} from "../hooks/useFetching";
import MySelect from "./UI/select/MySelect";
import MyEditor from "./UI/MyEditor/MyEditor";
import {useParams} from "react-router-dom";
import PostService from "../API/PostService";

const ChangePostForm = ({onSuccess}) => {
    const params = useParams();
    const [post, setPost] = useState({ body: '', title: '' });

    const [fetchPostsById, isLoading, error] = useFetching(async () => {
        const response = await PostService.getAllById(params.id);
        // Если body приходит как строка JSON, парсим
        const postData = response.data;
        if (typeof postData.body === 'string') {
            try {
                postData.body = JSON.parse(postData.body);
            } catch (e) {
                // Если не парсится, значит это обычный текст
                console.log('Body is plain text, keeping as is');
            }
        }
        setPost(postData);
    });

    useEffect(() => {
        fetchPostsById(params.id);
    }, []);

    const [updatePost, isLoadingCh, errorCh] = useFetching(async () => {
        await UserService.ChengePost(
            post.id,
            post.title,
            JSON.stringify(post.body),  // ← преобразуем JSON в строку
            post.type
        );
        if (onSuccess) onSuccess();
    });

    const ChangeOldPost = async (e) => {
        e.preventDefault();
        if (!post.title.trim() || !post.body) {
            alert('Заполните все поля!');
            return;
        }
        await updatePost();
    };

    const handleEditorChange = (content) => {
        console.log('Editor onChange:', content);
        setPost({...post, body: content});
    };

    return (
        <form onSubmit={ChangeOldPost}>
            <Myinput
                value={post.title}
                onChange={(e) => setPost({...post, title: e.target.value})}
                type="text"
                placeholder="Название поста"
                disabled={isLoadingCh}
            />

            <MyEditor
                content={post.body}
                onChange={handleEditorChange}
            />

            <MySelect
                value={post.type}
                onChange={(value) => setPost({...post, type: value})}
                defaultValue='Тип'
                options={[
                    { value: 'news', name: 'Новости' },
                    { value: 'article', name: 'Статья' },
                ]}
            />

            {errorCh && (
                <div style={{color: 'red', marginTop: '10px'}}>
                    Ошибка: {errorCh}
                </div>
            )}

            <Mybutton type="submit" disabled={isLoadingCh}>
                {isLoadingCh ? 'Изменение...' : 'Сохранить изменения'}
            </Mybutton>
        </form>
    );
};

export default ChangePostForm;