
from django.contrib import admin
from django.urls import path, include

from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView, TokenVerifyView




urlpatterns = [
    path('admin/', admin.site.urls),
    #jwt
    path('api/v1/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/v1/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/v1/token/verify/', TokenVerifyView.as_view(), name='token_verify'),
    #api
    path('api/v1/', include("apps.posts.urls")),
    path('api/v1/auth/', include("apps.users.urls")),
    path("api/v1/", include("apps.subscriptions.urls")),
]


'''
get /api/v1/posts/all_posts/ - ВСЕ ПОСТЫ 
get /api/v1/posts/{post.id}/all_posts_detail/ - конкретный пост из любых вообще
get /api/v1/posts/ - все опубликованные посты (http://127.0.0.1:7000/api/v1/posts/?limit=5&page=3)
post /api/v1/posts/ - создать пост
get /api/v1/posts/{id}/ - конкретный пост
delete /api/v1/posts/{id}/ - удалить пост
put /api/v1/posts/{id}/ - изменить пост

GET /api/v1/posts/my_draft_posts/ - черновики конкретного автора
GET /api/v1/posts/my_published_posts/ - опубликованные посты конкретного автора
GET /api/v1/posts/my_rejected_posts/ - отклоненные посты конкретного пользователя


post /api/v1/posts/{id}/send_to_moderation/ - отправить на модерацию конкретный пост
post /api/v1/posts/{id}/approve/ - утвердить пост
post /api/v1/posts/{id}/reject/ - отклонить пост

get /api/v1/posts/{post.id}/moderation_detail/ - конкретный пост на модерации 
get /api/v1/posts/moderation_list/ - список постов на модерации
get /api/v1/posts/my_posts/ - все посты конкретного автора
get /api/v1/posts/rejected_posts/ - отклоненные посты



POST /api/v1/posts/{post_id}/comments/ - создать коммент корневой (( в json "text": "текст комментария")
POST /api/v1/posts/{post_id}/comments/ - создать дочерний коммент (( json : "text": "текст комментария", "parent": {parent.id}
GET /api/v1/posts/{post_id}/comments/ - ВСЕ КОММЕНТЫ ПОЛУЧИТЬ [
    {
        "id": 1,
        "author": "Andr27chet04@gmail.com",
        "text": "ashdhasdlhasdloikasdolihasoidoashjidsopsad",
        "created_at": "2026-02-14T19:04:06.605263+10:00",
        "children": [
            {
                "id": 2,
                "author": "Andr27chet04@gmail.com",
                "text": "ashdhasdlhasdloikasdolihasoidoashjidsopsad",
                "created_at": "2026-02-14T19:06:18.195180+10:00",
                "children": []
            }
        ]
    }
]
ВОТ ТАКОЙ ВИД БУДЕТ

DELETE /api/v1/posts/{post_id}/comments/{comment.id}/ - текст комментария будет заменен на 'comment deleted'
PUT /api/v1/posts/{post_id}/comments/{comment.id}/ - изменить текст комментария





LIKES!!!

POST /api/v1/posts/{post_id}/like/ - лайкнуть ( повторная отправка - отменить лайк)

DISLIKES!!!!
POST /api/v1/posts/{post.id}/dislike/ - дизлайк (повтор - отмена)


СБРОС ПАРОЛЯ!!!
POST /api/v1/auth/password-reset/ - получить ссылку на почту для восстановления пароля. Надо сохранить токен и передать его позже

ссылка которая приходит - https://localhost:3000/reset-password/!!!85fd524f-1222-46c5-abe3-6e5fe753f664!!! -  тут я сразу редирект на фронт делаю, на окно ввода нового пароля 
                                                                            токен
                                                
POST /api/v1/auth/password-reset/confirm - подтвердить пароль - надо отправить в виде 
{
    "token": "85fd524f-1222-46c5-abe3-6e5fe753f664",
    "new_password": "User1234"
}




#ПОДПИСКИ!!!
POST /api/v1/subscriptions/  - подписаться на автора. в body json надо указать {"author": {author.id}}
POST /api/v1/subscriptions/unsubscribe/ - отписаться в body json надо указать {"author": {author.id}}
GET /api/v1/subscriptions/ - посмотреть мои подписки
GET /api/v1/auth/authors/{id}/ - посмотреть профиль человека и там будет кол-во его подписчиков.



#ЗАКЛАДКИ!!!!!!!!!!!
POST api/v1/posts/{post.id}/bookmark/ - добавить в закладки
DELETE api/v1/posts/{post.id}/unbookmark/ -удалить закладку
GET api/v1/posts/bookmarks/ - посмотреть мои закладки

'''