import { SEFErrorEntry } from "utils/parseSEFError";

export const ON_MIDDLE_OFFICE_ERROR = "on-middle-office-error";

export interface MOErrorMessage {
  error: string;
  code: number;
  content?: string | ReadonlyArray<SEFErrorEntry>;
  message?: string;
  status: string;
}
