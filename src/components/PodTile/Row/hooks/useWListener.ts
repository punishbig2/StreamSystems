import { useEffect } from 'react';
import { SignalRManager } from 'redux/signalR/signalRManager';
import { W } from 'interfaces/w';
import { PodRow } from 'interfaces/podRow';
import { toPodRow } from 'utils/dataParser';
import { createAction } from 'redux/actionCreator';
import { ActionTypes } from 'components/PodTile/Row/reducer';
import { FXOAction } from 'redux/fxo-action';
import { useAction } from 'hooks/useAction';
import { User } from 'interfaces/user';

export const useWListener = (symbol: string, strategy: string, tenor: string, user: User, connected: boolean) => {
  const [action, dispatch] = useAction<FXOAction<ActionTypes>>();
  useEffect(() => {
    if (connected) {
      if (!symbol || !strategy || symbol === '' || strategy === '')
        return;
      const signalRManager: SignalRManager = SignalRManager.getInstance();
      const onNewWMessage = async (w: W) => {
        const row: PodRow = toPodRow(w, user);
        // Update the dark price
        // FIXME: maybe this is the only one we should keep?
        // row.darkPrice = await FXOptionsDB.getDarkPool($$(symbol, strategy, tenor));
        // Update us
        dispatch(createAction<ActionTypes>(ActionTypes.SetRow, row));
      };
      // Show the loading spinner
      dispatch(createAction<ActionTypes>(ActionTypes.StartLoading));
      // Create an array of "unsubscribe/remove listener" functions
      const remove = signalRManager.setTOBWListener(symbol, strategy, tenor, onNewWMessage);
      return () => {
        remove();
      };
    }
  }, [symbol, strategy, tenor, connected, dispatch, user]);
  return action;
};

