import React from "react";
import PostService from "../API/PostService";
import PostGet from "../components/PostGet";
import {Helmet} from "react-helmet";

const fetchVideos = (limit, page) => PostService.getFeed(limit, page, 'video');

function Videos() {

    return (
        <div className="App">
            <Helmet>
                <title>Видео</title>
            </Helmet>
            <PostGet
                fetchMethod={fetchVideos}
                title="Видео"
                disableScroll="true"
                listPath="/videos"
            />
        </div>
    );
}

export default Videos;
