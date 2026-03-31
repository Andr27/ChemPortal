import React from "react";
import PostService from "../API/PostService";
import PostGet from "../components/PostGet";
import {Helmet} from "react-helmet";

const fetchArticles = (limit, page) => PostService.getFeed(limit, page, 'article');

function Posts() {

    return (
        <div className="App">
            <Helmet>
                <title>Статьи</title>
            </Helmet>
            <PostGet
                fetchMethod={fetchArticles}
                title="Статьи"
                disableScroll="true"
                listPath="/posts"
            />
        </div>
    );
}

export default Posts;
