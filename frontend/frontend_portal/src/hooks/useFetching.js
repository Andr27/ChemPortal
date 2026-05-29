import {useState} from "react";

export const useFetching = (callback) => {
    const [isLoading, setIsLoading] = useState(false);
    const [error] = useState('');

    const fetching = async (...args) => {
        try {
            setIsLoading(true)
            await callback(...args);
        } catch (e) {
            setIsLoading(e.message);
        } finally {
            setIsLoading(false)
        }
    }
    return [fetching, isLoading, error];
}