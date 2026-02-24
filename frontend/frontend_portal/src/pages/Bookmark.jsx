import React from "react";
import PostService from "../API/PostService";
import PostGet from "../components/PostGet";

function Bookmark() {

    return (
        <div className="App">
            <hr style={{ margin: "15px 0" }} />
            <PostGet
                fetchMethod={PostService.getBookmarks}
                title="Закладки"
                disableScroll = 'true'
            />
        </div>
    );
}

export default Bookmark;