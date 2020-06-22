import { Deal } from "components/MiddleOffice/DealBlotter/deal";

export const createDealFromBackendMessage = (source: any): Deal => {
  const item: any = typeof source === "string" ? JSON.parse(source) : source;
  return {
    dealID: item.linkid,
    buyer: item.buyer,
    seller: item.seller,
    cumulativeQuantity: Number(item.cumqty),
    currency: item.symbol,
    lastPrice: Number(item.lastpx),
    leavesQuantity: Number(item.lvsqty),
    lastQuantity: Number(item.lastqty),
    strategy: item.strategy,
    symbol: item.symbol,
    transactionTime: item.transacttime,
  };
};
