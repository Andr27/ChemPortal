import React from "react";
import PostService from "../API/PostService";
import PostGet from "../components/PostGet";

const fetchNews = (limit, page) => PostService.getFeed(limit, page, 'news');

function News() {

    return (
        <div className="App">
            <PostGet
                fetchMethod={fetchNews}
                title="Новости"
                disableScroll="true"
                listPath="/news"
            />
        </div>
    );
}

export default News;
