from rest_framework import serializers

from Portal.choices import ModerationStatus
from .models import EducationSection, SectionMaterial, Course, Chapter, Lesson, SectionMaterialImage


class EducationSectionSerializer(serializers.ModelSerializer):
    created_by = serializers.SerializerMethodField()
    class Meta:
        model = EducationSection
        fields = ("id", "title", "description", "created_by", "created_at", "status", 'rating')
        read_only_fields = ("created_by", "created_at", 'rating')

    def get_created_by(self, obj):
        return {
            "id": obj.created_by.id,
            "first_name": obj.created_by.first_name,
            "last_name": obj.created_by.last_name,
        }


class SectionMaterialImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = SectionMaterialImage
        fields = ('id', 'image', 'uploaded_at')


class SectionMaterialSerializer(serializers.ModelSerializer):
    images = SectionMaterialImageSerializer(many=True, read_only=True)
    uploaded_images = serializers.ListField(
        child=serializers.ImageField(),
        write_only=True,
        required=False
    )

    class Meta:
        model = SectionMaterial
        exclude = ('section',)

    def create(self, validated_data):
        images = validated_data.pop('uploaded_images', [])
        material = SectionMaterial.objects.create(**validated_data)
        for image in images:
            SectionMaterialImage.objects.create(material=material, image=image)
        return material

    def update(self, instance, validated_data):
        images = validated_data.pop('uploaded_images', None)
        instance = super().update(instance, validated_data)
        if images is not None:
            instance.images.all().delete()
            for image in images:
                SectionMaterialImage.objects.create(material=instance, image=image)
        return instance



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
    section_title = serializers.CharField(source='section.title', read_only=True)
    section_id = serializers.IntegerField(source='section.id', read_only=True)
    rating = serializers.FloatField(read_only=True)
    reviews_count = serializers.IntegerField(read_only=True)
    class Meta:
        model = Course
        fields = ("id", "title", "description", "created_by", "created_at", "status", "section_id", "section_title", 'reject_comment',
                  "rating", "reviews_count")
        read_only_fields = ("created_by", "created_at", 'reject_comment')

    def get_created_by(self, obj):
        return {
            "id": obj.created_by.id,
            "first_name": obj.created_by.first_name,
            "last_name": obj.created_by.last_name,
        }


class EducationSectionDetailSerializer(EducationSectionSerializer):
    """Детальный вид раздела — с материалами и курсами"""
    materials = SectionMaterialSerializer(many=True, read_only=True)
    courses = serializers.SerializerMethodField()

    class Meta(EducationSectionSerializer.Meta):
        fields = EducationSectionSerializer.Meta.fields + ('materials', 'courses')

    def get_courses(self, obj):
        published = obj.courses.filter(status=ModerationStatus.PUBLISHED)
        return CourseSerializer(published, many=True).data


class CourseDetailSerializer(CourseSerializer):
    """Детальный вид курса — с главами и уроками"""
    chapters = ChapterSerializer(many=True, read_only=True)
    chapters_count = serializers.SerializerMethodField()

    class Meta(CourseSerializer.Meta):
        fields = CourseSerializer.Meta.fields + ('chapters', 'chapters_count')

    def get_chapters_count(self, obj):
        return obj.chapters.count()

