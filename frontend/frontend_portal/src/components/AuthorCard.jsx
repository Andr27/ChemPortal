import React, {useEffect} from 'react';
import PostService from "../API/PostService";
import UserService from "../API/UserService";
import Mybutton from "./UI/button/Mybutton";
import {useUser} from "../hooks/useUser";

const AuthorCard = (props) => {
    const { user } = useUser();
    const [loading, setLoading] = React.useState(false);
    const [authorInfo, setAuthorInfo] = React.useState(null);
    const [subscribed, setSubscribed] = React.useState(props.post.is_subscribed);

    const Subscribe = async () => {
        try {
            console.log(authorInfo.id);
            if (!subscribed) {
                setLoading(true);
                await UserService.SubscribeToAuthor(authorInfo.id)
                setSubscribed(true);
            } else {
                setLoading(true);
                await UserService.UnSubscribeToAuthor(authorInfo.id)
                setSubscribed(false)
            }
        } catch (error) {
            console.log(error);
        } finally {
            setLoading(false);
        }
    }

    const FetchAuthorInformation = async () => {
        try {
            setLoading(true);
            const response = await PostService.getAuthorInformation(props.post.author.id);
            setAuthorInfo(response.data);
        } catch (error) {
            console.log(error);
        } finally {
            setLoading(false);
        }
    }
    useEffect(() => {
        FetchAuthorInformation();
    }, [subscribed]);

    return (
        <div className="authorCard">
            {authorInfo ? (
                <>
                    <strong>
                        {authorInfo.last_name || authorInfo.first_name ? (
                            <>{authorInfo.last_name} {authorInfo.first_name}</>
                        ) : (
                            <>Автор #{authorInfo.id}</>
                        )}
                    </strong>
                    <p><small>Количество подписчиков: {authorInfo.subscribers_count}</small></p>
                    {user.id !== authorInfo.id && (<Mybutton disabled={loading} onClick={Subscribe}>
                        {loading ? '...' : (subscribed ? 'Отписаться' : 'Подписаться')}
                    </Mybutton>)}
                </>
            ) : (
                <div>Загрузка информации об авторе...</div>
            )}
        </div>
    );
};

export default AuthorCard;