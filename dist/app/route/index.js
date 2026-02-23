"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_route_1 = __importDefault(require("../modules/auth/auth.route"));
const category_route_1 = __importDefault(require("../modules/category/category.route"));
const enrollment_route_1 = __importDefault(require("../modules/enrollment/enrollment.route"));
const payment_route_1 = __importDefault(require("../modules/payment/payment.route"));
const user_route_1 = __importDefault(require("../modules/user/user.route"));
const router = (0, express_1.Router)();
const moduleRoutes = [
    {
        path: "/user",
        route: user_route_1.default,
    },
    {
        path: "/auth",
        route: auth_route_1.default,
    },
    {
        path: "/category",
        route: category_route_1.default,
    },
    {
        path: "/enrollment",
        route: enrollment_route_1.default,
    },
    {
        path: "/payment",
        route: payment_route_1.default,
    },
];
moduleRoutes.forEach((route) => {
    router.use(route.path, route.route);
});
exports.default = router;
