import { useMemo } from "react";

export const useSortedMaterials = (materials, sort) => {
    return useMemo(() => {
        if (!Array.isArray(materials)) return [];
        if (!sort) return materials;
        return [...materials].sort((a, b) => (a[sort] || '').localeCompare(b[sort] || ''));
    }, [sort, materials]);
};

export const useMaterials = (materials, sort, query) => {
    const sortedMaterials = useSortedMaterials(materials, sort);

    return useMemo(() => {
        if (!Array.isArray(sortedMaterials)) return [];
        const q = (query || '').toLowerCase();
        if (!q) return sortedMaterials;
        return sortedMaterials.filter((item) =>
            (item.title || '').toLowerCase().includes(q) ||
            (item.description || '').toLowerCase().includes(q)
        );
    }, [query, sortedMaterials]);
};
