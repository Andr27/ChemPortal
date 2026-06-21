import React, { useCallback } from 'react';
import {NavLink} from "react-router-dom";
import { prefetchRoute } from "../../../router";
import cl from './MyLink.module.css'

const MyLink = ({className = '', ...props}) => {
    const handleMouseEnter = useCallback(() => {
        // Prefetch чанк при наведении — переход будет мгновенным
        if (typeof props.to === 'string') {
            prefetchRoute(props.to);
        }
    }, [props.to]);

    return (
        <NavLink
            className={({isActive}) =>
                `${cl.MyLink} ${isActive ? cl.MyLinkActive : ''} ${className}`.trim()
            }
            onMouseEnter={handleMouseEnter}
            {...props}
        />
    );
};

export default MyLink;
