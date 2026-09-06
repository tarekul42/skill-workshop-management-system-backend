interface IErrorSources {
  path: string;
  message: string;
}

interface IGenericErrorResponse {
  statusCode: number;
  message: string;
  code?: string;
  errorSources?: IErrorSources[];
}

export { IErrorSources, IGenericErrorResponse };
