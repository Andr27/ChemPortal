import { NodeViewWrapper } from '@tiptap/react'
import katex from 'katex'
import 'katex/dist/katex.min.css'
import { useState, useEffect, useRef } from 'react'

export default function MathInlineComponent({ node, updateAttributes, editor }) {
    const [editing, setEditing] = useState(false)
    const [value, setValue] = useState(node.attrs.latex)
    const inputRef = useRef(null)
    const containerRef = useRef(null)

    // Проверяем, можно ли редактировать
    const isEditable = editor?.isEditable ?? false

    useEffect(() => {
        if (!editing && containerRef.current) {
            try {
                katex.render(value || 'X', containerRef.current, {
                    throwOnError: false,
                    displayMode: false,
                })
            } catch (e) {
                containerRef.current.innerHTML = value
            }
        }

        if (editing && inputRef.current) {
            inputRef.current.focus()
        }
    }, [editing, value])

    const save = () => {
        updateAttributes({ latex: value })
        setEditing(false)
    }

    // Обработчик клика — работает только если редактор редактируемый
    const handleClick = () => {
        if (isEditable) {
            setEditing(true)
        }
    }

    return (
        <NodeViewWrapper
            as="span"
            style={{ cursor: isEditable ? 'pointer' : 'default' }}
            contentEditable={false}
            onClick={handleClick}
        >
            {editing ? (
                <input
                    ref={inputRef}
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    onBlur={save}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') save()
                    }}
                    style={{
                        border: 'none',
                        outline: 'none',
                        background: '#dbdbdb',
                        borderRadius: '6px',
                        padding: '2px 6px',
                        fontSize: '14px',
                    }}
                />
            ) : (
                <span ref={containerRef} />
            )}
        </NodeViewWrapper>
    )
}