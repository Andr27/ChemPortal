from rest_framework import serializers
from .models import EducationSection, SectionMaterial, Course, CourseModule



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

class CourseModuleSerializer(serializers.ModelSerializer):
    class Meta:
        model = CourseModule
        exclude = ("course", )


    def validate(self, data):
        module_type = data.get("type")
        content = data.get("content")

        if module_type == "link" and not content:
            raise serializers.ValidationError(
                "Для типа 'ссылка' необходимо указать url"
            )
        if module_type in ["lecture", 'practice'] and not content:
            raise serializers.ValidationError(
                "Для лекций и практик необходимо поле конттент"
            )
        return data


class EducationSectionDetailSerializer(serializers.ModelSerializer):
    materials = SectionMaterialSerializer(many=True, read_only=True)
    courses = CourseSerializer(many=True, read_only=True)
    modules = serializers.SerializerMethodField()
    created_by = serializers.SerializerMethodField()
    class Meta:
        model = EducationSection
        fields = (
            "id",
            "title",
            "description",
            "created_at",
            "status",
            'materials',
            'courses',
            'modules',
            "created_by"
        )
        read_only_fields = ("created_at", 'created_by')

    def get_created_by(self, obj):
        return {
            "id": obj.created_by.id,
            "first_name": obj.created_by.first_name,
            "last_name": obj.created_by.last_name,
        }

    def get_modules(self, obj):
        modules = []
        for course in obj.courses.all():
            modules.extend(course.modules.all())
        modules.sort(key=lambda x: x.order)
        return CourseModuleSerializer(modules, many=True).data

class CourseDetailSerializer(serializers.ModelSerializer):
    modules = CourseModuleSerializer(many=True, read_only=True)
    class Meta:
        model = Course
        fields = (
            'id',
            'title',
            'description',
            'created_at',
            'status',
            'created_by',
            'modules',

        )

