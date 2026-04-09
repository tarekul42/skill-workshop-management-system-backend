"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const env_1 = __importDefault(require("../config/env"));
const parseExpiry_1 = require("./parseExpiry");
const setAuthCookie = (res, tokenInfo) => {
    const isProduction = env_1.default.NODE_ENV === "production";
    if (tokenInfo.accessToken) {
        res.cookie("accessToken", tokenInfo.accessToken, {
            httpOnly: true,
            secure: isProduction,
            sameSite: isProduction ? "strict" : "lax",
            maxAge: (0, parseExpiry_1.parseExpiryToSeconds)(env_1.default.JWT_ACCESS_EXPIRES) * 1000,
            path: "/",
        });
    }
    if (tokenInfo.refreshToken) {
        res.cookie("refreshToken", tokenInfo.refreshToken, {
            httpOnly: true,
            secure: isProduction,
            sameSite: isProduction ? "strict" : "lax",
            maxAge: (0, parseExpiry_1.parseExpiryToSeconds)(env_1.default.JWT_REFRESH_EXPIRES) * 1000,
            path: "/",
        });
    }
};
exports.default = setAuthCookie;
