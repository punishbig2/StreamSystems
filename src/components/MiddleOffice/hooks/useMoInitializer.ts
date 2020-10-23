import moStore from "mobx/stores/moStore";
import { useEffect } from "react";

export const useMoInitializer = () => {
  useEffect(() => {
    moStore
      .loadReferenceData()
      .then(() => {})
      .catch((error: any): void => {});
  }, []);
};
