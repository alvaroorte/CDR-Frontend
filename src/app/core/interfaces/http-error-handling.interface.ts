export interface FormattedHttpError {
  code: number;
  status: string;
  path?: string;
  errors: string[];
}

export interface APIErrorBase {
  code: number;
  status: string;
  path: string;
  message?: string;
  errors?: DtoValidationError[];
  errorList?: CustomValidationError[] | EntityValidatorMultipleError[];
  error?: string;
}

export interface DtoValidationError {
  field: string;
  message: string;
  code: string;
}

export interface CustomValidationError {
  field: string;
  message: string;
  code: string;
}

export interface EntityValidatorMultipleError {
  entity: string;
  message: string;
  code: string;
}
