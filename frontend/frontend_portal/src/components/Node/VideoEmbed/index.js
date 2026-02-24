import { Node } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import VideoEmbedComponent from './VideoEmbed';


const urlPatterns = [
    // YouTube
    {
        provider: 'youtube',
        pattern: /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
    },
    // Rutube
    {
        provider: 'rutube',
        pattern: /rutube\.ru\/video\/([a-zA-Z0-9_-]+)/
    },
    // VK
    {
        provider: 'vk',
        pattern: /vk\.com\/video(-?\d+_\d+)/
    },
    // Vimeo
    {
        provider: 'vimeo',
        pattern: /vimeo\.com\/(\d+)/
    }
];

export const Index = Node.create({
    name: 'videoEmbed',

    group: 'block',

    atom: true,

    addAttributes() {
        return {
            src: {
                default: null,
            },
            provider: {
                default: null,
            },
            videoId: {
                default: null,
            },
            width: {
                default: '100%',
            },
            height: {
                default: 'auto',
            },
        };
    },

    parseHTML() {
        return [
            {
                tag: 'div[data-video-embed]',
            },
        ];
    },

    renderHTML({ node }) {
        return [
            'div',
            {
                'data-video-embed': '',
                'data-provider': node.attrs.provider,
                'data-video-id': node.attrs.videoId,
            },
        ];
    },

    addNodeView() {
        return ReactNodeViewRenderer(VideoEmbedComponent);
    },

    addCommands() {
        return {
            setVideoEmbed: (options) => ({ commands }) => {
                return commands.insertContent({
                    type: this.name,
                    attrs: options,
                });
            },
        };
    },

    addPasteRules() {
        return [
            {
                // Объединяем паттерны и добавляем флаг 'g' в конце
                find: new RegExp(urlPatterns.map(p => p.pattern.source).join('|'), 'g'),

                handler: ({ state, range, match }) => {
                    const { from, to } = range;

                    // match может быть null, если ничего не найдено
                    if (!match) return;

                    // Определяем какой провайдер подошел
                    const matchedProvider = urlPatterns.find((p, index) =>
                        match[index + 1] !== undefined
                    );

                    if (!matchedProvider) return;

                    // Находим первый не-null захват (это videoId)
                    const videoId = match.slice(1).find(m => m !== undefined);

                    state.tr.replaceRangeWith(
                        from,
                        to,
                        this.type.create({
                                src: match.input || match.string,
                            provider: matchedProvider.provider,
                            videoId: videoId,
                        })
                    );
                },
            },
        ];
    }
});