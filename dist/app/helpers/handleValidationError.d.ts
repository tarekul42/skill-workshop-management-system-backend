import mongoose from "mongoose";
import { IGenericErrorResponse } from "../interfaces/error.types.js";
declare const handleValidationError: (err: mongoose.Error.ValidationError) => IGenericErrorResponse;
export default handleValidationError;
