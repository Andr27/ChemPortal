import React, { useEffect, useMemo, useRef, useState } from "react";
import cl from "./ShadcnImageUploader.module.css";
import MyModal from "../MyModal/MyModal";

const OUTPUT_WIDTH = 1280;
const OUTPUT_HEIGHT = 720;

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const getRenderGeometry = (natural, frame, zoom) => {
    if (!natural.width || !natural.height || !frame.width || !frame.height) return null;

    const baseScale = Math.max(frame.width / natural.width, frame.height / natural.height);
    const scale = baseScale * zoom;
    const renderedWidth = natural.width * scale;
    const renderedHeight = natural.height * scale;

    return {
        scale,
        renderedWidth,
        renderedHeight,
        minX: Math.min(0, frame.width - renderedWidth),
        maxX: 0,
        minY: Math.min(0, frame.height - renderedHeight),
        maxY: 0,
    };
};

const ShadcnImageUploader = ({ value, onChange, disabled = false }) => {
    const inputRef = useRef(null);
    const cropFrameRef = useRef(null);
    const cropImageRef = useRef(null);
    const previewFrameRef = useRef(null);
    const dragRef = useRef({ active: false, startX: 0, startY: 0, startPosX: 0, startPosY: 0 });

    const [previewUrl, setPreviewUrl] = useState("");
    const [cropVisible, setCropVisible] = useState(false);
    const [cropSourceUrl, setCropSourceUrl] = useState("");
    const [cropSourceName, setCropSourceName] = useState("");
    const [cropSourceType, setCropSourceType] = useState("image/jpeg");
    const [naturalSize, setNaturalSize] = useState({ width: 0, height: 0 });
    const [frameSize, setFrameSize] = useState({ width: 0, height: 0 });
    const [previewFrameSize, setPreviewFrameSize] = useState({ width: 0, height: 0 });
    const [zoom, setZoom] = useState(1);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isNewCrop, setIsNewCrop] = useState(false);

    useEffect(() => {
        if (!value) {
            setPreviewUrl("");
            return;
        }
        const objectUrl = URL.createObjectURL(value);
        setPreviewUrl(objectUrl);
        return () => URL.revokeObjectURL(objectUrl);
    }, [value]);

    useEffect(() => {
        if (!cropVisible) return;
        if (!cropFrameRef.current || !previewFrameRef.current) return;

        const updateSizes = () => {
            const cropRect = cropFrameRef.current?.getBoundingClientRect();
            const previewRect = previewFrameRef.current?.getBoundingClientRect();
            if (cropRect) setFrameSize({ width: Math.round(cropRect.width), height: Math.round(cropRect.height) });
            if (previewRect) setPreviewFrameSize({ width: Math.round(previewRect.width), height: Math.round(previewRect.height) });
        };

        updateSizes();
        window.addEventListener("resize", updateSizes);

        let observer = null;
        if (typeof ResizeObserver !== "undefined") {
            observer = new ResizeObserver(updateSizes);
            if (cropFrameRef.current) observer.observe(cropFrameRef.current);
            if (previewFrameRef.current) observer.observe(previewFrameRef.current);
        }

        return () => {
            window.removeEventListener("resize", updateSizes);
            if (observer) observer.disconnect();
        };
    }, [cropVisible]);

    const cropGeometry = useMemo(
        () => getRenderGeometry(naturalSize, frameSize, zoom),
        [naturalSize, frameSize, zoom]
    );

    useEffect(() => {
        if (!cropGeometry) return;

        if (isNewCrop) {
            const centeredX = (frameSize.width - cropGeometry.renderedWidth) / 2;
            const centeredY = (frameSize.height - cropGeometry.renderedHeight) / 2;
            setPosition({
                x: clamp(centeredX, cropGeometry.minX, cropGeometry.maxX),
                y: clamp(centeredY, cropGeometry.minY, cropGeometry.maxY),
            });
            setIsNewCrop(false);
            return;
        }

        setPosition((prev) => ({
            x: clamp(prev.x, cropGeometry.minX, cropGeometry.maxX),
            y: clamp(prev.y, cropGeometry.minY, cropGeometry.maxY),
        }));
    }, [cropGeometry, frameSize.width, frameSize.height, isNewCrop]);

    useEffect(() => {
        return () => {
            if (cropSourceUrl) URL.revokeObjectURL(cropSourceUrl);
        };
    }, [cropSourceUrl]);

    const closeCropModal = () => {
        setCropVisible(false);
        setNaturalSize({ width: 0, height: 0 });
        setFrameSize({ width: 0, height: 0 });
        setPreviewFrameSize({ width: 0, height: 0 });
        setZoom(1);
        setPosition({ x: 0, y: 0 });
        setIsNewCrop(false);
        if (cropSourceUrl) {
            URL.revokeObjectURL(cropSourceUrl);
            setCropSourceUrl("");
        }
    };

    const openCropModal = (file) => {
        if (!file || disabled) return;
        if (!file.type.startsWith("image/")) return;

        if (cropSourceUrl) URL.revokeObjectURL(cropSourceUrl);
        const objectUrl = URL.createObjectURL(file);
        setCropSourceUrl(objectUrl);
        setCropSourceName(file.name || "cover");
        setCropSourceType(file.type || "image/jpeg");
        setNaturalSize({ width: 0, height: 0 });
        setZoom(1);
        setPosition({ x: 0, y: 0 });
        setIsNewCrop(true);
        setCropVisible(true);
    };

    const handleInputChange = (event) => {
        const file = event.target.files?.[0];
        openCropModal(file);
        event.target.value = "";
    };

    const startDrag = (event) => {
        if (!cropGeometry) return;
        if (event.button !== 0) return;
        dragRef.current = {
            active: true,
            startX: event.clientX,
            startY: event.clientY,
            startPosX: position.x,
            startPosY: position.y,
        };
        event.preventDefault();
    };

    useEffect(() => {
        const onMove = (event) => {
            if (!dragRef.current.active || !cropGeometry) return;
            const deltaX = event.clientX - dragRef.current.startX;
            const deltaY = event.clientY - dragRef.current.startY;
            setPosition({
                x: clamp(dragRef.current.startPosX + deltaX, cropGeometry.minX, cropGeometry.maxX),
                y: clamp(dragRef.current.startPosY + deltaY, cropGeometry.minY, cropGeometry.maxY),
            });
        };

        const onUp = () => {
            dragRef.current.active = false;
        };

        window.addEventListener("mousemove", onMove);
        window.addEventListener("mouseup", onUp);
        return () => {
            window.removeEventListener("mousemove", onMove);
            window.removeEventListener("mouseup", onUp);
        };
    }, [cropGeometry]);

    const handleApplyCrop = () => {
        if (!cropGeometry || !cropImageRef.current || !frameSize.width || !frameSize.height) return;

        const sourceX = -position.x / cropGeometry.scale;
        const sourceY = -position.y / cropGeometry.scale;
        const sourceWidth = frameSize.width / cropGeometry.scale;
        const sourceHeight = frameSize.height / cropGeometry.scale;

        const canvas = document.createElement("canvas");
        canvas.width = OUTPUT_WIDTH;
        canvas.height = OUTPUT_HEIGHT;
        const context = canvas.getContext("2d");
        if (!context) return;

        context.drawImage(
            cropImageRef.current,
            sourceX,
            sourceY,
            sourceWidth,
            sourceHeight,
            0,
            0,
            OUTPUT_WIDTH,
            OUTPUT_HEIGHT
        );

        const outType = cropSourceType === "image/png" ? "image/png" : "image/jpeg";
        canvas.toBlob(
            (blob) => {
                if (!blob) return;
                const croppedFile = new File([blob], cropSourceName, { type: outType });
                onChange(croppedFile);
                closeCropModal();
            },
            outType,
            0.92
        );
    };

    const previewRatio = frameSize.width && previewFrameSize.width
        ? previewFrameSize.width / frameSize.width
        : 1;

    const previewImageStyle = cropGeometry
        ? {
            width: `${cropGeometry.renderedWidth * previewRatio}px`,
            height: `${cropGeometry.renderedHeight * previewRatio}px`,
            transform: `translate(${position.x * previewRatio}px, ${position.y * previewRatio}px)`,
        }
        : undefined;

    const cropImageStyle = cropGeometry
        ? {
            width: `${cropGeometry.renderedWidth}px`,
            height: `${cropGeometry.renderedHeight}px`,
            transform: `translate(${position.x}px, ${position.y}px)`,
        }
        : undefined;

    return (
        <div className={cl.uploader}>
            <div className={cl.header}>
                <span>Обложка</span>
                {value && !disabled && (
                    <button
                        type="button"
                        className={cl.clear}
                        onClick={() => onChange(null)}
                    >
                        Убрать
                    </button>
                )}
            </div>

            <div
                className={cl.dropzone}
                role="button"
                tabIndex={disabled ? -1 : 0}
                onClick={() => !disabled && inputRef.current?.click()}
                onKeyDown={(event) => {
                    if (!disabled && (event.key === "Enter" || event.key === " ")) {
                        event.preventDefault();
                        inputRef.current?.click();
                    }
                }}
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => {
                    event.preventDefault();
                    if (disabled) return;
                    const file = event.dataTransfer.files?.[0];
                    openCropModal(file);
                }}
            >
                <input
                    ref={inputRef}
                    type="file"
                    accept="image/*"
                    className={cl.hidden}
                    onChange={handleInputChange}
                    disabled={disabled}
                />

                {previewUrl ? (
                    <img src={previewUrl} alt="Превью обложки" className={cl.preview} />
                ) : (
                    <div className={cl.placeholder}>
                        Перетащите изображение сюда или нажмите для выбора
                    </div>
                )}
            </div>

            <MyModal visible={cropVisible} setVisible={closeCropModal} width="940px">
                <div className={cl.cropModal}>
                    <div className={cl.cropHeader}>
                        <h3 className={cl.cropTitle}>Настройка обложки</h3>
                        <p className={cl.cropSubtitle}>Перетащите изображение и выберите масштаб</p>
                    </div>

                    <div className={cl.cropBody}>
                        <div className={cl.cropStageWrap}>
                            <div
                                ref={cropFrameRef}
                                className={cl.cropFrame}
                                onMouseDown={startDrag}
                                role="presentation"
                            >
                                {cropSourceUrl ? (
                                    <img
                                        ref={cropImageRef}
                                        src={cropSourceUrl}
                                        alt="Настройка обложки"
                                        className={cl.cropImage}
                                        style={cropImageStyle}
                                        onLoad={(event) => {
                                            const { naturalWidth, naturalHeight } = event.currentTarget;
                                            setNaturalSize({ width: naturalWidth, height: naturalHeight });
                                        }}
                                        draggable={false}
                                    />
                                ) : null}
                            </div>

                            <div className={cl.zoomControls}>
                                <span>Масштаб</span>
                                <input
                                    type="range"
                                    min="1"
                                    max="2.5"
                                    step="0.01"
                                    value={zoom}
                                    onChange={(event) => setZoom(Number(event.target.value))}
                                />
                                <strong>{Math.round(zoom * 100)}%</strong>
                            </div>
                        </div>

                        <div className={cl.previewWrap}>
                            <div className={cl.previewLabel}>Пример карточки поста</div>
                            <div className={cl.previewPost}>
                                <div ref={previewFrameRef} className={cl.previewPostCover}>
                                    {cropSourceUrl ? (
                                        <img
                                            src={cropSourceUrl}
                                            alt="Пример итоговой обложки"
                                            className={cl.previewPostCoverImage}
                                            style={previewImageStyle}
                                            draggable={false}
                                        />
                                    ) : null}
                                </div>
                                <div className={cl.previewPostBody}>
                                    <div className={cl.previewPostTitle}>Заголовок статьи</div>
                                    <div className={cl.previewPostText}>
                                        Краткое описание статьи в пару строк, чтобы заинтересовать читателя.
                                    </div>
                                    <div className={cl.previewPostBottom}>
                                        <div className={cl.previewPostLikes}>
                                            <span className={cl.previewPostCircle} />
                                            <span className={cl.previewPostCircle} />
                                        </div>
                                        <div className={cl.previewPostViews}>👁 124</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className={cl.cropActions}>
                        <button type="button" className={cl.actionSecondary} onClick={closeCropModal}>
                            Отмена
                        </button>
                        <button type="button" className={cl.actionPrimary} onClick={handleApplyCrop}>
                            Применить
                        </button>
                    </div>
                </div>
            </MyModal>
        </div>
    );
};

export default ShadcnImageUploader;
