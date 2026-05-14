import React, { useState } from "react";
import PostService from "../API/PostService";
import PostGet from "../components/PostGet";

const TABS = [
    { key: 'all',     label: 'Все',     type: undefined },
    { key: 'article', label: 'Статьи',  type: 'article' },
    { key: 'news',    label: 'Новости', type: 'news' },
    { key: 'video',   label: 'Видео',   type: 'video' },
];

function Feed() {
    const [activeTab, setActiveTab] = useState('all');

    const current = TABS.find(t => t.key === activeTab) || TABS[0];

    const fetchFeed = (limit, page) => PostService.getFeed(limit, page, current.type);

    return (
        <div className="App">
            <div className="feed-tabs">
                {TABS.map(tab => (
                    <button
                        key={tab.key}
                        type="button"
                        className={`feed-tabs__btn${activeTab === tab.key ? ' feed-tabs__btn--active' : ''}`}
                        onClick={() => setActiveTab(tab.key)}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            <PostGet
                key={activeTab}
                fetchMethod={fetchFeed}
                title={current.label}
                disableScroll="true"
                listPath="/feed"
            />
        </div>
    );
}

export default Feed;
