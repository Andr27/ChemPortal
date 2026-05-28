import React from 'react';
import { useNavigate } from "react-router-dom";
import api from "../../../API/api";
import fallbackCover from "../../posts/img/image.png";
import { makeExcerpt } from "../../../utils/textExcerpt";

const toAbsoluteUrl = (url) => {
    if (!url || typeof url !== "string") return "";
    if (/^https?:\/\//i.test(url)) return url;
    try {
        return new URL(url, api?.defaults?.baseURL || "").toString();
    } catch {
        return url;
    }
};

const PostItem = (props) => {
    const navigate = useNavigate();
    const openPost = () => navigate(`/moderation/${props.post.id}`);

    const rawCover = props.post.image_main || props.post.main_image;
    const coverUrl = rawCover ? toAbsoluteUrl(rawCover) : fallbackCover;

    const excerpt = makeExcerpt(props.post.body, 15);

    return (
        <div
            className="post post--clickable"
            role="link"
            tabIndex={0}
            onClick={openPost}
            onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    openPost();
                }
            }}
        >
            {coverUrl ? (
                <div className="post__cover-top">
                    <img src={coverUrl} alt="" className={`post__cover-top-img${!rawCover ? " post__cover-top-img--fallback" : ""}`} />
                </div>
            ) : null}

            <div className="post__top">
                <div className="post__main">
                    <div className="post__header-row">
                        <div className="post__content">
                            {props.post.title}
                        </div>
                    </div>

                    <div className="post__excerpt">
                        {excerpt || "Краткое описание статьи."}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PostItem;