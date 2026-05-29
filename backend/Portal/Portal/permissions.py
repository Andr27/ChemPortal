from rest_framework import permissions
from Portal.choices import UserRole




class RolePermission(permissions.BasePermission):

    allowed_roles = set()

    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False

        role = request.user.profile.role
        return role in self.allowed_roles



class IsCreator(RolePermission):
    allowed_roles = {
        UserRole.ADMIN,
        UserRole.MODERATOR,
        UserRole.CREATOR,
        UserRole.EXPERT,
    }


class IsModerator(RolePermission):
    allowed_roles = {
        UserRole.ADMIN,
        UserRole.MODERATOR,
    }


class IsAdmin(RolePermission):
    allowed_roles = {
        UserRole.ADMIN,
    }


class IsExpert(RolePermission):
    allowed_roles = {
        UserRole.EXPERT,
        UserRole.ADMIN,
    }



