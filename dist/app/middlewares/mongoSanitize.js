const sanitize = (obj) => {
    if (Array.isArray(obj)) {
        return obj.map((v) => sanitize(v));
    }
    else if (obj !== null && typeof obj === "object") {
        const newObj = {};
        const sourceObj = obj;
        Object.keys(sourceObj).forEach((key) => {
            if (!key.startsWith("$") && !key.includes(".")) {
                newObj[key] = sanitize(sourceObj[key]);
            }
        });
        return newObj;
    }
    return obj;
};
const tryAssign = (req, key, value) => {
    try {
        delete req[key];
        Object.defineProperty(req, key, {
            value: value,
            writable: true,
            configurable: true,
        });
        return true;
    }
    catch {
        return false;
    }
};
const mongoSanitizeCustom = (req, _res, next) => {
    if (req.body && typeof req.body === "object") {
        tryAssign(req, "body", sanitize(req.body));
    }
    if (req.query && typeof req.query === "object") {
        tryAssign(req, "query", sanitize(req.query));
    }
    if (req.params && typeof req.params === "object") {
        tryAssign(req, "params", sanitize(req.params));
    }
    next();
};
export default mongoSanitizeCustom;
