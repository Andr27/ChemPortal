import React from "react";
import PostService from "../API/PostService";
import PostGet from "../components/PostGet";

const fetchVideos = (limit, page) => PostService.getFeed(limit, page, 'video');

function Videos() {

    return (
        <div className="App">
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
