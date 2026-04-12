import { ZodError } from "zod";
import { IGenericErrorResponse } from "../interfaces/error.types";
declare const handleZodError: (err: ZodError) => IGenericErrorResponse;
export default handleZodError;
