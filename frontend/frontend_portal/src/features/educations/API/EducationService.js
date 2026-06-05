import api from "../../../API/api";

class EducationService {
    //categories
    static async getCategories() {
        const response = await api.get('categories/');
        return response;
    }

    static async getCategoryBySlug(slug) {
        const response = await api.get(`categories/${slug}/`);
        return response;
    }

    static async getCategorySections(slug) {
        const response = await api.get(`categories/${slug}/sections/`);
        return response;
    }

    static async createCategory(categoryData) {
        const response = await api.post('categories/', categoryData);
        return response;
    }

    //sections
    static async getSection(limit = 10, page = 1) {
        const response = await api.get("education/sections/", {
            params: {
                limit,
                page,
            }
        });
        return response;
    }

    static async getSectionById(id) {
        const response = await api.get(`education/sections/${id}/`);
        return response;
    }

    static async createSection(sectionData) {
        const response = await api.post(`education/sections/`, sectionData);
        return response;
    }

    static async createAndSendSectionToModeration(sectionData) {
        const response = await api.post(`education/sections/create_and_send_to_moderation/`, sectionData);
        return response;
    }

    static async changeSection(sectionId, sectionData) {
        const response = await api.put(`education/sections/${sectionId}/`, sectionData);
        return response;
    }

    static async deleteSection(sectionId) {
        const response = await api.delete(`education/sections/${sectionId}`);
        return response;
    }

    static async suggestSection(sectionId) {
        const response = await api.post(`education/sections/${sectionId}/send_to_moderation/`)
        return response;
    }

    //section_moderation
    static async approveSection(sectionId) {
        const response = await api.post(`education/sections/${sectionId}/approve/`);
        return response;
    }

    static async rejectSection(sectionId, comment) {
        const response = await api.post(`education/sections/${sectionId}/reject/`, { comment });
        return response;
    }

    static async requestedSection() {
        const response = await api.get("education/sections/moderation_list/");
        return response;
    }

    // my sections
    static async getMyDraftSections() {
        const response = await api.get("education/sections/my_draft_sections/");
        return response;
    }

    static async getMyPublishedSections() {
        const response = await api.get("education/sections/my_published_sections/");
        return response;
    }

    static async getMyRejectedSections() {
        const response = await api.get("education/sections/my_reject_sections/");
        return response;
    }


    //materials

    static async getSectionMaterials(limit = 10, page = 1, id) {
        const response = await api.get(`education/sections/${id}/materials/`, {
            params: {
                limit: limit,
                page: page,
            }
        });
        return response;
    }

    static async getMaterialsById(sectionId, id) {
        const response = await api.get(`education/sections/${sectionId}/materials/${id}/`);
        return response;
    }

    static async createMaterial(sectionId, materialData) {
        const response = await api.post(`education/sections/${sectionId}/materials/`, materialData);
        return response;
    }

    static async changeMaterial(sectionId, materialData) {
        const response = await  api.put(`education/sections/${sectionId}/materials/${materialData.id}/`, materialData);
        return response;
    }

    // update via POST (backend-specific)
    static async postChangeMaterial(sectionId, materialId, materialData) {
        const response = await api.post(`education/sections/${sectionId}/materials/${materialId}/`, materialData);
        return response;
    }

    static async deleteMaterial(sectionId, materialId) {
        const response = await api.delete(`education/sections/${sectionId}/materials/${materialId}`);
        return response;
    }


    //courses
    static async getSectionCourses(limit = 10, page = 1, id) {
        const response = await api.get(`education/sections/${id}/courses/`, {
            params: {
                limit,
                page,
            }
        });
        return response;
    }

    static async getCoursesById(sectionId, id) {
        const response = await api.get(`education/sections/${sectionId}/courses/${id}/`);
        return response;
    }

    static async createCourse(sectionId, courseData) {
        const response = await api.post(`education/sections/${sectionId}/courses/`, courseData);
        return response;
    }

    static async changeCourse(sectionId, courseId, courseData){
        const response = await api.put(`education/sections/${sectionId}/courses/${courseId}/`, courseData);
        return response;
    }

    // update via POST (backend-specific)
    static async postChangeCourse(sectionId, courseId, courseData){
        const response = await api.post(`education/sections/${sectionId}/courses/${courseId}/`, courseData);
        return response;
    }

