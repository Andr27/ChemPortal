import { useMemo } from "react";

export const useSortedCourses = (courses, sort) => {
    return useMemo(() => {
        if (!Array.isArray(courses)) return [];
        if (!sort) return courses;
        return [...courses].sort((a, b) => (a[sort] || '').localeCompare(b[sort] || ''));
    }, [sort, courses]);
};

export const useCourses = (courses, sort, query) => {
    const sortedCourses = useSortedCourses(courses, sort);

    return useMemo(() => {
        if (!Array.isArray(sortedCourses)) return [];
        const q = (query || '').toLowerCase();
        if (!q) return sortedCourses;
        return sortedCourses.filter((item) =>
            (item.title || '').toLowerCase().includes(q) ||
            (item.description || '').toLowerCase().includes(q)
        );
    }, [query, sortedCourses]);
};
