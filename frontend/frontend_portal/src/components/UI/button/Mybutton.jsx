import React from 'react';
import classes from "./Mybutton.module.css";
const Mybutton = ({ children, className, ...props }) => {
    return (
        <button {...props} className={[classes.myBtn, className].filter(Boolean).join(' ')}>
            {children}
        </button>
    );
};

export default Mybutton;