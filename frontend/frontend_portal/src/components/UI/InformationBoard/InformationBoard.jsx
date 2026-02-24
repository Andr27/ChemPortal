import React from 'react';
import cl from './InformationBoard.module.css'

const InformationBoard = ({children}) => {
    return (
        <div className={cl.info_board}>
            {children}
        </div>
    );
};

export default InformationBoard;