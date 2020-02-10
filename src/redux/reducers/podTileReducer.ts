import {defaultWindowState, WindowState} from 'redux/stateDefs/windowState';
import {FXOAction} from 'redux/fxo-action';

const initialState: WindowState = defaultWindowState;

export interface PodTileAction {
  workspaceID: string,
  windowID: string;
}

export enum PodTileActions {
  Initialize = 'POD_TILE_ACTIONS_INITIALIZE',
  SetStrategy = 'POD_TILE_ACTIONS_SET_STRATEGY',
  SetSymbol = 'POD_TILE_ACTIONS_SET_SYMBOL',
  CancelAllOrders = 'POD_TILE_ACTIONS_CANCEL_ALL_ORDERS',
  UpdateDOB = 'POD_TILE_ACTIONS_UPDATE_DOB',
  UpdateOrder = 'POD_TILE_ACTIONS_UPDATE_ORDER',
  DeleteOrder = 'POD_TILE_ACTIONS_DELETE_ORDER',
}

export const podTileReducer = (state: WindowState = initialState, {type, data}: FXOAction<PodTileActions>) => {
  switch (type) {
    case PodTileActions.Initialize:
      return {...state, rows: data};
    case PodTileActions.SetStrategy:
      return {...state, strategy: data};
    case PodTileActions.SetSymbol:
      return {...state, symbol: data};
    case PodTileActions.UpdateDOB:
      return state;
    default:
      return state;
  }
};
