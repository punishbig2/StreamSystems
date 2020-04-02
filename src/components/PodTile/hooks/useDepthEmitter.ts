import { useEffect } from 'react';
import { $$ } from 'utils/stringPaster';
import { PodTileActions } from 'redux/reducers/podTileReducer';

export const useDepthEmitter = (
  tenors: string[],
  symbol: string,
  strategy: string,
  callback: (data: any) => void,
) => {
  // Listen to changes in depth books
  useEffect(() => {
    if (!tenors || !symbol || !strategy) return;
    const handler = (event: Event) => {
      const customEvent: CustomEvent = event as CustomEvent;
      // Dispatch an action for our reducer
      callback(customEvent.detail);
    };
    const getName = (tenor: string) => $$(symbol, strategy, tenor, PodTileActions.UpdateDOB);
    tenors.forEach((tenor: string) => {
      document.addEventListener(getName(tenor), handler);
    });
    return () => {
      tenors.forEach((tenor: string) => {
        document.removeEventListener(getName(tenor), handler);
      });
    };
  }, [tenors, symbol, strategy, callback]);
};
