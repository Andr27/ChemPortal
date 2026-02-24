import React from 'react';
import Mybutton from "./UI/button/Mybutton";
import {useNavigate} from "react-router-dom";
import Likes from "./Likes";
import BookmarkPost from "./BookmarkPost";

const PostItem = (props) => {
    const navigate = useNavigate()
    return (
        <div className="post">
            <div className="post__content">
                {props.post.title}
            </div>
            <div className="post__btns">
                {props.post.status === "published" && <><Likes post={props.post}/><BookmarkPost post={props.post}/></>}
                <Mybutton onClick={() => navigate(`/posts/${props.post.id}`)}>
                    Открыть
                </Mybutton>
            </div>
        </div>
    );
};

export default PostItem;