import { StatusCodes } from "http-status-codes";
const handleValidationError = (err) => {
    const errorSources = [];
    const errors = Object.values(err.errors);
    errors.forEach((errorObject) => errorSources.push({
        path: errorObject.path,
        message: errorObject.message,
    }));
    return {
        statusCode: StatusCodes.BAD_REQUEST,
        message: "Validation Error Occurred",
        errorSources,
    };
};
export default handleValidationError;
