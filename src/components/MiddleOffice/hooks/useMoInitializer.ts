import { MiddleOfficeStore } from 'mobx/stores/middleOfficeStore';
import workareaStore from 'mobx/stores/workareaStore';
import { useEffect } from 'react';
import React from 'react';

export const useMoInitializer = (store: MiddleOfficeStore): void => {
  const { connected } = workareaStore;

  const updateAll = React.useCallback(async (): Promise<void> => {
    await store.loadReferenceData();
    await store.loadDeals();

    store.refreshCurrentDeal();
  }, [store]);

  useEffect((): VoidFunction | void => {
    if (connected) {
      void updateAll();

      return store.connectListeners();
    }
  }, [store, updateAll, connected]);
};
