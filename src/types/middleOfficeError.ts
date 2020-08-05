export const ON_MIDDLE_OFFICE_ERROR = "on-middle-office-error";
export interface MiddleOfficeError {
  error: string;
  code: number;
  message: string;
  status: string;
}
