import { useEffect } from "react";
import {
  MiddleOfficeError,
  ON_MIDDLE_OFFICE_ERROR,
} from "types/middleOfficeError";

export const useErrorListener = () => {
  useEffect(() => {
    const listener = (event: any) => {
      const customEvent: CustomEvent<MiddleOfficeError> = event as CustomEvent<
        MiddleOfficeError
      >;
      console.log(customEvent.detail);
    };
    document.addEventListener(ON_MIDDLE_OFFICE_ERROR, listener);
    return () => document.removeEventListener(ON_MIDDLE_OFFICE_ERROR, listener);
  });
};
