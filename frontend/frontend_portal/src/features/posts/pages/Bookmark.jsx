import React from "react";
import PostService from "../API/PostService";
import PostGet from "../components/PostGet";

function Bookmark() {

    return (
        <div className="App">
            <PostGet
                fetchMethod={PostService.getBookmarks}
                title="Закладки"
                disableScroll="true"
                listPath="/bookmarks"
            />
        </div>
    );
}

export default Bookmark;