import { useEffect, useRef } from "react";

export const useObserver = (ref, canLoad, isLoading, callback) => {
    const observer = useRef();

    useEffect(() => {
        if (observer.current) {
            observer.current.disconnect();
        }

        if (isLoading || !canLoad) return;

        const cb = function (entries) {
            if (entries[0].isIntersecting && canLoad && !isLoading) {
                callback();
            }
        };

        observer.current = new IntersectionObserver(cb);

        if (ref.current) {
            observer.current.observe(ref.current);
        }

        return () => {
            if (observer.current) {
                observer.current.disconnect();
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isLoading, canLoad, ref]);
};