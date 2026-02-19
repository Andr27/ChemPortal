from rest_framework.permissions import BasePermission, SAFE_METHODS


class CanEditPost(BasePermission):
    def has_object_permission(self, request, view, obj):
        # чтение всем
        if request.method in SAFE_METHODS:
            return True

        # редактировать может ток автор
        if obj.author.id != request.user.id:
            return False

        role = getattr(request.user.profile, 'role', None)

        if role == 'admin':
            return True

        if obj.status not in ["draft", "rejected"]:
            return False

        return True
