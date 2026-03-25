import React, {useEffect} from 'react';
import PostService from "../API/PostService";
import UserService from "../../../API/UserService";
import Mybutton from "../../../components/UI/button/Mybutton";
import {useUser} from "../../../hooks/useUser";

const AuthorCard = (props) => {
    const { user } = useUser();
    const [loading, setLoading] = React.useState(false);
    const [authorInfo, setAuthorInfo] = React.useState(null);
    const [subscribed, setSubscribed] = React.useState(props.post.is_subscribed);

    const Subscribe = async () => {
        if (!authorInfo || !authorInfo.id) {
            return;
        }
        try {
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

    const formatCount = (count) => {
        const n = Math.abs(Number(count)) || 0;
        return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    };

    const getSubscribersLabel = (count) => {
        const n = Math.abs(Number(count)) || 0;
        const lastTwo = n % 100;
        const lastOne = n % 10;

        if (lastTwo >= 11 && lastTwo <= 14) {
            return 'подписчиков';
        }
        if (lastOne === 1) {
            return 'подписчик';
        }
        if (lastOne >= 2 && lastOne <= 4) {
            return 'подписчика';
        }
        return 'подписчиков';
    };

    const FetchAuthorInformation = async () => {
        if (!props.post || !props.post.author || !props.post.author.id) {
            return;
        }
        try {
            setLoading(true);
            const response = await PostService.getAuthorInformation(props.post.author.id);
            setAuthorInfo(response.data);
        } catch (error) {
            console.log(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        FetchAuthorInformation();
        // eslint-disable-next-line react-hooks/exhaustive-deps
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
                    <p>
                        <small>
                            {formatCount(authorInfo.subscribers_count)}{' '}
                            {getSubscribersLabel(authorInfo.subscribers_count)}
                        </small>
                    </p>
                    {user?.id && user.id !== authorInfo.id && (<Mybutton disabled={loading} onClick={Subscribe}>
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