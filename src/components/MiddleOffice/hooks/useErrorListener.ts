import { useEffect } from "react";
import {
  MiddleOfficeError,
  ON_MIDDLE_OFFICE_ERROR,
} from "types/middleOfficeError";

export const useErrorListener = (
  setError: (error: MiddleOfficeError | null) => void
) => {
  useEffect(() => {
    const listener = (event: any) => {
      const customEvent: CustomEvent<MiddleOfficeError> = event as CustomEvent<
        MiddleOfficeError
      >;
      setError(customEvent.detail);
    };
    document.addEventListener(ON_MIDDLE_OFFICE_ERROR, listener);
    return () => document.removeEventListener(ON_MIDDLE_OFFICE_ERROR, listener);
  }, [setError]);
};
