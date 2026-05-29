import { Node } from '@tiptap/core'
import { ReactNodeViewRenderer } from '@tiptap/react'
import MathComponent from './MathComponent'

export const MathNode = Node.create({
    name: 'math',

    group: 'inline',
    inline: true,
    atom: true,
    selectable: true,

    addAttributes() {
        return {
            latex: {
                default: '',
            },
        }
    },

    parseHTML() {
        return [
            {
                tag: 'span[data-type="math"]',
            },
        ]
    },

    renderHTML({ node }) {
        return [
            'span',
            {
                'data-type': 'math',
                'data-latex': node.attrs.latex,
            },
        ]
    },

    addNodeView() {

        return ReactNodeViewRenderer(MathComponent, {

        })
    },
})