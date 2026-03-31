import {lazy} from "react";

// 404
const NotFound = lazy(() => import("../features/posts/pages/NotFound"));

// Лента / Посты
const Feed = lazy(() => import("../features/posts/pages/Feed"));
const Posts = lazy(() => import("../features/posts/pages/Posts"));
const PostsPage = lazy(() => import("../features/posts/pages/PostsPage"));
const Bookmark = lazy(() => import("../features/posts/pages/Bookmark"));
const News = lazy(() => import("../features/posts/pages/News"));
const Videos = lazy(() => import("../features/posts/pages/Videos"));
const TagPostsPage = lazy(() => import("../features/posts/pages/TagPostsPage"));

// Авторизация
const Login = lazy(() => import("../features/Login/pages/login"));
const ConfirmEmail = lazy(() => import("../features/Login/pages/ConfirmEmail"));
const RefreshPassword = lazy(() => import("../features/Login/pages/RefreshPassword"));

// Аккаунт
const MyAccount = lazy(() => import("../features/account/pages/MyAccount"));

// Модерация
const Moderation = lazy(() => import("../features/posts/pages/Moderation"));
const ModerationPostPage = lazy(() => import("../features/posts/pages/ModerationPostPage"));
const ModerationCourseViewPage = lazy(() => import("../features/posts/pages/ModerationCourseViewPage"));

// Создание
const CreateForm = lazy(() => import("../features/posts/pages/CreateForm"));

// Образование
const Sections = lazy(() => import("../features/educations/pages/sections"));
const SectionPage = lazy(() => import("../features/educations/pages/sectionPage"));
const SectionMaterialsPage = lazy(() => import("../features/educations/pages/sectionMaterialsPage"));
const SectionCoursesPage = lazy(() => import("../features/educations/pages/sectionCoursesPage"));
const CoursePage = lazy(() => import("../features/educations/pages/coursePage"));
const CourseProgress = lazy(() => import("../features/educations/pages/courseProgress"));
const MyEnrollmentsPage = lazy(() => import("../features/educations/pages/myEnrollments"));
const LessonPage = lazy(() => import("../features/educations/pages/lessonPage"));
const QuizPage = lazy(() => import("../features/educations/pages/quizPage"));
const CertificatePage = lazy(() => import("../features/educations/pages/certificatePage"));
const MaterialPage = lazy(() => import("../features/educations/pages/materialPage"));
const CategoryPage = lazy(() => import("../features/educations/pages/categoryPage"));
const CourseEditPage = lazy(() => import("../features/educations/pages/courseEditPage"));
const MaterialEditPage = lazy(() => import("../features/educations/pages/materialEditPage"));


export const privateRoutes = [
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
    {path: '/educations', element: Sections},
    {path: '/educations/:id', element: SectionPage},
    {path: '/educations/:id/materials/:materialId', element: MaterialPage},
    {path: '/educations/:id/materials/:materialId/edit', element: MaterialEditPage},
    {path: '/educations/:id/materials', element: SectionMaterialsPage},
    {path: '/educations/:id/courses/:courseId', element: CoursePage},
    {path: '/educations/:id/courses/:courseId/edit', element: CourseEditPage},
    {path: '/educations/:id/courses/:courseId/progress/:enrollmentId', element: CourseProgress},
    {path: '/educations/:id/courses/:courseId/chapters/:chapterId/lessons/:lessonId', element: LessonPage},
    {path: '/educations/:id/courses/:courseId/chapters/:chapterId/lessons/:lessonId/quiz', element: QuizPage},
    {path: '/educations/certificates/:certificateNumber', element: CertificatePage},
    {path: '/educations/:id/courses', element: SectionCoursesPage},
]

export { NotFound };

export const moderationRoutes = [
    {path: '/moderation', element: Moderation},
    {path: '/moderation/:id/', element: ModerationPostPage},
    {path: '/moderation/courses/:courseId', element: ModerationCourseViewPage},
];

export const creatorRoutes = [
    {path: '/create/post', element: CreateForm},
]

export const publicRoutes = [
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
    {path: '/educations', element: Sections},
    {path: '/educations/:id', element: SectionPage},
    {path: '/educations/:id/materials/:materialId', element: MaterialPage},
    {path: '/educations/:id/materials', element: SectionMaterialsPage},
    {path: '/educations/:id/courses/:courseId', element: CoursePage},
    {path: '/educations/:id/courses', element: SectionCoursesPage},
]
