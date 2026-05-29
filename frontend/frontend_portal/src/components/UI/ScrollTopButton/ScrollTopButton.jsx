import React, { useEffect, useState } from "react";
import cl from "./ScrollTopButton.module.css";

const SHOW_AT = 320;
const MAIN_SCROLL_EVENT = "main-scroll";

const ScrollTopButton = () => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const handleWindowScroll = () => {
            setIsVisible((window.scrollY || 0) >= SHOW_AT);
        };
        const handleMainScroll = (e) => {
            const top = e?.detail?.scrollTop ?? 0;
            setIsVisible(top >= SHOW_AT);
        };
        handleWindowScroll();
        window.addEventListener("scroll", handleWindowScroll, { passive: true });
        window.addEventListener(MAIN_SCROLL_EVENT, handleMainScroll);
        return () => {
            window.removeEventListener("scroll", handleWindowScroll);
            window.removeEventListener(MAIN_SCROLL_EVENT, handleMainScroll);
        };
    }, []);

    const scrollToTop = () => {
        const main = document.querySelector(".layout__content");
        if (main) {
            main.scrollTo({ top: 0, behavior: "smooth" });
        } else {
            window.scrollTo({ top: 0, behavior: "smooth" });
        }
    };

    return (
        <button
            type="button"
            aria-label="Прокрутить вверх"
            className={`${cl.button} ${isVisible ? cl.buttonVisible : ""}`}
            onClick={scrollToTop}
        >
            <span className={cl.icon}>↑</span>
        </button>
    );
};

export default ScrollTopButton;
