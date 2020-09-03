import { SEFErrorEntry } from "utils/parseSEFError";

export const ON_MIDDLE_OFFICE_ERROR = "on-middle-office-error";
export interface MiddleOfficeError {
  error: string;
  code: number;
  content: string | ReadonlyArray<SEFErrorEntry>;
  status: string;
}