    static async deleteCourse(sectionId, courseId) {
        const response = await api.delete(`education/sections/${sectionId}/courses/${courseId}`);
        return response;
    }

    static async sendToModerationCourse(sectionId, courseId) {
        const response = await api.post(`education/sections/${sectionId}/courses/${courseId}/send_to_moderation/`)
        return response;
    }

    static async createAndSendCourseToModeration(sectionId, courseData) {
        const response = await api.post(`education/sections/${sectionId}/courses/create_and_send_to_moderation/`, courseData);
        return response;
    }

    //course_moderation

    static async approveCourse(sectionId, courseId, courseData) {
        const response = await api.post(`education/sections/${sectionId}/courses/${courseId}/approve/`)
        return response;
    }
    static async rejectCourse(sectionId, courseId, comment) {
        const response = await api.post(`education/sections/${sectionId}/courses/${courseId}/reject/`, { comment });
        return response;
    }

    static async getModerationCourses(sectionId) {
        const response = await api.get(`education/sections/${sectionId}/courses/moderation_list/`)
        return response;
    }

    static async getModerationCoursesGlobal() {
        const response = await api.get(`education/courses/moderation_list/`);
        return response;
    }

    //courses - current user

    static async myDraftCourses(sectionId) {
        const response = await api.get(`education/sections/${sectionId}/courses/my_draft_courses/`);
        return response;
    }

    static async myPublishedCourses(sectionId) {
        const response = await api.get(`education/sections/${sectionId}/courses/my_published_courses/`);
        return response;
    }

    static async myRejectedCourses(sectionId) {
        const response = await api.get(`education/sections/${sectionId}/courses/my_reject_courses/`);
        return response;
    }

    //chapters

    static async getChapters(sectionId, courseId) {
        const response = await api.get(`education/sections/${sectionId}/courses/${courseId}/chapters/`);
        return response;
    }

    static async getChapterById(sectionId, courseId, id) {
        const response = await api.get(`education/sections/${sectionId}/courses/${courseId}/chapters/${id}/`)
        return response;
    }

    static async createChapter(sectionId, courseId, chapterData) {
        const response = await api.post(`education/sections/${sectionId}/courses/${courseId}/chapters/`, chapterData);
        return response;
    }

    static async changeChapter(sectionId, courseId, chapterId, chapterData) {
        const response = await api.put(`education/sections/${sectionId}/courses/${courseId}/chapters/${chapterId}/`, chapterData);
        return response;
    }

    // update via POST (backend-specific)
    static async postChangeChapter(sectionId, courseId, chapterId, chapterData) {
        const response = await api.post(`education/sections/${sectionId}/courses/${courseId}/chapters/${chapterId}/`, chapterData);
        return response;
    }

    static async deleteChapter(sectionId, courseId, chapterId) {
        const response = await api.delete(`education/sections/${sectionId}/courses/${courseId}/chapters/${chapterId}/`)
        return response;
    }

    //lessons
    static async getLessons(sectionId, courseId, chapterId) {
        const response = await api.get(`education/sections/${sectionId}/courses/${courseId}/chapters/${chapterId}/lessons/`);
        return response;
    }

    static async getLessonsById(sectionId, courseId,chapterId, id) {
        const response = await api.get(`education/sections/${sectionId}/courses/${courseId}/chapters/${chapterId}/lessons/${id}/`)
        return response;
    }

    static async createLessons(sectionId, courseId, chapterId, lessonData) {
        const response = await api.post(`education/sections/${sectionId}/courses/${courseId}/chapters/${chapterId}/lessons/`, lessonData);
        return response;
    }

    static async changeLessons(sectionId, courseId, chapterId, id, lessonData) {
        const response = await api.put(`education/sections/${sectionId}/courses/${courseId}/chapters/${chapterId}/lessons/${id}/`, lessonData);
        return response;
    }

    // update via POST (backend-specific)
    static async postChangeLessons(sectionId, courseId, chapterId, lessonId, lessonData) {
        const response = await api.post(`education/sections/${sectionId}/courses/${courseId}/chapters/${chapterId}/lessons/${lessonId}/`, lessonData);
        return response;
    }

    static async deleteLessons(sectionId, courseId, chapterId, id) {
        const response = await api.delete(`education/sections/${sectionId}/courses/${courseId}/chapters/${chapterId}/lessons/${id}/`)
        return response;
    }

