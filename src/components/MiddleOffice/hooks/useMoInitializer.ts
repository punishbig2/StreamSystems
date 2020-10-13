import moStore from "mobx/stores/moStore";
import { useEffect } from "react";
import config from "config";

export const useMoInitializer = () => {
  useEffect(() => {
    moStore
      .loadReferenceData()
      .then(() => {})
      .catch((error: any): void => {
        const { location } = window;
        location.href = config.SignOutUrl;
      });
  }, []);
};
