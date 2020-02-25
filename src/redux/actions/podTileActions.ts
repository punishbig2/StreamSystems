import {createWindowAction} from 'redux/actionCreator';
import {AsyncAction} from 'redux/asyncAction';
import {DummyAction} from 'redux/store';
import {FXOptionsDB} from 'fx-options-db';
import {PodTileActions} from 'redux/reducers/podTileReducer';
import {Currency} from 'interfaces/currency';
import {FXOAction} from 'redux/fxo-action';

type FXOActionType = FXOAction<PodTileActions | string>;

export const setStrategy = (workspaceID: string, windowID: string, strategy: string) => {
  return new AsyncAction<any, FXOActionType>(async () => {
    FXOptionsDB.setWindowStrategy(windowID, strategy);
    return createWindowAction(workspaceID, windowID, PodTileActions.SetStrategy, strategy);
  }, DummyAction);
};

export const setSymbol = (workspaceID: string, windowID: string, symbol: Currency | undefined) => {
  if (symbol === undefined)
    return DummyAction;
  return new AsyncAction<any, FXOActionType>(async () => {
    FXOptionsDB.setWindowSymbol(windowID, symbol);
    return createWindowAction(workspaceID, windowID, PodTileActions.SetSymbol, symbol);
  }, DummyAction);
};
