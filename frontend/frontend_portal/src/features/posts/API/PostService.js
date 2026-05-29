import api from '../../../API/api';

/*СИСТЕМНЫЕ АПИ*/
export default class PostService {
    static async getALL(limit = 10, page = 1, tag) {
        const params = {
            limit,
            page,
        };
        if (tag) params.tag = tag;
        const response = await api.get("posts/", { params });
        return response;
    }

    static async getAllById(id){
        const response = await api.get(`posts/${id}/all_posts_detail/`);
        return response;
    }

    static async getCommentsByPostId(id){
        const response = await api.get(`posts/${id}/comments/`);
        return response;
    }
    /*МОДЕРАТОРСКИЕ АПИ*/

    static async getModerationList(limit = 10, page = 1) {
        const response = await api.get("posts/moderation_list/", {
            params: {
                limit: limit,
                page: page,
            }
        });
        return response;
    }


    static async approvePost(id){
        const response = await api.post(`posts/${id}/approve/`);
        return response;
    }

    static async rejectPost(id, comment){
        const response = await api.post(`posts/${id}/reject/`, { comment });
        return response;
    }

    static async getBookmarks(limit = 10, page = 1){
        const response = await api.get(`posts/bookmarks/`, {
            params: {
                limit: limit,
                page: page,
            }
        });
        return response;
    }

    static async getAuthorInformation(id){
        const response = await api.get(`auth/authors/${id}/`);
        return response;
    }

    static async getNews(limit = 10, page = 1, tag) {
        const params = {
            limit,
            page,
        };
        if (tag) params.tag = tag;
        const response = await api.get(`posts/news/`, { params });
        return response;
    }
    static async getVideos(limit = 10, page = 1, tag) {
        const params = {
            limit,
            page,
        };
        if (tag) params.tag = tag;
        const response = await api.get(`posts/videos/`, { params });
        return response;
    }

    static async getFeed(limit = 10, page = 1, type, tag) {
        const params = { limit, page };
        if (type) params.type = type;
        if (tag) params.tag = tag;
        const response = await api.get(`posts/feed/`, { params });
        return response;
    }

    static async getTags(limit = 100, page = 1) {
        const response = await api.get('tags/', {
            params: {
                limit,
                page,
            },
        });
        return response;
    }

    static async searchTags(search) {
        const response = await api.get('tags/', {
            params: { search },
        });
        return response;
    }

    static async getTagDetail(slug) {
        const response = await api.get(`tags/${slug}/`);
        return response;
    }

    static async toggleFavoriteTag(slug) {
        const response = await api.post(`tags/${slug}/favorite/`);
        return response;
    }

    static async getMyFavoriteTags() {
        const response = await api.get('tags/my_favorites/');
        return response;
    }

    static async suggestTagsByText(text) {
        const response = await api.post('tags/suggest/', { text });
        return response;
    }

    static async requestNewTag(name, reason) {
        const response = await api.post('tags/request_tag/', { name, reason });
        return response;
    }

    static async getTagRequests(status) {
        const params = status ? { status } : undefined;
        const response = await api.get('tags/request_list/', { params });
        return response;
    }

    static async approveTagRequest(requestId) {
        const response = await api.post('tags/approve_request/', { request_id: requestId });
        return response;
    }

    static async rejectTagRequest(requestId, comment) {
        const response = await api.post('tags/reject_request/', {
            request_id: requestId,
            comment,
        });
        return response;
    }

    static async updatePostTags(postId, tagIds) {
        const response = await api.put(`posts/${postId}/`, {
            tags: tagIds,
        });
        return response;
    }

    static async aiAnalyzePost(postId) {
        const response = await api.get(`posts/${postId}/ai_analyze/`);
        return response;
    }

}