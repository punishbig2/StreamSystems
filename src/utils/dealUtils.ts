import { Deal } from "components/MiddleOffice/interfaces/deal";
import { parseTime } from "timeUtils";
import { Globals } from "golbals";
import moment from "moment";
import { Symbol } from "interfaces/symbol";
import { tenorToDuration } from "utils/dataGenerators";
import workareaStore from "mobx/stores/workareaStore";

export const createDealFromBackendMessage = (source: any): Deal => {
  const symbol: Symbol | undefined = workareaStore.findSymbolById(source.symbol);
  if (symbol === undefined)
    throw new Error("symbol not found in symbols list " + source.symbol);
  const item: any = typeof source === "string" ? JSON.parse(source) : source;
  const tradeDate: moment.Moment = moment(
    parseTime(item.transacttime, Globals.timezone)
  );
  const spotDate: moment.Moment = moment(tradeDate).add(
    symbol.SettlementWindow,
    "d"
  );
  const tenorDuration: moment.Duration = tenorToDuration(item.tenor);
  const deliveryDate: moment.Moment = moment(spotDate).add(tenorDuration);
  const expiryDate: moment.Moment = moment(tradeDate).add(tenorDuration);
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
    currencyPair: item.symbol,
    transactionTime: item.transacttime,
    tenor: item.tenor,
    tradeDate: tradeDate,
    spotDate: spotDate,
    deliveryDate: deliveryDate,
    expiryDate: expiryDate,
    symbol: symbol,
  };
};
