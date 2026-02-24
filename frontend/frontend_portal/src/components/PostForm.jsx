import React, {useState} from 'react';
import Myinput from "./UI/input/Myinput";
import Mybutton from "./UI/button/Mybutton";
import UserService from "../API/UserService";
import {useFetching} from "../hooks/useFetching";
import MySelect from "./UI/select/MySelect";
import MyEditor from "./UI/MyEditor/MyEditor";

const PostForm = ({onSuccess}) => {
    const [post, setPost] = useState({title: '', body: '', type: 'news'});

    const [createPost, isLoading, error] = useFetching(async () => {
        await UserService.createPost({
            body: JSON.stringify(post.body),  // ← JSON в строку
            title: post.title,
            type: post.type,
        });

        setPost({title: '', body: '', type: 'news'});
        if (onSuccess) onSuccess();
    });

    const addNewPost = async (e) => {
        e.preventDefault();
        if (!post.title.trim() || !post.body) {
            alert('Заполните все поля!');
            return;
        }
        await createPost();
    };

    const handleEditorChange = (content) => {
        setPost({...post, body: content});
    };

    return (
        <form onSubmit={addNewPost}>
            <Myinput
                value={post.title}
                onChange={(e) => setPost({...post, title: e.target.value})}
                type="text"
                placeholder="Название поста"
                disabled={isLoading}
            />

            <MyEditor
                content={post.body}
                onChange={handleEditorChange}  // ← просто передаём JSON
            />

            <MySelect
                value={post.type}
                onChange={(value) => setPost({...post, type: value})}
                defaultValue='Тип'
                options={[
                    { value: 'news', name: 'Новости' },
                    { value: 'article', name: 'Статья' },
                    { value: 'video', name: 'Видео' },
                    { value: 'link', name: 'Ссылка' },
                ]}
            />

            {error && (
                <div style={{color: 'red', marginTop: '10px'}}>
                    Ошибка: {error}
                </div>
            )}

            <Mybutton type="submit" disabled={isLoading}>
                {isLoading ? 'Сохранение...' : 'Сохранить пост'}
            </Mybutton>
        </form>
    );
};

export default PostForm;