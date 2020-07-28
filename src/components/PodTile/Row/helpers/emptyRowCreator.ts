import { PodRowStatus } from "types/podRow";
import { Order } from "types/order";
import { OrderTypes } from "types/mdEntry";

export const createRow = (symbol: string, strategy: string, tenor: string) => {
  const order: Order = new Order(tenor, "", "", "", null, OrderTypes.Invalid);
  return {
    tenor,
    id: tenor,
    bid: { ...order, type: OrderTypes.Bid },
    ofr: { ...order, type: OrderTypes.Ofr },
    mid: null,
    spread: null,
    darkPrice: null,
    status: PodRowStatus.Normal,
  };
};