    //enrollments

    // записаться на курс
    static async enrollCourse(courseId) {
        const response = await api.post('enrollments/enroll/', { course_id: courseId });
        return response;
    }

    // покинуть курс
    static async dropCourse(courseId) {
        const response = await api.post('enrollments/drop/', { course_id: courseId });
        return response;
    }

    // мои записи на курсы
    static async getMyEnrollments() {
        const response = await api.get('enrollments/my/');
        return response;
    }

    // детальный прогресс по записи
    static async getProgressMyCourses(enrollId) {
        const response = await api.get(`enrollments/${enrollId}/progress/`);
        return response;
    }

    // отметить урок завершённым
    static async completeLessons(enrollId, lessonId) {
        const response = await api.post(`enrollments/${enrollId}/complete_lesson/`, { lesson_id: lessonId });
        return response;
    }

    static async getNextLesson(courseId) {
        const response = await api.get(`enrollments/next_lesson/`, {
            params: { course_id: courseId }
        });
        return response;
    }

    static async getMyCertificates() {
        const response = await api.get(`enrollments/certificates/`);
        return response;
    }

    static async getCertificateDetail(number) {
        const response = await api.get(`enrollments/certificate_detail/`, {
            params: { number }
        });
        return response;
    }

    //tests (quizzes)

    static async getQuizzes(params = {}) {
        const response = await api.get(`quizzes/`, { params });
        return response;
    }

    // get quiz bound to lesson/chapter
    static async getQuizByLesson(params = {}) {
        const response = await api.get(`quizzes/by_lesson/`, { params });
        return response;
    }

    static async createQuiz(quizData) {
        const response = await api.post(`quizzes/`, quizData);
        return response;
    }

    static async getQuizById(quizId) {
        const response = await api.get(`quizzes/${quizId}/`);
        return response;
    }

    static async updateQuiz(quizId, quizData) {
        const response = await api.put(`quizzes/${quizId}/`, quizData);
        return response;
    }

    static async deleteQuiz(quizId) {
        const response = await api.delete(`quizzes/${quizId}/`);
        return response;
    }

    static async getModerationQuizzes() {
        const response = await api.get(`quizzes/moderation_list/`);
        return response;
    }

    // my quizzes
    static async getMyQuizzes() {
        const response = await api.get(`quizzes/my_quizzes/`);
        return response;
    }

    static async getMyDraftQuizzes() {
        const response = await api.get(`quizzes/my_draft_quizzes/`);
        return response;
    }

    static async getMyRejectedQuizzes() {
        const response = await api.get(`quizzes/my_rejected_quizzes/`);
        return response;
    }

    static async getMyPublishedQuizzes() {
        const response = await api.get(`quizzes/my_published_quizzes/`);
        return response;
    }

    static async getQuizAdminDetail(quizId) {
        const response = await api.get(`quizzes/${quizId}/admin_detail/`);
        return response;
    }

    // quiz questions
    static async addQuizQuestion(quizId, questionPayload) {
        const response = await api.post(`quizzes/${quizId}/add_question/`, questionPayload);
        return response;
    }

    static async updateQuizQuestion(quizId, questionId, questionPayload) {
        const response = await api.put(`quizzes/${quizId}/update_question/${questionId}/`, questionPayload);
        return response;
    }

    static async deleteQuizQuestion(quizId, questionId) {
        const response = await api.delete(`quizzes/${quizId}/delete_question/${questionId}/`);
        return response;
    }

    // quiz passing
    static async startQuiz(quizId) {
        const response = await api.post(`quizzes/${quizId}/start/`);
        return response;
    }

    static async getQuizHint(quizId, questionId) {
        const response = await api.get(`quizzes/${quizId}/hint/${questionId}/`);
        return response;
    }

    static async submitQuiz(quizId, answersPayload) {
        const response = await api.post(`quizzes/${quizId}/submit/`, answersPayload);
        return response;
    }

    static async getMyQuizResults(quizId) {
        const response = await api.get(`quizzes/${quizId}/my_results/`);
        return response;
    }

    static async getQuizStats(quizId) {
        const response = await api.get(`quizzes/${quizId}/stats/`);
        return response;
    }

    //Review

