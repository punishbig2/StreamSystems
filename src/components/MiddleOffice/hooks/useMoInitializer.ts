import { MiddleOfficeStore } from "mobx/stores/middleOfficeStore";
import { useEffect } from "react";

export const useMoInitializer = (store: MiddleOfficeStore) => {
  useEffect((): (() => void) => {
    void store.loadReferenceData();
    return store.connectListeners();
  }, [store]);

  useEffect((): void => {
    void store.loadDeals();
  }, [store]);
};
