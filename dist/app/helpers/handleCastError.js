import { StatusCodes } from "http-status-codes";
const handleCastError = (err) => {
    return {
        statusCode: StatusCodes.BAD_REQUEST,
        message: `Invalid MongoDB ObjectId. Please provide a valid ObjectId. Err: ${err.message}`,
    };
};
export default handleCastError;
