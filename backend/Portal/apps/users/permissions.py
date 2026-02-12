from rest_framework import permissions


#Создатель контента
class IsCreator(permissions.BasePermission):
    allowed_roles = {"creator", "moderator", "admin"}

    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.profile.role in self.allowed_roles


#Гость
class IsGuest(permissions.BasePermission):
    def has_permission(self, request, view):
        return not request.user.is_authenticated

#Пользователь
class IsUser(permissions.BasePermission):
    allowed_roles = {'user', 'creator', 'moderator', 'admin'}

    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.profile.role in self.allowed_roles

#Модератор
class IsModerator(permissions.BasePermission):
    allowed_roles = {'moderator', 'admin'}

    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.profile.role == 'moderator'

#Только админ
class IsAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.profile.role == 'admin'


#Владелец или админ
class IsOwnerOrAdmin(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        return (request.user.is_authenticated and (obj.author == request.user or request.user.profile.role == 'admin'))


#Владелец или только чтение
class ReadOnlyOrCreator(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True

        return request.user.is_authenticated and request.user.profile.role in {"creator", "moderator", "admin"}



