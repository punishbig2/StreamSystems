/*import { createWindowAction } from 'redux/actionCreator';
import { PodTileActions } from 'redux/reducers/podTileReducer';
import { Currency } from 'interfaces/currency';
import { FXOAction } from 'redux/fxo-action';

export const setStrategy = (workspaceID: string, windowID: string, strategy: string): FXOAction<PodTileActions> => {
  return createWindowAction(workspaceID, windowID, PodTileActions.SetStrategy, strategy);
};

export const setSymbol = (workspaceID: string, windowID: string, symbol: Currency): FXOAction<PodTileActions> => {
  return createWindowAction(workspaceID, windowID, PodTileActions.SetSymbol, symbol);
};

export const initialize = (workspaceID: string, windowID: string, rows: any) => {
  return createWindowAction(workspaceID, windowID, PodTileActions.Initialize, rows);
};*/
export const PodTileActionsDontExport = null;
