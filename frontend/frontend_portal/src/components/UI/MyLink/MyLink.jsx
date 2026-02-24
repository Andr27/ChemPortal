import React from 'react';
import {Link} from "react-router-dom";
import cl from './MyLink.module.css'

const MyLink = (props) => {
    return (
            <Link className={cl.MyLink} {...props}/>
    );
};

export default MyLink;