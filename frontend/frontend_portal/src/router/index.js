import About from "../pages/About";
import Posts from "../pages/Posts";
import PostsPage from "../pages/PostsPage";
import Login from "../pages/login";
import MyAccount from "../pages/MyAccount";
import Moderation from "../pages/Moderation";
import moderationPostPage from "../pages/ModerationPostPage";
import {Router} from "react-router-dom";
import ConfirmEmail from "../pages/ConfirmEmail";
import CreateForm from "../pages/CreateForm";
import refreshPassword from "../pages/RefreshPassword";
import RefreshPassword from "../pages/RefreshPassword";
import Bookmark from "../pages/Bookmark";


export const privateRoutes = [
    {path: '/about', element: About},
    {path: '/posts', element: Posts},
    {path: '/posts/:id', element: PostsPage},
    {path: '/account', element: MyAccount},
    {path: '/bookmarks', element: Bookmark}
]
export const moderationRoutes = [
    {path: '/moderation', element: Moderation},
    {path: '/moderation/:id/', element: moderationPostPage},
];

export const creatorRoutes = [
    {path: '/create/post', element: CreateForm},
]
export const publicRoutes = [
    {path: '/login', element: Login},
    {path: '/login/:token', element: Login},
    {path: '/confirm-email', element: ConfirmEmail},
    {path: '/reset-password', element: RefreshPassword}
]