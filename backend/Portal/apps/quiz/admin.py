from django.contrib import admin
from .models import Quiz, Question, AnswerOption, QuizAttempt, UserAnswer


class AnswerOptionInline(admin.TabularInline):
    model = AnswerOption
    extra = 0


class QuestionInline(admin.TabularInline):
    model = Question
    extra = 0
    fields = ('text', 'type', 'points', 'order')


@admin.register(Quiz)
class QuizAdmin(admin.ModelAdmin):
    list_display = ('title', 'created_by', 'status', 'passing_score', 'max_attempts', 'questions_count', 'created_at')
    list_filter = ('status', 'created_at')
    search_fields = ('title', 'created_by__email')
    readonly_fields = ('created_at',)
    inlines = [QuestionInline]

    def questions_count(self, obj):
        return obj.questions.count()
    questions_count.short_description = 'Вопросов'


@admin.register(Question)
class QuestionAdmin(admin.ModelAdmin):
    list_display = ('text', 'quiz', 'type', 'points', 'order')
    list_filter = ('type',)
    search_fields = ('text', 'quiz__title')
    inlines = [AnswerOptionInline]


@admin.register(QuizAttempt)
class QuizAttemptAdmin(admin.ModelAdmin):
    list_display = ('user', 'quiz', 'status', 'score', 'is_passed', 'started_at')
    list_filter = ('status', 'is_passed', 'started_at')
    search_fields = ('user__email', 'quiz__title')
    readonly_fields = ('started_at', 'finished_at')