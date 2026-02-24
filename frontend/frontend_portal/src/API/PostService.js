import axios from "axios";
import api from './api';

/*СИСТЕМНЫЕ АПИ*/
export default class PostService {
    static async getALL(limit = 10, page = 1) {
        const response = await api.get("posts/", {
            params: {
                limit: limit,
                page: page,
            }
        });
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

    static async rejectPost(id){
        const response = await api.post(`posts/${id}/reject/`);
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
}