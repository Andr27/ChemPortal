from django.db import models
from django.contrib.auth import get_user_model

from Portal.choices import ModerationStatus


User = get_user_model()


class Quiz(models.Model):
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)

    module = models.OneToOneField(
        'education.CourseModule',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='quiz',
    )

    created_by = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='quizzes',
    )
    created_at = models.DateTimeField(auto_now_add=True)

    status = models.CharField(
        max_length=20,
        choices=ModerationStatus.choices,
        default=ModerationStatus.DRAFT
    )

    time_limit_minutes = models.PositiveIntegerField(
        null=True,
        blank=True,
    )

    passing_score = models.PositiveIntegerField(default=60)
    max_attempts = models.PositiveIntegerField(default=0)
    show_explanation_after = models.BooleanField(default=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.title




class Question(models.Model):
    QUESTION_TYPES = [
        ('single', "Одиночный выбор"),
        ('multiple', "Множественный выбор"),
        ('string', "Ввод строки"),
    ]

    quiz = models.ForeignKey(
        Quiz,
        on_delete=models.CASCADE,
        related_name='questions',
    )

    text = models.TextField()
    type = models.CharField(max_length=20, choices=QUESTION_TYPES)
    order = models.PositiveIntegerField(default=0)
    points = models.PositiveIntegerField(default=1)
    partial_credit = models.BooleanField(default=False)

    hint = models.TextField(blank=True)
    explanation = models.TextField(blank=True)

    correct_string_answer = models.CharField(max_length=500, blank=True)

    correct_string_alternatives = models.TextField(blank=True)

    class Meta:
        ordering = ['order']

    def __str__(self):
        return f"[{self.get_type_display()}]: {self.text[:60]}"

    def check_string_answer(self, user_input: str) -> bool:
        normalized = user_input.strip().lower()
        if normalized == self.correct_string_answer.strip().lower():
            return True
        if self.correct_string_alternatives:
            alternatives = [
                a.strip().lower()
                for a in self.correct_string_alternatives.split("|")
            ]
            return normalized in alternatives
        return False


class AnswerOption(models.Model):
    question = models.ForeignKey(
        Question,
        on_delete=models.CASCADE,
        related_name='options',
    )
    text = models.CharField(max_length=500)
    is_correct = models.BooleanField(default=False)
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['order']

    def __str__(self):
        return f'{"✓" if self.is_correct else "✗"} {self.text[:60]}'







class QuizAttempt(models.Model):
    STATUS_CHOICES = [
        ("in_progress", "В процессе"),
        ("completed", "Завершен"),
        ('timed_out', "Время вышло")
    ]
    quiz = models.ForeignKey(
        Quiz,
        on_delete=models.CASCADE,
        related_name='attempts',
    )

    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='quiz_attempts',
    )

    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='in_progress')

    started_at = models.DateTimeField(auto_now_add=True)
    finished_at = models.DateTimeField(null=True, blank=True)

    score = models.PositiveIntegerField(null=True, blank=True)
    total_points = models.FloatField(default=0)
    earned_points = models.FloatField(default=0)
    is_passed = models.BooleanField(null=False, default=False)

    class Meta:
        ordering = ['-started_at']

    def __str__(self):
        return f"{self.user} → {self.quiz} ({self.status})"




class UserAnswer(models.Model):
    attempt = models.ForeignKey(
        QuizAttempt,
        on_delete=models.CASCADE,
        related_name='answers',
    )

    question = models.ForeignKey(
        Question,
        on_delete=models.CASCADE,
        related_name='user_answers',
    )

    selected_options = models.ManyToManyField(
        AnswerOption,
        blank=True,
        related_name='user_answers',
    )

    string_answer = models.CharField(max_length=500, blank=True)

    is_correct = models.BooleanField(null=True, blank=True)
    is_partial = models.BooleanField(default=False)
    points_earned = models.PositiveIntegerField(default=0)
    class Meta:
        unique_together = ('attempt', 'question')

    def __str__(self):
        return f"Ответ на '{self.question}' в попытке #{self.attempt.id}"









