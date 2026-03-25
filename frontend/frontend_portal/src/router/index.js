import About from "../features/posts/pages/About";
import Posts from "../features/posts/pages/Posts";
import PostsPage from "../features/posts/pages/PostsPage";
import Login from "../features/Login/pages/login";
import MyAccount from "../features/account/pages/MyAccount";
import Moderation from "../features/posts/pages/Moderation";
import moderationPostPage from "../features/posts/pages/ModerationPostPage";
import ModerationCourseViewPage from "../features/posts/pages/ModerationCourseViewPage";
import ConfirmEmail from "../features/Login/pages/ConfirmEmail";
import CreateForm from "../features/posts/pages/CreateForm";
import RefreshPassword from "../features/Login/pages/RefreshPassword";
import Bookmark from "../features/posts/pages/Bookmark";
import News from "../features/posts/pages/News";
import Videos from "../features/posts/pages/Videos";
import Feed from "../features/posts/pages/Feed";
import TagPostsPage from "../features/posts/pages/TagPostsPage";
import Sections from "../features/educations/pages/sections";
import SectionPage from "../features/educations/pages/sectionPage";
import SectionMaterialsPage from "../features/educations/pages/sectionMaterialsPage";
import SectionCoursesPage from "../features/educations/pages/sectionCoursesPage";
import CoursePage from "../features/educations/pages/coursePage";
import CourseProgress from "../features/educations/pages/courseProgress";
import MyEnrollmentsPage from "../features/educations/pages/myEnrollments";
import LessonPage from "../features/educations/pages/lessonPage";
import QuizPage from "../features/educations/pages/quizPage";
import CertificatePage from "../features/educations/pages/certificatePage";
import MaterialPage from "../features/educations/pages/materialPage";
import CategoryPage from "../features/educations/pages/categoryPage";
import CourseEditPage from "../features/educations/pages/courseEditPage";
import MaterialEditPage from "../features/educations/pages/materialEditPage";


export const privateRoutes = [
    /*{path: '/about', element: About},*/
    //Лента
    {path: '/feed', element: Feed},
    //Посты
    {path: '/posts', element: Posts},
    {path: '/posts/:id', element: PostsPage},
    {path: '/bookmarks', element: Bookmark},
    {path: '/news', element: News},
    {path: '/videos', element: Videos},
    {path: '/tags/:slug', element: TagPostsPage},
    //Аккаунт
    {path: '/account', element: MyAccount},
    //Образовательный раздел
    {path: '/educations/my-courses', element: MyEnrollmentsPage},
    {path: '/educations/categories/:slug', element: CategoryPage},
    {path: '/educations', element:Sections},
    {path: '/educations/:id', element:SectionPage},
    {path: '/educations/:id/materials/:materialId', element: MaterialPage},
    {path: '/educations/:id/materials/:materialId/edit', element: MaterialEditPage},
    {path: '/educations/:id/materials', element:SectionMaterialsPage},
    {path: '/educations/:id/courses/:courseId', element: CoursePage},
    {path: '/educations/:id/courses/:courseId/edit', element: CourseEditPage},
    {path: '/educations/:id/courses/:courseId/progress/:enrollmentId', element: CourseProgress},
    {path: '/educations/:id/courses/:courseId/chapters/:chapterId/lessons/:lessonId', element: LessonPage},
    {path: '/educations/:id/courses/:courseId/chapters/:chapterId/lessons/:lessonId/quiz', element: QuizPage},
    {path: '/educations/certificates/:certificateNumber', element: CertificatePage},
    {path: '/educations/:id/courses', element:SectionCoursesPage},

]
export const moderationRoutes = [
    {path: '/moderation', element: Moderation},
    {path: '/moderation/:id/', element: moderationPostPage},
    {path: '/moderation/courses/:courseId', element: ModerationCourseViewPage},
];

export const creatorRoutes = [
    {path: '/create/post', element: CreateForm},
]
export const publicRoutes = [
    /*{path: '/about', element: About},*/
    //Лента
    {path: '/feed', element: Feed},
    //Посты
    {path: '/posts', element: Posts},
    {path: '/posts/:id', element: PostsPage},
    {path: '/news', element: News},
    {path: '/videos', element: Videos},
    {path: '/tags/:slug', element: TagPostsPage},
    //Логин
    {path: '/login', element: Login},
    {path: '/login/:token', element: Login},
    {path: '/confirm-email', element: ConfirmEmail},
    {path: '/reset-password', element: RefreshPassword},
    //Образовательный раздел
    {path: '/educations/my-courses', element: MyEnrollmentsPage},
    {path: '/educations/certificates/:certificateNumber', element: CertificatePage},
    {path: '/educations/categories/:slug', element: CategoryPage},
    {path: '/educations', element:Sections},
    {path: '/educations/:id', element:SectionPage},
    {path: '/educations/:id/materials/:materialId', element: MaterialPage},
    {path: '/educations/:id/materials', element:SectionMaterialsPage},
    {path: '/educations/:id/courses/:courseId', element: CoursePage},
    {path: '/educations/:id/courses', element:SectionCoursesPage},


]