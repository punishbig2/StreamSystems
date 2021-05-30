import { useEffect } from "react";
import {
  MOErrorMessage,
  ON_MIDDLE_OFFICE_ERROR,
} from "types/middleOfficeError";

export const useErrorListener = (
  setError: (error: MOErrorMessage | null) => void
) => {
  useEffect(() => {
    const listener = (event: any) => {
      const customEvent: CustomEvent<MOErrorMessage> = event as CustomEvent<MOErrorMessage>;
      setError(customEvent.detail);
    };
    document.addEventListener(ON_MIDDLE_OFFICE_ERROR, listener);
    return () => document.removeEventListener(ON_MIDDLE_OFFICE_ERROR, listener);
  }, [setError]);
};
