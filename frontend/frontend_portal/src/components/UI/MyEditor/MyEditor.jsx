import React, { useEffect, useMemo, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import 'katex/dist/katex.min.css';
import cl from './MyEditor.module.css';
import { MathNode } from '../../../features/posts/components/Node/MathNode';
import { TabIndent } from '../../../features/posts/components/Node/TabIndent';
import { Index } from "../../../features/posts/components/Node/VideoEmbed";
import { EditorImageNode } from "../../../features/posts/components/Node/EditorImage";
import api from "../../../API/api";

const normalizeEditorContent = (value) => {
    if (!value) return '';
    if (typeof value === 'string') {
        try {
            return JSON.parse(value);
        } catch {
            return value;
        }
    }
    return value;
};

const toAbsoluteUrl = (url) => {
    if (!url || typeof url !== "string") return "";
    if (/^https?:\/\//i.test(url)) return url;
    const base = api?.defaults?.baseURL || "";
    try {
        return new URL(url, base).toString();
    } catch {
        return url;
    }
};

const MenuBar = ({ editor, onAddImage }) => {
    const inputRef = useRef(null);
    if (!editor) return null;
    const canAddImage = typeof onAddImage === "function";

    const handlePhotoSelect = (event) => {
        const selectedFiles = Array.from(event.target.files || []);
        selectedFiles.forEach((file) => {
            const imageId = onAddImage?.(file);
            if (Number.isFinite(imageId)) {
                editor.chain().focus().setEditorImage({ imageId, width: 100 }).run();
            }
        });
        event.target.value = "";
    };

    return (
        <div className={cl['menu-bar']}>
            {/* Все кнопки форматирования */}
            <button
                onClick={() => editor.chain().focus().toggleBold().run()}
                className={editor.isActive('bold') ? cl['is-active'] : ''}
                type="button"
            >
                Жирный
            </button>
            <button
                onClick={() => editor.chain().focus().toggleItalic().run()}
                className={editor.isActive('italic') ? cl['is-active'] : ''}
                type="button"
            >
                Курсив
            </button>
            <button
                onClick={() => editor.chain().focus().toggleStrike().run()}
                className={editor.isActive('strike') ? cl['is-active'] : ''}
                type="button"
            >
                Зачёркнутый
            </button>
            <button
                onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                className={editor.isActive('heading', { level: 1 }) ? cl['is-active'] : ''}
                type="button"
            >
                H1
            </button>
            <button
                onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                className={editor.isActive('heading', { level: 2 }) ? cl['is-active'] : ''}
                type="button"
            >
                H2
            </button>
            <button
                onClick={() => editor.chain().focus().toggleBulletList().run()}
                className={editor.isActive('bulletList') ? cl['is-active'] : ''}
                type="button"
            >
                Список
            </button>
            <button
                onClick={() => editor.chain().focus().toggleOrderedList().run()}
                className={editor.isActive('orderedList') ? cl['is-active'] : ''}
                type="button"
            >
                Нумерованный список
            </button>
            <button
                onClick={() => editor.chain().focus().toggleBlockquote().run()}
                className={editor.isActive('blockquote') ? cl['is-active'] : ''}
                type="button"
            >
                Цитата
            </button>
            <button
                onClick={() =>
                    editor
                        .chain()
                        .focus()
                        .insertContent({ type: 'math', attrs: { latex: '' } })
                        .run()
                }
                type="button"
            >
                ƒx
            </button>

            {canAddImage ? (
                <>
                    <button type="button" onClick={() => inputRef.current?.click()}>
                        Фото
                    </button>
                    <input
                        ref={inputRef}
                        type="file"
                        accept="image/*"
                        multiple
                        style={{ display: "none" }}
                        onChange={handlePhotoSelect}
                    />
                </>
            ) : null}

            <div className={cl['history-controls']}>
                <button onClick={() => editor.chain().focus().undo().run()} type="button">
                    ↺
                </button>
                <button onClick={() => editor.chain().focus().redo().run()} type="button">
                    ↻
                </button>
            </div>
        </div>
    );
};

const MyEditor = ({ content, onChange, editable = true, images = [], onAddImage, borderless = false }) => {
    const imageResources = useMemo(() => {
        const byId = new Map();
        const orderedUrls = [];
        (images || []).forEach((item) => {
            const id = Number(item?.id);
            const rawUrl = item?.image || item?.url || item?.previewUrl || item?.src || "";
            const absoluteUrl = toAbsoluteUrl(rawUrl);
            if (absoluteUrl) orderedUrls.push(absoluteUrl);
            if (Number.isFinite(id) && absoluteUrl) byId.set(id, absoluteUrl);
        });
        return { byId, orderedUrls };
    }, [images]);

    const imageResourcesRef = useRef(imageResources);
    useEffect(() => {
        imageResourcesRef.current = imageResources;
    }, [imageResources]);

    const editor = useEditor({
        extensions: [
            StarterKit,
            Placeholder.configure({
                placeholder: 'Напишите что-нибудь...\nДля добавления видео, просто вставьте ссылку.\nЧтоб написать формулу нажмите ƒx.',
            }),
            MathNode,
            TabIndent,
            Index,
            EditorImageNode.configure({
                resolveImageUrl: (imageId) => {
                    const normalizedId = Number(imageId);
                    const directMatch = imageResourcesRef.current.byId.get(normalizedId);
                    if (directMatch) return directMatch;
                    if (Number.isFinite(normalizedId) && normalizedId > 0) {
                        return imageResourcesRef.current.orderedUrls[normalizedId - 1] || "";
                    }
                    return "";
                },
            }),
        ],
        content: normalizeEditorContent(content),
        editable: editable,
        onUpdate: ({ editor }) => {
            if (typeof onChange === 'function') {
                onChange(editor.getJSON());
            }
        },
    });

    // Обновляем контент только при реальном внешнем изменении, чтобы
    // не сбрасывать позицию курсора и не "прыгать" вниз на каждом вводе.
    useEffect(() => {
        if (!editor) return;

        const normalizedContent = normalizeEditorContent(content);

        if (typeof normalizedContent === 'string') {
            if (normalizedContent !== editor.getText()) {
                editor.commands.setContent(normalizedContent, false);
            }
            return;
        }

        const incomingJson = JSON.stringify(normalizedContent);
        const currentJson = JSON.stringify(editor.getJSON());
        if (incomingJson !== currentJson) {
            editor.commands.setContent(normalizedContent || '', false);
        }
    }, [content, editor]);

    if (!editor) {
        return <div>Загрузка редактора...</div>;
    }

    return (
        <div className={`${cl['editor-container']} ${borderless ? cl['editor-container--viewer'] : ''}`}>
            {editable ? <MenuBar editor={editor} onAddImage={onAddImage} /> : null}
            <EditorContent editor={editor} />
        </div>
    );
};

export default MyEditor;