import { Extension } from '@tiptap/core'

export const TabIndent = Extension.create({
    name: 'tabIndent',

    addKeyboardShortcuts() {
        return {
            Tab: () => {
                const { editor } = this
                if (editor.isActive('paragraph')) {
                    editor.commands.insertContent('    ')
                    return true
                }


                return false
            },

            'Shift-Tab': () => {
                const { editor } = this

                if (editor.isActive('paragraph')) {
                    return false
                }

                return false
            },
        }
    },
})