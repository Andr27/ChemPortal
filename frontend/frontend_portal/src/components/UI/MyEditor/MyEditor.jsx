import React, { useEffect } from 'react';  // ← ВАЖНО: добавил useEffect
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import 'katex/dist/katex.min.css';
import cl from './MyEditor.module.css';
import { MathNode } from '../../Node/MathNode';
import { TabIndent } from '../../Node/TabIndent';
import { Index } from "../../Node/VideoEmbed";

const MenuBar = ({ editor }) => {  // ← MenuBar не использует content
    if (!editor) return null;

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

            <button onClick={() => editor.chain().focus().undo().run()} type="button">
                ↺
            </button>
            <button onClick={() => editor.chain().focus().redo().run()} type="button">
                ↻
            </button>
        </div>
    );
};

const MyEditor = ({ content, onChange, editable = true }) => {
    const editor = useEditor({
        extensions: [
            StarterKit,
            Placeholder.configure({
                placeholder: 'Напишите что-нибудь...\nДля добавления видео, просто вставьте ссылку.\nЧтоб написать формулу нажмите ƒx.',
            }),
            MathNode,
            TabIndent,
            Index,
        ],
        content: content,
        editable: editable,
        onUpdate: ({ editor }) => {
            onChange(editor.getJSON());
        },
    });

    // Обновляем контент редактора при изменении пропса content
    useEffect(() => {
        if (editor && content !== editor.getHTML()) {
            editor.commands.setContent(content || '');
        }
    }, [content, editor]);

    if (!editor) {
        return <div>Загрузка редактора...</div>;
    }

    return (
        <div className={cl['editor-container']}>
            {editable ? <MenuBar editor={editor} /> : null}
            <EditorContent editor={editor} />
        </div>
    );
};

export default MyEditor;