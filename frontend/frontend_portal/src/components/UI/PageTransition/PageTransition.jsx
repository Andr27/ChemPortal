import React, { useRef, useEffect, useState } from 'react';
import './PageTransition.css';

const PageTransition = ({ children, locationKey }) => {
    const [show, setShow] = useState(true);
    const prevKey = useRef(locationKey);

    useEffect(() => {
        if (prevKey.current !== locationKey) {
            prevKey.current = locationKey;
            setShow(false);
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    setShow(true);
                });
            });
        }
    }, [locationKey]);

    return (
        <div className={show ? 'page-transition' : ''}>
            {children}
        </div>
    );
};

export default PageTransition;
