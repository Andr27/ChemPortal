import React from 'react';
import PostItem from "./PostItem";

const PostList = ({ posts, title, listPath = '/posts' }) => {
    return (
        <div>
            {title && (
                <h1 style={{textAlign: 'center'}}>
                    {title}
                </h1>
            )}
            <div className="posts-grid">
                {posts.map((post, index) =>
                    <PostItem
                        key={post.id || index}
                        number={index + 1}
                        post={post}
                        listPath={listPath}
                    />
                )}
            </div>
        </div>
    );
};

export default PostList;