    static async leaveReviewCourse(reviewData){
        const response = await api.post(`enrollments/leave_review/`, reviewData);
        return response;
    }

    static async getReviewCourse(limit = 10, page = 1, courseId) {
        const response = await api.get(`enrollments/course_reviews/?course_id=${courseId}`, {
            params: {
                limit,
                page,
            }
        });
        return response;
    }

    static async getReviewTextCourse(limit = 10, page = 1, courseId) {
        const response = await api.get(`enrollments/course_reviews/?course_id=${courseId}&with_comment=true`, {
            params: {
                limit,
                page,
            }
        });
        return response;
    }

    static async getReviewSortUsefulCourse(limit = 10, page = 1, courseId) {
        const response = await api.get(`enrollments/course_reviews/?course_id=${courseId}&sort=useful`, {
            params: {
                limit,
                page,
            }
    });
        return response;
    }

    static async getCourseInfo(sectionId ,courseId) {
        const response = await api.get(`education/sections/${sectionId}/courses/${courseId}/stats/`)
        return response;
    }

    // lesson comments
    static async getLessonComments(sectionId, courseId, chapterId, lessonId) {
        return api.get(`education/sections/${sectionId}/courses/${courseId}/chapters/${chapterId}/lessons/${lessonId}/comments/`);
    }

    static async addLessonComment(sectionId, courseId, chapterId, lessonId, text) {
        return api.post(`education/sections/${sectionId}/courses/${courseId}/chapters/${chapterId}/lessons/${lessonId}/comments/`, { text });
    }

    static async deleteLessonComment(sectionId, courseId, chapterId, lessonId, commentId) {
        return api.delete(`education/sections/${sectionId}/courses/${courseId}/chapters/${chapterId}/lessons/${lessonId}/comments/${commentId}/`);
    }

    static async pinLessonComment(sectionId, courseId, chapterId, lessonId, commentId) {
        return api.post(`education/sections/${sectionId}/courses/${courseId}/chapters/${chapterId}/lessons/${lessonId}/comments/${commentId}/pin/`);
    }

    static async unpinLessonComment(sectionId, courseId, chapterId, lessonId, commentId) {
        return api.post(`education/sections/${sectionId}/courses/${courseId}/chapters/${chapterId}/lessons/${lessonId}/comments/${commentId}/unpin/`);
    }

    // JSON export/import
    static async exportCourseJson(sectionId, courseId) {
        const response = await api.get(`education/sections/${sectionId}/courses/${courseId}/export_json/`);
        return response;
    }

    static async importCourseJson(sectionId, jsonData) {
        const response = await api.post(`education/sections/${sectionId}/courses/import_json/`, jsonData);
        return response;
    }

    static async aiAnalyzeCourse(sectionId, courseId) {
        const response = await api.get(`education/sections/${sectionId}/courses/${courseId}/ai_analyze/`);
        return response;
    }

    /* ЭКСПЕРТНАЯ МОДЕРАЦИЯ КУРСОВ */
    // Очередь курсов для эксперта. На бэке эндпоинт вложен в раздел
    // (education/sections/{id}/courses/expert_queue/), но возвращает ВСЕ курсы
    // на модерации глобально, игнорируя id раздела. Поэтому берём id любого
    // существующего раздела, чтобы построить корректный URL.
    static async getCourseExpertQueue(limit = 10, page = 1) {
        const secRes = await api.get('education/sections/', { params: { limit: 1, page: 1 } });
        const secData = secRes.data;
        const sections = Array.isArray(secData) ? secData : (secData?.results ?? []);
        const anySectionId = sections[0]?.id;
        if (!anySectionId) {
            // нет ни одного раздела → курсов на модерации тоже нет
            return { data: { results: [], count: 0 } };
        }
        const response = await api.get(
            `education/sections/${anySectionId}/courses/expert_queue/`,
            { params: { limit, page } }
        );
        return response;
    }

    static async expertVoteCourse(sectionId, courseId, vote, comment = '') {
        const response = await api.post(
            `education/sections/${sectionId}/courses/${courseId}/expert_vote/`,
            { vote, comment }
        );
        return response;
    }

    static async getCourseExpertReviews(sectionId, courseId) {
        const response = await api.get(
            `education/sections/${sectionId}/courses/${courseId}/expert_reviews/`
        );
        return response;
    }
}
export default EducationService;