import { ZodError } from "zod";
import { IGenericErrorResponse } from "../interfaces/error.types.js";
declare const handleZodError: (err: ZodError) => IGenericErrorResponse;
export default handleZodError;
