import React, {useContext, useEffect, useMemo, useState} from 'react';
import InformationBoard from "../components/UI/InformationBoard/InformationBoard";
import {useUser} from "../hooks/useUser";
import Loader from "../components/UI/loader/loader";
import Mybutton from "../components/UI/button/Mybutton";
import MyModal from "../components/UI/MyModal/MyModal";
import ScrollableContainer from "../components/UI/ScrollableContainer/ScrollableContainer";
import PostGet from "../components/PostGet";
import UserService from "../API/UserService";
import {CreatorContext, ModeratorContext} from "../context";

const MyAccount = () => {
    const { user } = useUser();
    const {isModerator, setIsModerator} = useContext(ModeratorContext);
    const {isCreator, setIsCreator} = useContext(CreatorContext);
    const [modalContentType, setModalContentType] = useState(null);

    if (!user) {
        return (
            <div className="account-page">
                <div className="account-content" style={{alignItems: "center"}}>
                    <InformationBoard>
                        <h2>Личные данные:</h2>
                        <Loader />
                    </InformationBoard>
                </div>
            </div>
        );
    }

    return (
        <div className="account-page">
            <div className="account-content">
                <InformationBoard>
                    <h2>Личные данные:</h2>
                    <div>
                        <p><strong>Email:</strong> {user.email || 'Не указан'}</p>
                        <p><strong>Фамилия:</strong> {user.last_name || 'Не указано'}</p>
                        <p><strong>Имя:</strong> {user.first_name || 'Не указано'}</p>
                        <p><strong>Роль:</strong> {user.role || 'Пользователь'}</p>
                    </div>
                </InformationBoard>
            </div>
            {(isModerator || isCreator) &&(<>
            <div>
                <Mybutton onClick = {() => setModalContentType('draft')} style = {{ marginLeft: "auto", padding: 10, marginRight: 60}}>Мои черновики</Mybutton>
                <Mybutton onClick = {() => setModalContentType('published')} style = {{ marginLeft: "auto", padding: 10, }}>Мои публикации</Mybutton>
            </div>
            <MyModal visible={modalContentType !== null} setVisible={setModalContentType} width="700px" height="450px">
                {modalContentType === 'draft' ? <PostGet fetchMethods={[UserService.myDraftPosts, UserService.myRejectedPosts]} combineResults={true} title={'Мои черновики'} />
                    : null

                }
                {modalContentType === 'published' ? <PostGet fetchMethod={UserService.myPublishedPost} title={'Мои публикации'} />
                    : null
                }
            </MyModal>
            </>)}
        </div>
    );
};



export default MyAccount;