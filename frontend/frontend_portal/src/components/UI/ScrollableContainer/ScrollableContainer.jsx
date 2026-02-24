import React from 'react';
import cl from './ScrollableContainer.module.css'

const ScrollableContainer = ({children, maxHeight = '300px', isDisable =false}) => {
    return (
        <div className={isDisable ? '' : cl.ScrollableContainer} style={{ maxHeight }}>
            {children}
        </div>
    );
};

export default ScrollableContainer;