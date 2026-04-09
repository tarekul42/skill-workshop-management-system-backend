import { StatusCodes } from "http-status-codes";
const handleZodError = (err) => {
    const errorSources = err.issues.map((issue) => ({
        // Explicitly convert the value to a string to handle array indices (numbers)
        // and satisfy the 'string' type requirement of IErrorSources.
        path: String(issue.path[issue.path.length - 1] ?? "value"),
        message: issue.message,
    }));
    return {
        statusCode: StatusCodes.BAD_REQUEST,
        message: "Zod validation error",
        errorSources,
    };
};
export default handleZodError;
