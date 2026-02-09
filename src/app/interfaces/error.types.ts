interface IErrorSources {
  path: string;
  message: string;
}

interface IGenericErrorResponse {
  statusCode: number;
  message: string;
  errorSources?: IErrorSources[];
}

export { IErrorSources, IGenericErrorResponse };
