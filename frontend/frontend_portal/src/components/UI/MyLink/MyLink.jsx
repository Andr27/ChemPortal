import React from 'react';
import {NavLink} from "react-router-dom";
import cl from './MyLink.module.css'

const MyLink = ({className = '', ...props}) => {
    return (
        <NavLink
            className={({isActive}) =>
                `${cl.MyLink} ${isActive ? cl.MyLinkActive : ''} ${className}`.trim()
            }
            {...props}
        />
    );
};

export default MyLink;