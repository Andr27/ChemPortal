import React from 'react';
import cl from './MyModal.module.css'

/*
<MyModal
    visible={modalContentType !== null}
    setVisible={setModalContentType}
>

</MyModal>

<MyModal
    visible={modalContentType !== null}
    setVisible={setModalContentType}
    width="800px"
>

</MyModal>

<MyModal
    visible={modalContentType !== null}
    setVisible={setModalContentType}
    width="800px"
    height="600px"
>
</MyModal>
*/



const MyModal = ({ children, visible, setVisible, width, height }) => {
    const rootClasses = [cl.myModal];
    if (visible) {
        rootClasses.push(cl.active);
    }

    const contentStyle = {
        ...(width && { width }),
        ...(height && { height }),
    };

    return (
        <div
            className={rootClasses.join(' ')}
            onClick={() => setVisible(null)}
        >
            <div
                className={cl.myModalContent}
                style={contentStyle}
                onClick={(e) => e.stopPropagation()}
            >
                {children}
            </div>
        </div>
    );
};

export default MyModal;