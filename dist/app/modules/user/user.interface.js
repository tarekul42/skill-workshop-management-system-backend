"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isOwnResourceOrAdmin = exports.isSuperAdmin = exports.isAdminRole = exports.UserRole = exports.IsActive = void 0;
var UserRole;
(function (UserRole) {
    UserRole["SUPER_ADMIN"] = "SUPER_ADMIN";
    UserRole["ADMIN"] = "ADMIN";
    UserRole["INSTRUCTOR"] = "INSTRUCTOR";
    UserRole["STUDENT"] = "STUDENT";
})(UserRole || (exports.UserRole = UserRole = {}));
var IsActive;
(function (IsActive) {
    IsActive["ACTIVE"] = "ACTIVE";
    IsActive["INACTIVE"] = "INACTIVE";
    IsActive["BLOCKED"] = "BLOCKED";
})(IsActive || (exports.IsActive = IsActive = {}));
const isAdminRole = (role) => role === UserRole.ADMIN || role === UserRole.SUPER_ADMIN;
exports.isAdminRole = isAdminRole;
const isSuperAdmin = (role) => role === UserRole.SUPER_ADMIN;
exports.isSuperAdmin = isSuperAdmin;
const isOwnResourceOrAdmin = (resourceUserId, tokenUserId, tokenRole) => resourceUserId === tokenUserId || (0, exports.isAdminRole)(tokenRole);
exports.isOwnResourceOrAdmin = isOwnResourceOrAdmin;
