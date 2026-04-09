var UserRole;
(function (UserRole) {
    UserRole["SUPER_ADMIN"] = "SUPER_ADMIN";
    UserRole["ADMIN"] = "ADMIN";
    UserRole["INSTRUCTOR"] = "INSTRUCTOR";
    UserRole["STUDENT"] = "STUDENT";
})(UserRole || (UserRole = {}));
var IsActive;
(function (IsActive) {
    IsActive["ACTIVE"] = "ACTIVE";
    IsActive["INACTIVE"] = "INACTIVE";
    IsActive["BLOCKED"] = "BLOCKED";
})(IsActive || (IsActive = {}));
export { IsActive, UserRole };
export const isAdminRole = (role) => role === UserRole.ADMIN || role === UserRole.SUPER_ADMIN;
export const isSuperAdmin = (role) => role === UserRole.SUPER_ADMIN;
export const isOwnResourceOrAdmin = (resourceUserId, tokenUserId, tokenRole) => resourceUserId === tokenUserId || isAdminRole(tokenRole);
