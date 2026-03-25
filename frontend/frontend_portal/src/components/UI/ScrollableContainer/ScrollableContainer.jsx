import React, { useRef, useEffect } from 'react';
import cl from './ScrollableContainer.module.css'

const MAIN_SCROLL_EVENT = 'main-scroll';

const ScrollableContainer = ({
    children,
    maxHeight = '300px',
    isDisable = false,
    plainStyle = false,
}) => {
    const scrollRef = useRef(null);
    let style = {};

    if (!isDisable) {
        if (plainStyle) {
            style = { maxHeight, overflowY: 'auto', overflowX: 'hidden' };
        } else {
            style = { maxHeight };
        }
    }

    useEffect(() => {
        const el = scrollRef.current;
        if (!el || isDisable) return;
        const handler = () => {
            window.dispatchEvent(new CustomEvent(MAIN_SCROLL_EVENT, { detail: { scrollTop: el.scrollTop } }));
        };
        el.addEventListener('scroll', handler);
        handler();
        return () => el.removeEventListener('scroll', handler);
    }, [isDisable]);

    const className = isDisable ? '' : (plainStyle ? '' : cl.ScrollableContainer);

    return (
        <div ref={scrollRef} className={className} style={style}>
            {children}
        </div>
    );
};

export default ScrollableContainer;