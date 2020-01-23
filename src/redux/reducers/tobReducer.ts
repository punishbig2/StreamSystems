import { AnyAction } from "redux";
import { DefaultWindowState, WindowState } from "redux/stateDefs/windowState";
import { $$ } from "utils/stringPaster";

const genesisState: WindowState = DefaultWindowState;

export enum TOBActions {
  Initialize = "TOBActions.Initialize",
  SetStrategy = "TOBActions.SetStrategy",
  SetSymbol = "TOBActions.SetSymbol",
  CancelAllOrders = "TOBActions.CancelAllOrders",
  UpdatingOrder = "TOBActions.UpdatingOrder",
  OrderUpdated = "TOBActions.OrderUpdated",
  OrderNotUpdated = "TOBActions.OrderNotUpdated",
  UpdateDOB = "TOBActions.UpdateDOB",
  UpdateOrder = "TOBActions.UpdateOrder",
  DeleteOrder = "TOBActions.DeleteOrder"
}

export const createWindowReducer = (
  id: string,
  initialState: WindowState = genesisState
) => {
  return (state: WindowState = initialState, { type, data }: AnyAction) => {
    switch (type) {
      case $$(id, TOBActions.Initialize):
        return { ...state, rows: data };
      case $$(id, TOBActions.SetStrategy):
        return { ...state, strategy: data };
      case $$(id, TOBActions.SetSymbol):
        return { ...state, symbol: data };
      case $$(id, TOBActions.UpdateDOB):
        return state;
      default:
        return state;
    }
  };
};
