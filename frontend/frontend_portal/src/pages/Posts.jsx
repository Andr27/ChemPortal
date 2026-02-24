import React from "react";
import PostService from "../API/PostService";
import PostGet from "../components/PostGet";

function Posts() {

    return (
        <div className="App">
            <hr style={{ margin: "15px 0" }} />
            <PostGet
                fetchMethod={PostService.getALL}
                title="Статьи"
                disableScroll = 'true'
            />
        </div>
    );
}

export default Posts;