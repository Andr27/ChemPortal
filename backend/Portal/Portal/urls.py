
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

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
    path("api/v1/", include("apps.education.urls")),
    path('api/v1/', include("apps.quiz.urls")),
    path('api/v1/', include('apps.enrollment.urls')),
    path('api/v1/', include('apps.categories.urls')),
    path('api/v1/', include('apps.tags.urls')),
    path('api/v1/', include('apps.search.urls')),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)


'''
get /api/v1/posts/{post.id}/all_posts_detail/ - конкретный пост из любых вообще !!!
get /api/v1/posts/ - все опубликованные статьи (http://127.0.0.1:7000/api/v1/posts/?limit=5&page=3)!!!
post /api/v1/posts/ - создать пост !!!
Body: {"title": "...", "body": "...", "type": "news", "tags": [1, 5, 23]}

PUT  /api/v1/posts/{id}/                  — обновить теги поста
Body: {"tags": [1, 5]}

GET  /api/v1/posts/?tag=oksidy            — статьи с тегом
GET  /api/v1/posts/news/?tag=oksidy       — новости с тегом
GET  /api/v1/posts/videos/?tag=oksidy     — видео с тегом

get /api/v1/posts/{id}/ - конкретный пост!!!
delete /api/v1/posts/{id}/ - удалить пост!!!
put /api/v1/posts/{id}/ - изменить пост!!!
GET /api/v1/posts/my_draft_posts/ - черновики конкретного автора!!!
GET /api/v1/posts/my_published_posts/ - опубликованные посты конкретного автора!!!
GET /api/v1/posts/my_rejected_posts/ - отклоненные посты конкретного пользователя!!!
post /api/v1/posts/{id}/send_to_moderation/ - отправить на модерацию конкретный пост!!!
post /api/v1/posts/{id}/approve/ - утвердить пост!!!
post /api/v1/posts/{id}/reject/ - отклонить пост!!!
get /api/v1/posts/moderation_list/ - список постов на модерации!!!
get /api/v1/posts/my_posts/ - все посты конкретного автора!!!

get /api/v1/posts/news/ - получить только новости
get /api/v1/posts/videos/ - получить только видео 

ЛЕНТА!!!
GET /api/v1/posts/feed/              - всe
GET /api/v1/posts/feed/?type=article - только статьи
GET /api/v1/posts/feed/?type=news    - только новости
GET /api/v1/posts/feed/?type=video   - только видео
GET /api/v1/posts/feed/?tag=oksidy - то же самое но только с тегом

GET /api/v1/auth/me/ - сведения о пользователе

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





ОБРАЗОВАТЕЛЬНЫЙ РАЗДЕЛ!"!!!!!!!

=== РАЗДЕЛЫ ===
GET    api/v1/education/sections/                                        - все опубликованные разделы
POST   api/v1/education/sections/                                        - создать раздел
GET    api/v1/education/sections/{id}/                                   - конкретный раздел
PUT    api/v1/education/sections/{id}/                                   - изменить раздел
DELETE api/v1/education/sections/{id}/                                   - удалить раздел
POST   api/v1/education/sections/{id}/send_to_moderation/                - отправить на модерацию
POST   api/v1/education/sections/{id}/approve/                           - подтвердить
POST   api/v1/education/sections/{id}/reject/                            - отклонить
GET    api/v1/education/sections/moderation_list/                        - очередь модерации
GET    api/v1/education/sections/my_sections/                            - все мои разделы
GET    api/v1/education/sections/my_draft_sections/                      - мои черновики
GET    api/v1/education/sections/my_published_sections/                  - мои опубликованные
GET    api/v1/education/sections/my_reject_sections/                     - мои отклонённые
POST /api/v1/education/sections/create_and_send_to_moderation/           - создать и отправить раздел на модерацию


=== МАТЕРИАЛЫ РАЗДЕЛА ===
GET    api/v1/education/sections/{id}/materials/                         - все материалы раздела
POST   api/v1/education/sections/{id}/materials/                         - создать материал
GET    api/v1/education/sections/{id}/materials/{id}/                    - конкретный материал
PUT    api/v1/education/sections/{id}/materials/{id}/                    - изменить материал
DELETE api/v1/education/sections/{id}/materials/{id}/                    - удалить материал

=== КУРСЫ ===
GET    api/v1/education/sections/{id}/courses/                           - все курсы раздела
POST   api/v1/education/sections/{id}/courses/                           - создать курс
GET    api/v1/education/sections/{id}/courses/{id}/                      - конкретный курс (с главами и уроками)
PUT    api/v1/education/sections/{id}/courses/{id}/                      - изменить курс
DELETE api/v1/education/sections/{id}/courses/{id}/                      - удалить курс
POST   api/v1/education/sections/{id}/courses/{id}/send_to_moderation/   - отправить на модерацию
POST   api/v1/education/sections/{id}/courses/{id}/approve/              - подтвердить
POST   api/v1/education/sections/{id}/courses/{id}/reject/               - отклонить
body
{
    "comment": "comment"
}
GET    api/v1/education/sections/{id}/courses/moderation_list/           - очередь модерации
GET    api/v1/education/sections/{id}/courses/my_courses/                - все мои курсы
GET    api/v1/education/sections/{id}/courses/my_draft_courses/          - мои черновики
GET    api/v1/education/sections/{id}/courses/my_published_courses/      - мои опубликованные
GET    api/v1/education/sections/{id}/courses/my_reject_courses/         - мои отклонённые
POST /api/v1/education/sections/{id}/courses/create_and_send_to_moderation/ - создать и отправить курс на модерацию
GET  /api/v1/education/courses/moderation_list/                          - очередь модерации без привязки к разделам              
GET  /api/v1/education/courses/my_courses/                               - мои курсы без привязки к разделам

=== ГЛАВЫ ===
GET    api/v1/education/sections/{id}/courses/{id}/chapters/             - все главы курса
POST   api/v1/education/sections/{id}/courses/{id}/chapters/             - создать главу
GET    api/v1/education/sections/{id}/courses/{id}/chapters/{id}/        - конкретная глава (с уроками)
PUT    api/v1/education/sections/{id}/courses/{id}/chapters/{id}/        - изменить главу
DELETE api/v1/education/sections/{id}/courses/{id}/chapters/{id}/        - удалить главу

=== УРОКИ ===
GET    api/v1/education/sections/{id}/courses/{id}/chapters/{id}/lessons/        - все уроки главы
POST   api/v1/education/sections/{id}/courses/{id}/chapters/{id}/lessons/        - создать урок
GET    api/v1/education/sections/{id}/courses/{id}/chapters/{id}/lessons/{id}/   - конкретный урок
PUT    api/v1/education/sections/{id}/courses/{id}/chapters/{id}/lessons/{id}/   - изменить урок
DELETE api/v1/education/sections/{id}/courses/{id}/chapters/{id}/lessons/{id}/   - удалить урок





ТЕСТЫ!!!!!!!!!!

!!!!Тесты — основное
GET /api/v1/quizzes/by_lesson/?lesson_id={lesson_id} - получить тест привязанный к уроку по id
GET /api/v1/quizzes/by_lesson/?chapter_id={chapter_id} - получить тест привязанный к главе по id

GET     api/v1/quizzes/ - получить тесты
POST    api/v1/quizzes/ - создать тест
POST /api/v1/quizzes/
{
    "title": "Тест по химии",
    "description": "Базовый тест",
    "passing_score": 60,
    "max_attempts": 3,
    "time_limit_minutes": 10,
    "show_explanation_after": true,
    'lesson' : {lesson.id}, # или null если тест к главе
    "chapter": {chapter.id} или null если тест к уроку
}

GET     api/v1/quizzes/{quizzes.id} - получить конкретный тест
PUT     api/v1/quizzes/{quizzes.id} - обновить тест
DELETE  api/v1/quizzes/{quizzes.id} - удалить тест

~~~Модерация!!!!!!!!
POST    api/v1/quizzes/{quizzes.id}/send_to_moderation/ - отправить тест на модерацию
POST    api/v1/quizzes/{quizzes.id}/approve/ - утвердить тест
POST    api/v1/quizzes/{quizzes.id}/reject/ - отклонить тест
GET     api/v1/quizzes/moderation_list/ - очередь модерации

!!!Мои тесты!
GET     api/v1/quizzes/my_quizzes/ - мои тесты
GET     api/v1/quizzes/my_draft_quizzes/ - мои черновики тесты
GET     api/v1/quizzes/my_rejected_quizzes/ - мои отклоненный тесты
GET     api/v1/quizzes/my_published_quizzes/ - мои опубликованные тесты 
GET     api/v1/quizzes/{quizzes.id}/admin_detail/ - тест детально с правильными ответами


Вопросы!!!!!!!!!!!!!!!
POST   /api/v1/quizzes/{id}/add_question/                    — добавить вопрос
ОДИНОЧНЫЙ ОТВЕТ POST /api/v1/quizzes/{id}/add_question/
{
    "text": "Какой элемент имеет символ H?",
    "type": "single",
    "points": 2,
    "hint": "Это самый лёгкий элемент",
    "explanation": "Водород — первый элемент таблицы Менделеева",
    "options": [
        {"text": "Водород", "is_correct": true, "order": 1},
        {"text": "Гелий", "is_correct": false, "order": 2},
        {"text": "Углерод", "is_correct": false, "order": 3}
    ]
} 
НЕСКОЛЬКО ОТВЕТОВ POST /api/v1/quizzes/{id}/add_question/
{
    "text": "Какие из этих элементов — металлы?",
    "type": "multiple",
    "points": 3,
    "partial_credit": true,
    "explanation": "Железо, медь и золото — металлы",
    "options": [
        {"text": "Железо", "is_correct": true, "order": 1},
        {"text": "Кислород", "is_correct": false, "order": 2},
        {"text": "Медь", "is_correct": true, "order": 3},
        {"text": "Золото", "is_correct": true, "order": 4}
    ]
}
СТРОКА POST /api/v1/quizzes/{id}/add_question/
{
    "text": "Напишите химическую формулу воды",
    "type": "string",
    "points": 2,
    "hint": "Два атома водорода и один кислород",
    "explanation": "Вода — H2O",
    "correct_string_answer": "H2O",
    "correct_string_alternatives": "h2o|Н2О|н2о"
}

PUT    /api/v1/quizzes/{id}/update_question/{question_id}/   — обновить вопрос
DELETE /api/v1/quizzes/{id}/delete_question/{question_id}/   — удалить вопрос


Прохождение теста!~!!!!!!!!!!
POST   /api/v1/quizzes/{id}/start/               — начать попытку
GET    /api/v1/quizzes/{id}/hint/{question_id}/  — получить подсказку к вопросу
POST   /api/v1/quizzes/{id}/submit/              — сдать тест
POST /api/v1/quizzes/{id}/submit/
{
    "answers": [
        {
            "question_id": 4,
            "selected_option_ids": [8]
        },
        {
            "question_id": 5,
            "selected_option_ids": [11, 13, 14]
        },
        {
            "question_id": 6,
            "string_answer": "H2O"
        }
    ]
}
GET    /api/v1/quizzes/{id}/my_results/          — мои попытки и результаты
GET    /api/v1/quizzes/{id}/stats/               — статистика по тесту (Creator)



Enrollment API
POST   /api/v1/enrollments/enroll/                        — записаться на курс        
body
{
"course_id": {course_id}
}

POST   /api/v1/enrollments/drop/                          — покинуть курс
body             
{
"course_id": {course_id}
}
GET    /api/v1/enrollments/my/                            — мои записи на курсы
GET    /api/v1/enrollments/{id}/progress/                 — детальный прогресс по курсу
POST   /api/v1/enrollments/{id}/complete_lesson/          — завершить урок     
body     
{
"lesson_id": {lesson_id}
}
GET    /api/v1/enrollments/next_lesson/?course_id=1       — следующий доступный модуль

GET    /api/v1/enrollments/certificates/                  — мои сертификаты
GET    /api/v1/enrollments/certificate_detail/?number=CERT-XXX — сертификат по номеру






ТЕГИ!!!!!!!!!!!
GET     /api/v1/tags/                                   - список всех тегов
GET     /api/v1/tags/?search={tag.name}                 - поиск тегов по названию
GET     /api/v1/tags/{tag.slug}/                        - Конкретный тег

POST    /api/v1/tags/{tag.slug}/favorite/               - Добавить/убрать тег из избранного
GET     /api/v1/tags/my_favorites/                      - мои избранные теги

POST    /api/v1/tags/suggest/                           - ИИ предлагает теги по тексту
body
{
"text": "Минимум 30 символов"
}

POST   /api/v1/tags/request_tag/                        - заявка на новый тег
body
{
{"name"}: "{tag.name}",
{"reason"}: "Причина заявки"
}

GET     /api/v1/tags/request_list/                      - очередь заявок
GET     /api/v1/tags/request_list/?statsu=approved      - Одобренные заявки
GET     /api/v1/tags/request_list/?statsu=rejected      - Отклоненные заявки


POST    /api/v1/tags/approve_request/                   - одобрить заявку 
Body: {"request_id": 1}

POST    /api/v1/tags/reject_request/                       - отклонить заявку 
Body: {"request_id": 1, "comment": "Такой тег уже есть"}






КАТЕГОРИИ

get     /api/v1/categories/ -   список категорий
get     /api/v1/{categories/{categories.slug} - конкретная катеогрия
get     /api/v1/categories/{categories.slug}/sections/ - все разделы в категории конкретной






ОТЗЫВЫ НА КУРС
POST /api/v1/enrollments/leave_review/              - написать отзыв
Body: {"course_id": 1, "rating": 5, "comment": "Отличный курс!"}

GET  /api/v1/enrollments/course_reviews/?course_id={course_id} - получить все отзывы на конкретный курс
GET  /api/v1/enrollments/course_reviews/?course_id={course_id}&with_comment=true  - получить отзывы только с комментариями
GET  /api/v1/enrollments/course_reviews/?course_id={course_id}&sort=useful    - сортировка по рейтингу




GET /api/v1/education/sections/{section_id}/courses/{course_id}/stats/ - СТАТА КУРСА 



POST /api/v1/auth/creator-applications/apply/ - отправить заявку на creator
{
    "bio":"Я доктор физических наук",
    "affiliation": "Я не знаю что тут писать", - необязательно
    "scientific_interests": "Dota 2",
    "vk_url":"https://vk.com/andrewchetverik",- необязательно
    "telegram_url": "https://t.me/@Andrrrrrrr", - необязательно
    "website_url": "https://t.me/@Andrrrrrrr" - необязательно

}
GET  /api/v1/auth/creator-applications/my_application/ - моя заявка
GET  /api/v1/auth/creator-applications/applications_list/ - список всех заявок
GET  /api/v1/auth/creator-applications/{id}/applications_detail/
POST /api/v1/auth/creator-applications/approve/   
{
"application_id": {application_id}
}
POST /api/v1/auth/creator-applications/reject/    
{"application_id": {application_id}, "comment": "..."}
GET  /api/v1/auth/creators/                       — список всех креаторов
GET  /api/v1/auth/creators/{id}/                  — профиль Creator'а
GET  /api/v1/auth/creators/{id}/activity/         — лента активностей

GET /api/v1/auth/creators/{id}/liked/ - лайкнутые



ПОИСК!!
GET /api/v1/search/?q=оксиды               — ищет везде
GET /api/v1/search/?q=оксиды&type=posts    — только посты
GET /api/v1/search/?q=оксиды&type=courses  — только курсы
GET /api/v1/search/?q=оксиды&type=sections — только разделы
GET /api/v1/search/?q=оксиды&type=tags     — только теги
GET /api/v1/search/?q=оксиды&limit=5       — лимит результатов
GET /api/v1/search/?q=оксиды&mode=semantic     — семантический поиск


'''
