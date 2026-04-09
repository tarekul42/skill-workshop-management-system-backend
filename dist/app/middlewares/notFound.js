import { StatusCodes } from "http-status-codes";
import logger from "../utils/logger";
const notFound = (req, res) => {
    logger.warn({
        message: `Route Not Found: ${req.method} ${req.originalUrl}`,
    });
    res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: "Route Not Found!",
    });
};
export default notFound;
