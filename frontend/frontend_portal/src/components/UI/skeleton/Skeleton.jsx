import React from 'react';
import './Skeleton.css';

const SkeletonBlock = ({ width, height, radius, style, className = '' }) => (
    <div
        className={`skeleton-pulse ${className}`}
        style={{
            width: width || '100%',
            height: height || '16px',
            borderRadius: radius || '8px',
            ...style,
        }}
    />
);

export const PostItemSkeleton = () => (
    <div className="post skeleton-post">
        <div className="skeleton-post__cover">
            <SkeletonBlock height="172px" radius="0" />
        </div>
        <div className="skeleton-post__body">
            <SkeletonBlock width="80%" height="20px" style={{ marginBottom: 10 }} />
            <SkeletonBlock width="100%" height="14px" style={{ marginBottom: 6 }} />
            <SkeletonBlock width="60%" height="14px" />
        </div>
        <div className="skeleton-post__footer">
            <SkeletonBlock width="80px" height="28px" radius="999px" />
            <SkeletonBlock width="50px" height="28px" radius="999px" />
        </div>
    </div>
);

export const PostListSkeleton = ({ count = 6 }) => (
    <div className="posts-grid">
        {Array.from({ length: count }, (_, i) => (
            <PostItemSkeleton key={i} />
        ))}
    </div>
);

export const AccountPostSkeleton = () => (
    <div className="skeleton-account-post">
        <SkeletonBlock width="4px" height="100%" radius="2px" className="skeleton-account-post__accent" />
        <SkeletonBlock width="36px" height="36px" radius="10px" style={{ flexShrink: 0 }} />
        <div className="skeleton-account-post__body">
            <SkeletonBlock width="50px" height="14px" radius="999px" />
            <SkeletonBlock width="70%" height="16px" />
        </div>
        <SkeletonBlock width="16px" height="16px" radius="4px" />
    </div>
);

export const AccountPostListSkeleton = ({ count = 4 }) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {Array.from({ length: count }, (_, i) => (
            <AccountPostSkeleton key={i} />
        ))}
    </div>
);

export const SectionCardSkeleton = () => (
    <div className="skeleton-section">
        <SkeletonBlock height="4px" radius="0" />
        <div className="skeleton-section__body">
            <div className="skeleton-section__head">
                <SkeletonBlock width="44px" height="44px" radius="12px" style={{ flexShrink: 0 }} />
                <SkeletonBlock width="70%" height="20px" />
            </div>
            <SkeletonBlock width="100%" height="14px" style={{ marginTop: 10 }} />
            <SkeletonBlock width="90%" height="14px" style={{ marginTop: 6 }} />
            <SkeletonBlock width="50%" height="14px" style={{ marginTop: 6 }} />
        </div>
    </div>
);

export const SectionListSkeleton = ({ count = 4 }) => (
    <div className="posts-grid">
        {Array.from({ length: count }, (_, i) => (
            <SectionCardSkeleton key={i} />
        ))}
    </div>
);

export default SkeletonBlock;
