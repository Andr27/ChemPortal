import React, { useState, useRef } from "react";
import { NodeViewWrapper } from "@tiptap/react";

const MIN_WIDTH_PERCENT = 20;
const MAX_WIDTH_PERCENT = 100;
const MIN_OFFSET_Y = 0;
const MAX_OFFSET_Y = 2000;

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const isControlTarget = (target) =>
    target?.closest?.(".editor-image-node__toolbar, .editor-image-node__resize");

const getOffsetBounds = (widthPercent, align) => {
    const safeWidth = clamp(Number(widthPercent) || 100, MIN_WIDTH_PERCENT, MAX_WIDTH_PERCENT);
    const freeSpace = Math.max(0, 100 - safeWidth);

    if (align === "left") return { min: 0, max: freeSpace };
    if (align === "right") return { min: -freeSpace, max: 0 };
    return { min: -(freeSpace / 2), max: freeSpace / 2 };
};

const EditorImage = ({ node, updateAttributes, editor, extension }) => {
    const wrapperRef = useRef(null);
    const [isDragging, setIsDragging] = useState(false);
    const isEditable = editor?.isEditable ?? false;

    const imageId = Number(node?.attrs?.imageId);
    const width = Number(node?.attrs?.width) || 100;
    const align = node?.attrs?.align || "center";
    const legacyOffset = Number(node?.attrs?.offset) || 0;
    const offsetX = Number(node?.attrs?.offsetX ?? legacyOffset) || 0;
    const offsetY = Number(node?.attrs?.offsetY) || 0;
    const src = extension?.options?.resolveImageUrl?.(imageId) || "";

    const onResizeStart = (event) => {
        if (!isEditable || !wrapperRef.current) return;
        event.preventDefault();
        event.stopPropagation();

        const editorRoot = wrapperRef.current.closest(".ProseMirror");
        const rootWidth = editorRoot?.clientWidth || 1;
        const startX = event.clientX;
        const startWidthPx = wrapperRef.current.getBoundingClientRect().width;
        const currentOffset = Number(node?.attrs?.offsetX ?? node?.attrs?.offset) || 0;

        const onMouseMove = (moveEvent) => {
            const deltaX = moveEvent.clientX - startX;
            const nextWidthPx = startWidthPx + deltaX;
            const nextWidthPercent = clamp(Math.round((nextWidthPx / rootWidth) * 100), MIN_WIDTH_PERCENT, MAX_WIDTH_PERCENT);
            const nextBounds = getOffsetBounds(nextWidthPercent, align);
            const nextOffsetX = clamp(currentOffset, nextBounds.min, nextBounds.max);
            updateAttributes({ width: nextWidthPercent, offsetX: nextOffsetX });
        };

        const onMouseUp = () => {
            window.removeEventListener("mousemove", onMouseMove);
            window.removeEventListener("mouseup", onMouseUp);
        };

        window.addEventListener("mousemove", onMouseMove);
        window.addEventListener("mouseup", onMouseUp);
    };

    const onMoveStart = (event, allowControlTarget = false) => {
        if (!isEditable || !wrapperRef.current) return;
        if (event.button !== 0) return;
        if (!allowControlTarget && isControlTarget(event.target)) return;
        event.preventDefault();
        event.stopPropagation();
        setIsDragging(true);

        const editorRoot = wrapperRef.current.closest(".ProseMirror");
        const rootWidth = editorRoot?.clientWidth || 1;
        const startX = event.clientX;
        const startY = event.clientY;
        const bounds = getOffsetBounds(width, align);
        const startOffsetX = clamp(offsetX, bounds.min, bounds.max);
        const startOffsetY = clamp(offsetY, MIN_OFFSET_Y, MAX_OFFSET_Y);

        const onMouseMove = (moveEvent) => {
            const deltaX = moveEvent.clientX - startX;
            const deltaY = moveEvent.clientY - startY;
            const deltaPercent = (deltaX / rootWidth) * 100;
            const nextOffsetX = clamp(Math.round(startOffsetX + deltaPercent), bounds.min, bounds.max);
            const nextOffsetY = clamp(Math.round(startOffsetY + deltaY), MIN_OFFSET_Y, MAX_OFFSET_Y);
            updateAttributes({ offsetX: nextOffsetX, offsetY: nextOffsetY });
        };

        const onMouseUp = () => {
            setIsDragging(false);
            window.removeEventListener("mousemove", onMouseMove);
            window.removeEventListener("mouseup", onMouseUp);
        };

        window.addEventListener("mousemove", onMouseMove);
        window.addEventListener("mouseup", onMouseUp);
    };

    const clampedWidth = clamp(width, MIN_WIDTH_PERCENT, MAX_WIDTH_PERCENT);
    const offsetBounds = getOffsetBounds(clampedWidth, align);
    const clampedOffsetX = clamp(offsetX, offsetBounds.min, offsetBounds.max);
    const clampedOffsetY = clamp(offsetY, MIN_OFFSET_Y, MAX_OFFSET_Y);
    const baseTop = 12 + clampedOffsetY;
    const wrapperStyle = { width: `${clampedWidth}%` };

    if (align === "left") {
        const leftShift = Math.max(0, clampedOffsetX);
        wrapperStyle.float = "left";
        wrapperStyle.margin = `${baseTop}px 14px 12px ${leftShift}%`;
    } else if (align === "right") {
        const rightShift = Math.max(0, -clampedOffsetX);
        wrapperStyle.float = "right";
        wrapperStyle.margin = `${baseTop}px ${rightShift}% 12px 14px`;
    } else {
        const freeSpace = Math.max(0, 100 - clampedWidth);
        const centerBase = freeSpace / 2;
        const centerShift = clamp(clampedOffsetX, -(freeSpace / 2), freeSpace / 2);
        wrapperStyle.margin = `${baseTop}px 0 12px ${centerBase + centerShift}%`;
    }

    const applyAlign = (nextAlign) => {
        const nextBounds = getOffsetBounds(clampedWidth, nextAlign);
        const safeOffsetX = clamp(clampedOffsetX, nextBounds.min, nextBounds.max);
        updateAttributes({ align: nextAlign, offsetX: safeOffsetX });
    };

    return (
        <NodeViewWrapper
            ref={wrapperRef}
            className={`editor-image-node${isEditable ? " editor-image-node--editable" : ""}`}
            contentEditable={false}
            draggable={false}
            data-align={align}
            data-dragging={isDragging ? "true" : "false"}
            style={wrapperStyle}
            onMouseDown={isEditable ? onMoveStart : undefined}
        >
            {src ? (
                <img src={src} alt={`Изображение ${imageId}`} className="editor-image-node__img" draggable={false} />
            ) : (
                <div className="editor-image-node__placeholder">
                    Изображение #{Number.isFinite(imageId) ? imageId : "?"} не найдено
                </div>
            )}

            {isEditable ? (
                <>
                    <div className="editor-image-node__toolbar">
                        <button type="button" className={`editor-image-node__tool ${align === "left" ? "is-active" : ""}`} onClick={() => applyAlign("left")} aria-label="Выравнивание влево">L</button>
                        <button type="button" className={`editor-image-node__tool ${align === "center" ? "is-active" : ""}`} onClick={() => applyAlign("center")} aria-label="Выравнивание по центру">C</button>
                        <button type="button" className={`editor-image-node__tool ${align === "right" ? "is-active" : ""}`} onClick={() => applyAlign("right")} aria-label="Выравнивание вправо">R</button>
                    </div>
                    <button type="button" className="editor-image-node__resize" onMouseDown={onResizeStart} aria-label="Изменить ширину изображения" />
                </>
            ) : null}
        </NodeViewWrapper>
    );
};

export default EditorImage;
