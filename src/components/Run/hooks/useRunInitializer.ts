import { Dispatch, useEffect, useState } from "react";
import { RunActions } from "components/Run/reducer";
import { createAction, FXOAction } from "utils/actionCreator";
import { API } from "API";
import { Order, OrderMessage, OrderStatus } from "types/order";
import { PodRow } from "types/podRow";
import { PodTable } from "types/podTable";
import { OrderTypes } from "types/mdEntry";
import { createEmptyTable } from "components/Run/helpers/createEmptyTable";
import { User } from "types/user";
import workareaStore from "mobx/stores/workareaStore";
import { ordersReducer } from "../helpers/ordersReducer";

export const useRunInitializer = (
  tenors: string[],
  symbol: string,
  strategy: string,
  activeOrders: { [tenor: string]: Order },
  visible: boolean,
  dispatch: Dispatch<FXOAction<RunActions>>
) => {
  const [initialized, setInitialized] = useState<boolean>(false);
  useEffect(() => {
    /*if (initialized) return;
    if (!visible) return;
    const user: User = workareaStore.user;
    const { email } = user;
    dispatch(createAction<RunActions>(RunActions.SetLoadingStatus, true));
    .then();
    setInitialized(true);*/
  }, [tenors, symbol, strategy, visible, activeOrders, dispatch, initialized]);
};
