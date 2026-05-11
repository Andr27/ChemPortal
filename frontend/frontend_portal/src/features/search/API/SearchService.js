import api from '../../../API/api';

class SearchService {
    static async globalSearch({ q, type = 'all', limit = 10, mode = 'fts' }) {
        return api.get('search/', {
            params: { q, type, limit, mode },
        });
    }
}

export default SearchService;
