import { Deal } from "components/MiddleOffice/interfaces/deal";
import { parseTime } from "timeUtils";
import { Globals } from "golbals";
import moment from "moment";
import { Symbol } from "interfaces/symbol";
import { tenorToDuration } from "utils/dataGenerators";
import workareaStore from "mobx/stores/workareaStore";
import { MOStrategy } from "components/MiddleOffice/interfaces/moStrategy";
import mo from "mobx/stores/moStore";
import { DealEntry, DealStatus } from "structures/dealEntry";
import { getVegaAdjust } from "legsUtils";

export const createDealFromBackendMessage = (source: any): Deal => {
  const symbol: Symbol | undefined = workareaStore.findSymbolById(
    source.symbol
  );
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
    source: item.source,
  };
};

export const createDealEntry = (deal: Deal): DealEntry => {
  const id: string = deal.dealID;
  const legsCount: number = mo.getOutLegsCount(deal.strategy);
  const strategy: MOStrategy = mo.getStrategyById(deal.strategy);
  return {
    currencyPair: deal.currencyPair,
    strategy: deal.strategy,
    notional: 1e6 * deal.lastQuantity,
    legAdj: getVegaAdjust(strategy.OptionProductType, deal.symbol),
    buyer: deal.buyer,
    seller: deal.seller,
    tradeDate: deal.tradeDate,
    expiryDate: deal.expiryDate,
    deliveryDate: deal.deliveryDate,
    dealId: id.toString(),
    status: DealStatus.Pending,
    style: "European",
    tenor: deal.tenor,
    model: 3,
    legs: legsCount,
    strike: strategy.strike,
    vol: strategy.spreadvsvol === "vol" ? deal.lastPrice : undefined,
    spread: strategy.spreadvsvol === "spread" ? deal.lastPrice : undefined,
  };
};
