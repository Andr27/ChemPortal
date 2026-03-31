import api from './api';

class UserService {
    static async getMyPosts(limit = 5, page = 1){
        const response = await api.get("posts/my_posts/", {
            params: {
                limit: limit,
                page: page,
            }
        });
        return response;
    }

    static async sendToModeration(id){
        const response = await api.post(`posts/${id}/send_to_moderation/`);
        return response;
    }

    static async createPost(postData){
        const response = await api.post("posts/", postData);
        return response;
    }

    static async myPublishedPost(limit = 5, page = 1){
        const response = await api.get(`posts/my_published_posts/`,{
            params: {
                limit: limit,
                page: page,
            }
        });
        return response;
    }
    static async myRejectedPosts(limit = 5, page = 1){
        const response = await api.get(`posts/my_rejected_posts/`, {
            params: {
                limit: limit,
                page: page,
            }
        });
        return response;
    }
    static async myDraftPosts(limit = 5, page = 1){
        const response = await api.get(`posts/my_draft_posts/`, {
            params: {
                limit: limit,
                page: page,
            }
        });
        return response;
    }

    static async LikesIDPost(id) {
        const response = await api.post(`posts/${id}/like/`);
        return response;
    }

    static async DisLikesIDPost(id) {
        const response = await api.post(`posts/${id}/dislike/`);
        return response;
    }

    static async ChengePost(id, title, body, type, tagIds = []) {
        const data = {
            'title': title,
            'body': `${body}`,
            'type': `${type}`
        };
        if (tagIds.length > 0) {
            data['tag_ids'] = tagIds;
        }
        const response = await api.put(`posts/${id}/`, data);
        return response;
    }

    static async DeletePost(id) {
        const response = await api.delete(`posts/${id}/`);
        return response;
    }

    static async AddComments(id, text) {
        const response = await api.post(`posts/${id}/comments/`, {
            text: text,
        });
        return response;
    }

    static async AddChildComments(id, text, parentId) {
        const response = await api.post(`posts/${id}/comments/`, {
            text: text,
            parent: parentId
        });
        return response;
    }

    static async DeleteComments(id, commentId) {
        const response = await api.delete(`posts/${id}/comments/${commentId}/`);
        return response;
    }

    static async ChangeComments(id, commentId, text) {
        const response = await api.put(`posts/${id}/comments/${commentId}/`, {
            text: text,
        });
        return response;
    }

    static async BookmarkPost(id) {
        const response = await api.post(`posts/${id}/bookmark/`);
        return response;
    }

    static async DellBookmarkPost(id) {
        const response = await api.post(`posts/${id}/unbookmark/`);
        return response;
    }

    static async SubscribeToAuthor(authorId) {
        const response = await api.post(`subscriptions/`, {
            author: authorId,
        });
        return response;
    }

    static async UnSubscribeToAuthor(authorId) {
        const response = await api.post(`subscriptions/unsubscribe/`, {
            author: authorId,
        });
        return response;
    }

    static async CreateAndSentToModeration(postData){
        const response = await api.post("posts/create_and_send_to_moderation/", postData);
        return response;
    }

}
export default UserService;