import {useContext, useState} from 'react';
import {UserContext} from "../context";

export const useUser = () => {
    const {user, setUser} = useContext(UserContext);

    const updateUser = (newData) => {
        const updatedUser = {...user, ...newData};
        setUser(newData);
        localStorage.setItem("user", JSON.stringify(updatedUser));
    };
    const clearUser = () => {
        setUser(null);
        localStorage.removeItem("user");
    };

    return{
        user,
        updateUser,
        clearUser,
            isAuthenticated: !!user
    };
};
