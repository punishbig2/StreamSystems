import { Deal } from "components/MiddleOffice/DealBlotter/deal";

export const createDealFromBackendMessage = (source: any): Deal => {
  const item: any = typeof source === "string" ? JSON.parse(source) : source;
  return {
    dealID: item.linkid,
    buyer: item.buyer,
    seller: item.seller,
    cumulativeQuantity: item.cumqty,
    currency: item.symbol,
    lastPrice: item.lastpx,
    leavesQuantity: item.lvsqty,
    lastQuantity: item.lastqty,
    strategy: item.strategy,
    symbol: item.symbol,
    transactionTime: item.transacttime,
  };
};
