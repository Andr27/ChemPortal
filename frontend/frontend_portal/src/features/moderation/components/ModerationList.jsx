import React from 'react';
import ModerationItem from "./ModerationItem";

const ModerationList = ({posts, title}) => {
    return (
        <div>
            {title && (
                <h1 style={{textAlign: 'center', marginBottom: 16}}>
                    {title}
                </h1>
            )}
            <div className="posts-grid">
                {posts.map((post, index) => (
                    <ModerationItem key={post.id || index} number={index + 1} post={post} />
                ))}
            </div>
        </div>
    );
};

export default ModerationList;