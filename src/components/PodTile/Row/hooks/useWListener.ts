import {useEffect, useState} from 'react';
import {SignalRManager} from 'redux/signalR/signalRManager';
import {W} from 'interfaces/w';
import {PodRow} from 'interfaces/podRow';
import {toPodRow} from 'utils/dataParser';
import {FXOptionsDB} from 'fx-options-db';
import {$$} from 'utils/stringPaster';
import {createAction} from 'redux/actionCreator';
import {ActionTypes} from 'components/PodTile/Row/reducer';
import {FXOAction} from 'redux/fxo-action';
import {useAction} from 'hooks/useAction';


export const useWListener = (symbol: string, strategy: string, tenor: string, connected: boolean) => {
  const [action, dispatch] = useAction<FXOAction<ActionTypes>>();
  useEffect(() => {
    if (connected) {
      if (!symbol || !strategy || symbol === '' || strategy === '')
        return;
      const signalRManager: SignalRManager = SignalRManager.getInstance();
      const onNewWMessage = async (w: W) => {
        const row: PodRow = toPodRow(w);
        // Update the dark price
        row.darkPrice = await FXOptionsDB.getDarkPool($$(symbol, strategy, tenor));
        // Update us
        dispatch(createAction<ActionTypes>(ActionTypes.SetRow, row));
      };
      // Show the loading spinner
      dispatch(createAction<ActionTypes>(ActionTypes.StartLoading));
      // Create an array of "unsubscribe/remove listener" functions
      return signalRManager.addPodRowListener(symbol, strategy, tenor, onNewWMessage);
    }
  }, [symbol, strategy, tenor, connected, dispatch]);
  return action;
};

