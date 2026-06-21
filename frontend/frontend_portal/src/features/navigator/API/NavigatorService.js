import api from "../../../API/api";

/**
 * API профориентационного навигатора (Модуль 4 ТЗ).
 * Метки организаций на карте Хабаровского края + справочники для фильтров.
 */
class NavigatorService {
    /**
     * Список меток для карты.
     * @param {{type?: string, industry?: string[], direction?: string[], search?: string}} filters
     */
    static async getOrganizations(filters = {}) {
        const params = new URLSearchParams();
        if (filters.type) params.append('type', filters.type);
        (filters.industry || []).forEach((slug) => params.append('industry', slug));
        (filters.direction || []).forEach((slug) => params.append('direction', slug));
        if (filters.search) params.append('search', filters.search);
        const response = await api.get(`organizations/?${params.toString()}`);
        return response;
    }

    /** Полная карточка метки по slug (описание, контакты, вакансии). */
    static async getOrganization(slug) {
        const response = await api.get(`organizations/${slug}/`);
        return response;
    }

    /** Справочник типов организаций (для фильтра). */
    static async getTypes() {
        const response = await api.get('organizations/types/');
        return response;
    }

    /** Справочник отраслей (для фильтра). */
    static async getIndustries() {
        const response = await api.get('industries/');
        return response;
    }

    /** Справочник направлений (для фильтра). */
    static async getDirections() {
        const response = await api.get('directions/');
        return response;
    }
}

export default NavigatorService;
