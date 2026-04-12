import mongoose from "mongoose";
import { IGenericErrorResponse } from "../interfaces/error.types";
declare const handleValidationError: (err: mongoose.Error.ValidationError) => IGenericErrorResponse;
export default handleValidationError;
