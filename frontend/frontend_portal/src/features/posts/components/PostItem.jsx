import React, { useContext } from 'react';
import { useNavigate } from "react-router-dom";
import Likes from "./Likes";
import BookmarkPost from "./BookmarkPost";
import { AuthContext } from "../../../context";
import eyeIcon from "../../../img/icon/eye-alt-svgrepo-com.svg";
import api from "../../../API/api";
import fallbackCover from "../img/image.png";
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

const truncateTitle = (title, maxWords = 10) => {
    if (!title) return '';
    const words = title.trim().split(/\s+/);
    if (words.length <= maxWords) return title;
    return words.slice(0, maxWords).join(' ') + '...';
};

const PostItem = (props) => {
    const navigate = useNavigate();
    const { isAuth } = useContext(AuthContext);
    const listPath = props.listPath || '/posts';
    const openPost = () => navigate(`/posts/${props.post.id}`, { state: { from: listPath } });

    const rawCover = props.post.image_main || props.post.main_image;
    const coverUrl = rawCover ? toAbsoluteUrl(rawCover) : fallbackCover;
    const isVideo = listPath === '/videos' || props.post.type === 'video' || props.post.post_type === 'video';

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
                    {props.post.status === "published" && isAuth && (
                        <div className="post__cover-bookmark" onClick={(e) => e.stopPropagation()}>
                            <BookmarkPost post={props.post} />
                        </div>
                    )}
                </div>
            ) : null}

            <div className="post__top">
                <div className="post__main">
                    <div className="post__header-row">
                        <div className="post__content" title={props.post.title}>
                            {truncateTitle(props.post.title)}
                        </div>
                    </div>

                    {!isVideo && (
                        <div className="post__excerpt">
                            {makeExcerpt(props.post.body, 15) || 'Здесь будет краткое описание статьи.'}
                        </div>
                    )}
                </div>
            </div>

            <div className="post__btns" onClick={(event) => event.stopPropagation()}>
                {props.post.status === "published" && isAuth && (
                    <Likes post={props.post} />
                )}
                <div className="post__actions-main">
                    <div className="post-views-chip" aria-label="Просмотры">
                        <span className="post-views-chip__icon" aria-hidden="true">
                            <img src={eyeIcon} alt="" className="post-views-chip__icon-img" />
                        </span>
                        <span>{props.post.views ?? props.post.views_count ?? 0}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PostItem;