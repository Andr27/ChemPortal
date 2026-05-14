import React from "react";
import PostService from "../API/PostService";
import PostGet from "../components/PostGet";
import { Helmet } from 'react-helmet';

function Bookmark() {

    return (
        <div className="App">
            <Helmet>
                <title>Мои закладки</title>
            </Helmet>
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