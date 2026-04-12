import { StatusCodes } from "http-status-codes";
const handleDuplicateError = (err) => {
    const matchedArray = err.message.match(/"([^"]*)"/);
    const fieldName = matchedArray ? matchedArray[1] : "field";
    return {
        statusCode: StatusCodes.BAD_REQUEST,
        message: `Duplicate key error. Please provide a unique value for ${fieldName}. Err: ${err.message}`,
    };
};
export default handleDuplicateError;
