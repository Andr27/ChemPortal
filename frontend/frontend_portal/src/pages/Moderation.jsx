
import React from "react";
import PostService from "../API/PostService";
import PostGet from "../components/PostGet";

function Moderation() {
    return (
        <div className="App">
            <hr style={{ margin: "15px 0" }} />
            <PostGet
                fetchMethod={PostService.getModerationList}
                title="Статьи статьи на модерации:"
                disableScroll = 'true'
                typeList='moderation'
            />
        </div>
    );
}

export default Moderation;