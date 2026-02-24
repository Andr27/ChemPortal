import React from 'react';
import { NodeViewWrapper } from '@tiptap/react';

const VideoEmbed = ({ node }) => {
    const {src, provider, videoId} = node.attrs;

    // Формируем iframe URL в зависимости от провайдера
    const getEmbedUrl = () => {
        switch (provider) {
            case 'youtube':
                return `https://www.youtube.com/embed/${videoId}`;
            case 'vimeo':
                return `https://player.vimeo.com/video/${videoId}`;
            case 'rutube':
                return `https://rutube.ru/play/embed/${videoId}`;
            case 'vk':
                return `https://vk.com/video_ext.php?oid=-${videoId.split('_')[0]}&id=${videoId.split('_')[1]}`;
            default:
                return src;
        }
    };

    return (
        <NodeViewWrapper className="video-embed">
            <div style={{
                position: 'relative',
                paddingBottom: '56.25%', // 16:9
                height: 0,
                marginBottom: '20px'
            }}>
                <iframe
                    src={getEmbedUrl()}
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        border: 'none',
                        borderRadius: '8px'
                    }}
                    allowFullScreen
                    allow="autoplay; encrypted-media; picture-in-picture"
                />
            </div>
        </NodeViewWrapper>
    );
}

export default VideoEmbed;