import {useMemo} from "react";

export const useSortedSection = (sections, sort) => {
    const sortedSections = useMemo(() => {
        if (!Array.isArray(sections)) {
            console.warn('useSortedPost: posts не является массивом', sections);
            return [];
        }

        if(sort) {
            return [...sections].sort((a, b) => a[sort].localeCompare(b[sort]));
        }
        return sections;
    }, [sort, sections]);

    return sortedSections;
}

export const useSection = (sections, sort, query) => {
    const sortedSections = useSortedSection(sections, sort);

    const sortedAndSearchedSections = useMemo(() => {
        if (!Array.isArray(sortedSections)) {
            console.warn('useSections: sortedSections не является массивом', sortedSections);
            return [];
        }

        const q = (query || '').toLowerCase();
        return sortedSections.filter(section =>
            (section.title || '').toLowerCase().includes(q)
        );
    }, [query, sortedSections]);

    return sortedAndSearchedSections;
}