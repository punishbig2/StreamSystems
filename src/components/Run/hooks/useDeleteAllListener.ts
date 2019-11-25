import {Sides} from 'interfaces/order';
import {useEffect} from 'react';
import {TOBActions} from 'redux/constants/tobConstants';
import {$$} from 'utils/stringPaster';

export const useDeleteAllListener = (symbol: string, strategy: string, side: Sides, onDeleteAll: () => void) => {
  useEffect(() => {
    const type: string = $$(symbol, strategy, side, TOBActions.DeleteOrder);
    document.addEventListener(type, onDeleteAll);
    return () => document.removeEventListener(type, onDeleteAll);
  }, [symbol, strategy, side, onDeleteAll]);
};
