import api from '../../../API/api.js';

class AccountService {

    static async RequestCreatorRole (requestData) {
        const response = await api.post(`auth/creator-applications/apply/`, requestData);
        return response;
    }
// Модерация
    static async RequestRoleList () {
        const response = await api.get(`auth/creator-applications/applications_list/`)
        return response;
    }

    static async RequestApprove(requestData) {
        const response = await api.post(`auth/creator-applications/approve/`, requestData);
        return response;
    }

    static async RequestReject(requestData) {
        const response = await api.post(`auth/creator-applications/reject/`, requestData);
        return response;
    }

    static async MyApplication() {
        const response = await api.get(`auth/creator-applications/my_application/`);
        return response;
    }

    static async RequestDetail (applicationID) {
        const response = await api.get(`auth/creator-applications/${applicationID}/applications_detail/`);
        return response;
    }
}
export default AccountService;