from rest_framework import serializers
from .models import EducationSection, SectionMaterial, Course, Chapter, Lesson


class EducationSectionSerializer(serializers.ModelSerializer):
    created_by = serializers.SerializerMethodField()
    class Meta:
        model = EducationSection
        fields = ("id", "title", "description", "created_by", "created_at", "status")
        read_only_fields = ("created_by", "created_at")

    def get_created_by(self, obj):
        return {
            "id": obj.created_by.id,
            "first_name": obj.created_by.first_name,
            "last_name": obj.created_by.last_name,
        }



class SectionMaterialSerializer(serializers.ModelSerializer):
    class Meta:
        model = SectionMaterial
        exclude = ("section", )


class LessonSerializer(serializers.ModelSerializer):
    has_quiz = serializers.SerializerMethodField()

    class Meta:
        model = Lesson
        exclude = ('chapter',)

    def get_has_quiz(self, obj):
        return hasattr(obj, 'quiz')

    def validate(self, data):
        lesson_type = data.get('type')
        content = data.get('content', '')
        external_url = data.get('external_url', '')

        if lesson_type == 'link' and not external_url:
            raise serializers.ValidationError(
                "Для типа 'ссылка' необходимо указать external_url"
            )
        if lesson_type in ('lecture', 'practice') and not content:
            raise serializers.ValidationError(
                "Для лекций и практик необходимо заполнить content"
            )
        return data

class ChapterSerializer(serializers.ModelSerializer):
    lessons = LessonSerializer(many=True, read_only=True)
    lessons_count = serializers.SerializerMethodField()
    has_quiz = serializers.SerializerMethodField()

    class Meta:
        model = Chapter
        exclude = ('course',)

    def get_lessons_count(self, obj):
        return obj.lessons.count()

    def get_has_quiz(self, obj):
        return hasattr(obj, 'quiz')


class CourseSerializer(serializers.ModelSerializer):
    created_by = serializers.SerializerMethodField()
    class Meta:
        model = Course
        fields = ("id", "title", "description", "created_by", "created_at", "status")
        read_only_fields = ("created_by", "created_at")

    def get_created_by(self, obj):
        return {
            "id": obj.created_by.id,
            "first_name": obj.created_by.first_name,
            "last_name": obj.created_by.last_name,
        }


class EducationSectionDetailSerializer(EducationSectionSerializer):
    """Детальный вид раздела — с материалами и курсами"""
    materials = SectionMaterialSerializer(many=True, read_only=True)
    courses = CourseSerializer(many=True, read_only=True)

    class Meta(EducationSectionSerializer.Meta):
        fields = EducationSectionSerializer.Meta.fields + ('materials', 'courses')


class CourseDetailSerializer(CourseSerializer):
    """Детальный вид курса — с главами и уроками"""
    chapters = ChapterSerializer(many=True, read_only=True)
    chapters_count = serializers.SerializerMethodField()

    class Meta(CourseSerializer.Meta):
        fields = CourseSerializer.Meta.fields + ('chapters', 'chapters_count')

    def get_chapters_count(self, obj):
        return obj.chapters.count()

