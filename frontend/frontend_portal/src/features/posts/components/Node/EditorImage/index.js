import { Node } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import EditorImage from "./EditorImage";

export const EditorImageNode = Node.create({
    name: "editorImage",
    group: "block",
    atom: true,
    selectable: true,
    draggable: false,

    addOptions() {
        return {
            resolveImageUrl: () => "",
        };
    },

    addAttributes() {
        return {
            imageId: { default: null },
            width: { default: 100 },
            align: { default: "center" },
            offsetX: { default: 0 },
            offsetY: { default: 0 },
            offset: { default: null },
        };
    },

    parseHTML() {
        return [{ tag: "div[data-editor-image]" }];
    },

    renderHTML({ node }) {
        return [
            "div",
            {
                "data-editor-image": "true",
                "data-image-id": node.attrs.imageId,
                "data-width": node.attrs.width,
                "data-align": node.attrs.align,
                "data-offset-x": node.attrs.offsetX,
                "data-offset-y": node.attrs.offsetY,
            },
        ];
    },

    addNodeView() {
        return ReactNodeViewRenderer(EditorImage);
    },

    addCommands() {
        return {
            setEditorImage:
                (attrs) =>
                ({ commands }) =>
                    commands.insertContent({
                        type: this.name,
                        attrs: {
                            imageId: attrs?.imageId,
                            width: attrs?.width ?? 100,
                            align: attrs?.align ?? "center",
                            offsetX: attrs?.offsetX ?? 0,
                            offsetY: attrs?.offsetY ?? 0,
                        },
                    }),
        };
    },
});
