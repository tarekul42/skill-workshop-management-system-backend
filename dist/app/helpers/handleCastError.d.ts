import mongoose from "mongoose";
import { IGenericErrorResponse } from "../interfaces/error.types.js";
declare const handleCastError: (err: mongoose.Error.CastError) => IGenericErrorResponse;
export default handleCastError;
