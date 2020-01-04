import {Sides} from 'interfaces/order';
import {useEffect} from 'react';
import {$$} from 'utils/stringPaster';
import {TOBActions} from 'redux/reducers/tobReducer';

export const useDeleteAllListener = (symbol: string, strategy: string, side: Sides, onDeleteAll: () => void) => {
  useEffect(() => {
    const type: string = $$(symbol, strategy, side, TOBActions.DeleteOrder);
    document.addEventListener(type, onDeleteAll);
    return () => document.removeEventListener(type, onDeleteAll);
  }, [symbol, strategy, side, onDeleteAll]);
};
