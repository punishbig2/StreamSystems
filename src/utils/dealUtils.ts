import { Deal } from "components/MiddleOffice/interfaces/deal";
import { MOStrategy } from "components/MiddleOffice/interfaces/moStrategy";
import { Globals } from "golbals";
import { Symbol } from "interfaces/symbol";
import { getVegaAdjust } from "legsUtils";
import moStore from "mobx/stores/moStore";
import workareaStore from "mobx/stores/workareaStore";
import moment from "moment";
import { DealEntry, DealType, EntryType } from "structures/dealEntry";
import { parseTime } from "timeUtils";
import { coalesce } from "utils";
import { tenorToDuration } from "utils/dataGenerators";

export const stateMap: { [key: number]: string } = {
  1: "Pending",
  2: "Priced",
  3: "SEF Unconfirmed",
  4: "STP",
  5: "SEF Confirmed",
};

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
    strike: item.strike,
    spotDate: spotDate,
    deliveryDate: deliveryDate,
    expiryDate: expiryDate,
    symbol: symbol,
    source: item.source,
    status: item.state,
  };
};

export const dealSourceToDealType = (source: string): DealType => {
  if (!source) return DealType.Invalid;
  switch (source.toLowerCase()) {
    case "manual":
      return DealType.Voice;
    case "electronic":
      return DealType.Electronic;
    case "multileg":
      return DealType.Manual;
    default:
      return DealType.Invalid;
  }
};

export const createDealEntry = (deal: Deal): DealEntry => {
  const id: string = deal.dealID;
  const legsCount: number = moStore.getOutLegsCount(deal.strategy);
  const strategy: MOStrategy = moStore.getStrategyById(deal.strategy);
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
    status: deal.status,
    style: "European",
    tenor: deal.tenor,
    model: 3,
    legs: legsCount,
    strike: coalesce(deal.strike, strategy.strike),
    vol: strategy.spreadvsvol === "vol" ? deal.lastPrice : undefined,
    spread: strategy.spreadvsvol === "spread" ? deal.lastPrice : undefined,
    dealType: dealSourceToDealType(deal.source),
    type: EntryType.ExistingDeal,
  };
};
