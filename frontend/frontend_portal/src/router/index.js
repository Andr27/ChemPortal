import {lazy} from "react";

// lazy + возможность заранее подгрузить чанк (preload).
// React.lazy не даёт публичного API для prefetch, поэтому сохраняем саму
// import-функцию: повторный вызов безопасен (webpack кэширует промис модуля).
function lazyWithPreload(factory) {
    const Component = lazy(factory);
    Component.preload = factory;
    return Component;
}

// 404
const NotFound = lazy(() => import("../features/posts/pages/NotFound"));

// Лента / Посты
const Posts = lazyWithPreload(() => import("../features/posts/pages/Posts"));
const PostsPage = lazy(() => import("../features/posts/pages/PostsPage"));
const Bookmark = lazyWithPreload(() => import("../features/posts/pages/Bookmark"));
const News = lazyWithPreload(() => import("../features/posts/pages/News"));
const Videos = lazyWithPreload(() => import("../features/posts/pages/Videos"));
const TagPostsPage = lazy(() => import("../features/posts/pages/TagPostsPage"));

// Авторизация
const Login = lazyWithPreload(() => import("../features/Login/pages/login"));
const ConfirmEmail = lazy(() => import("../features/Login/pages/ConfirmEmail"));
const RefreshPassword = lazy(() => import("../features/Login/pages/RefreshPassword"));

// Аккаунт
const MyAccount = lazyWithPreload(() => import("../features/account/pages/MyAccount"));
const AuthorInformation = lazy(() => import("../features/account/pages/AuthorInformationPage"));
// Модерация
const Moderation = lazy(() => import("../features/moderation/pages/Moderation"));
const ModerationPostPage = lazy(() => import("../features/moderation/pages/ModerationPostPage"));
const ModerationCourseViewPage = lazy(() => import("../features/moderation/pages/ModerationCourseViewPage"));
const RequestRolePage = lazy(() => import("../features/moderation/pages/RequestRolePage"));
// Экспертная модерация
const ExpertModeration = lazy(() => import("../features/moderation/pages/ExpertModeration"));
const ExpertPostPage = lazy(() => import("../features/moderation/pages/ExpertPostPage"));
const ExpertCourseViewPage = lazy(() => import("../features/moderation/pages/ExpertCourseViewPage"));

// Создание
const CreateForm = lazy(() => import("../features/posts/pages/CreateForm"));

// Профориентационный навигатор (карта Хабаровского края)
const Navigator = lazyWithPreload(() => import("../features/navigator/pages/NavigatorPage"));

// Образование
const Sections = lazyWithPreload(() => import("../features/educations/pages/sections"));
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


// ---------------------------------------------------------------------------
// Prefetch: подгружаем чанки самых частых страниц заранее, чтобы переход
// был мгновенным. Вызывается при наведении на навбар-ссылки.
// ---------------------------------------------------------------------------
const prefetchMap = {
    '/posts': Posts,
    '/news': News,
    '/videos': Videos,
    '/educations': Sections,
    '/login': Login,
    '/bookmarks': Bookmark,
    '/account': MyAccount,
    '/navigator': Navigator,
};

/** Prefetch-обёртка: триггерит загрузку чанка для роута, если он ещё не загружен. */
export function prefetchRoute(path) {
    const Comp = prefetchMap[path];
    if (Comp && typeof Comp.preload === 'function') {
        // Повторные вызовы безопасны — webpack отдаёт закэшированный промис.
        Comp.preload().catch(() => {});
    }
}

// ---------------------------------------------------------------------------
// Мета-информация о роутах (для prefetch в навбаре и других UI-компонентах).
// ---------------------------------------------------------------------------
export const NAV_ROUTES = Object.keys(prefetchMap);


export const privateRoutes = [
    //Посты
    {path: '/posts', element: Posts},
    {path: '/posts/:id', element: PostsPage},
    {path: '/bookmarks', element: Bookmark},
    {path: '/news', element: News},
    {path: '/videos', element: Videos},
    {path: '/tags/:slug', element: TagPostsPage},
    //Аккаунт
    {path: '/account', element: MyAccount},
    {path: '/author/:id/', element: AuthorInformation},
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
    //Профориентационный навигатор
    {path: '/navigator', element: Navigator},
]

export { NotFound };

export const moderationRoutes = [
    {path: '/moderation', element: Moderation},
    {path: '/moderation/:id/', element: ModerationPostPage},
    {path: '/moderation/courses/:courseId', element: ModerationCourseViewPage},
    {path: '/moderation/requests/:id', element: RequestRolePage},
];

// Экспертная модерация — те же пути, что и у модератора, но другие страницы.
// Роль у пользователя одна, поэтому коллизии путей не возникает.
export const expertRoutes = [
    {path: '/moderation', element: ExpertModeration},
    {path: '/moderation/:id/', element: ExpertPostPage},
    {path: '/moderation/courses/:courseId', element: ExpertCourseViewPage},
];

export const creatorRoutes = [
    {path: '/create/post', element: CreateForm},
]

export const publicRoutes = [
    //Посты
    {path: '/posts', element: Posts},
    {path: '/posts/:id', element: PostsPage},
    {path: '/news', element: News},
    {path: '/videos', element: Videos},
    {path: '/tags/:slug', element: TagPostsPage},
    {path: '/author/:id/', element: AuthorInformation},
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
    //Профориентационный навигатор
    {path: '/navigator', element: Navigator},
]
