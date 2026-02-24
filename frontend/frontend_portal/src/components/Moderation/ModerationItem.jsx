import React from 'react';
import Mybutton from "../UI/button/Mybutton";
import {useNavigate} from "react-router-dom";
const PostItem = (props) => {
    const navigate = useNavigate()
    return (
        <div className="post">
            <div className="post__content">
                {props.post.title}
            </div>
            <div className="post__btns">
                <Mybutton onClick={() => navigate(`/moderation/${props.post.id}`)}>
                    Открыть
                </Mybutton>
            </div>
        </div>
    );
};

export default PostItem;