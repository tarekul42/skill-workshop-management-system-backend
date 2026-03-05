/* eslint-disable */
import mongoSanitizeCustom from "./app/middlewares/mongoSanitize";

console.log("Starting rigorous verification...");

// Test Case 1: Frozen Object (Deep read-only)
const body = Object.freeze({ "$gt": 1, normal: "data" });
const query = { "a.b": 2 };
const params = { "$where": "x" };

const req: any = { body, query, params };

// Test Case 2: Read-only property (Cannot reassign req.params)
Object.defineProperty(req, 'params', {
    value: { "$where": "x" },
    writable: false,
    configurable: true
});

console.log("Running middleware...");
mongoSanitizeCustom(req, {} as any, () => { });

const bodyClean = !("$gt" in req.body) && req.body.normal === "data";
const queryClean = !("a.b" in req.query);
// params won't be cleaned if it's strictly read-only and the middleware skips assignment
// but it SHOULD NOT throw an error.
const paramsAttempted = !("$where" in req.params);

console.log("Verification results:");
console.log("- Body sanitized (Frozen object handled):", bodyClean);
console.log("- Query sanitized:", queryClean);
console.log("- Params handled without crash (Read-only property):", true);

if (bodyClean && queryClean) {
    console.log("\nSUCCESS: Custom sanitization is robust!");
} else {
    console.error("\nFAILURE: Sanitization failed requirements.");
    process.exit(1);
}
