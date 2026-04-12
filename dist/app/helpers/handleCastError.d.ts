import mongoose from "mongoose";
import { IGenericErrorResponse } from "../interfaces/error.types";
declare const handleCastError: (err: mongoose.Error.CastError) => IGenericErrorResponse;
export default handleCastError;
