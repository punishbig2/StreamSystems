import { MiddleOfficeStore } from "mobx/stores/middleOfficeStore";
import { useEffect } from "react";

export const useMoInitializer = (store: MiddleOfficeStore) => {
  useEffect((): (() => void) => {
    void store.loadReferenceData();
    return store.connectListeners();
  }, [store]);

  useEffect((): (() => void) => {
    const reload = (): void => {
      window.removeEventListener("online", reload);
      void store.loadDeals();
    };
    const installReloadListener = (): void => {
      window.addEventListener("online", reload);
    };

    window.addEventListener("offline", installReloadListener);

    void store.loadDeals();
    return (): void => {
      window.removeEventListener("offline", installReloadListener);
    };
  }, [store]);
};
