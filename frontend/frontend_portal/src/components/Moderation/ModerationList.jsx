import React from 'react';
import PostItem from "../PostItem";
import ModerationItem from "./ModerationItem";

const ModerationList = ({posts, title}) => {
    if (!posts.length) {
        return (
            <h1 style={{ textAlign: "center" }}>
                Посты не найдёны!
            </h1>
        );
    }
    return (
        <div>
            <h1 style={{textAlign: 'center'}}>
                {title}
            </h1>
            {posts.map((post, index) =>
                <div>
                    <ModerationItem number = {index + 1} post={post} />
                </div>
            )}
        </div>
    );
};

export default ModerationList;