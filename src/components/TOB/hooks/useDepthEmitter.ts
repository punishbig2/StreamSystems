import {useEffect} from 'react';
import {TOBActions} from 'redux/constants/tobConstants';
import {$$} from 'utils/stringPaster';

export const useDepthEmitter = (tenors: string[], symbol: string, strategy: string, callback: (data: any) => void) => {
  // Listen to changes in depth books
  useEffect(() => {
    if (!tenors || !symbol || !strategy)
      return;
    const handler = (event: Event) => {
      const customEvent: CustomEvent = event as CustomEvent;
      console.log(customEvent.detail);
      // Dispatch an action for our reducer
      callback(customEvent.detail);
    };
    const getName = (tenor: string) => $$(tenor, symbol, strategy, TOBActions.UpdateDOB);
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

