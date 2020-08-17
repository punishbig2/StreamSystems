import { Deal } from "components/MiddleOffice/interfaces/deal";
import { MOStrategy } from "components/MiddleOffice/interfaces/moStrategy";
import { Globals } from "golbals";
import { getVegaAdjust } from "legsUtils";
import moStore from "mobx/stores/moStore";
import workareaStore from "mobx/stores/workareaStore";
import moment from "moment";
import { DealEntry, DealType, EntryType } from "structures/dealEntry";
import { BankEntity } from "types/bankEntity";
import { DealStatus } from "types/dealStatus";
import { Symbol } from "types/symbol";
import { coalesce } from "utils";
import { addTenorToDate } from "utils/tenorUtils";
import { forceParseDate, parseTime } from "utils/timeUtils";

export const stateMap: { [key: number]: string } = {
  [DealStatus.Pending]: "Pending",
  [DealStatus.Priced]: "Priced",
  [DealStatus.SEFUnconfirmed]: "SEF Unconfirmed",
  [DealStatus.STP]: "STP",
  [DealStatus.SEFConfirmed]: "SEF Confirmed",
};

export const resolveBankToEntity = (source: string): string => {
  const bank: BankEntity[] | undefined = moStore.entities[source];
  if (bank === undefined)
    return source /* it probably already is the entity code */;
  const entity: BankEntity | undefined = bank.find(
    (entity: BankEntity): boolean => entity.default
  );
  if (entity === undefined) return "";
  return entity.code;
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
  const deliveryDate: moment.Moment = addTenorToDate(spotDate, item.tenor);
  const parsedExpiryDate1: moment.Moment | undefined = forceParseDate(
    source.expirydate
  );
  const parsedExpiryDate2: moment.Moment | undefined = forceParseDate(
    source.expirydate2
  );
  const expiryDate1: moment.Moment =
    parsedExpiryDate1 === undefined
      ? addTenorToDate(tradeDate, item.tenor)
      : parsedExpiryDate1;
  const expiryDate2: moment.Moment =
    parsedExpiryDate2 === undefined
      ? addTenorToDate(tradeDate, item.tenor1)
      : parsedExpiryDate2;
  return {
    dealID: item.linkid,
    buyer: item.buyer,
    seller: item.seller,
    cumulativeQuantity: Number(item.cumqty),
    currency: item.symbol,
    lastPrice: item.lastpx === null ? null : Number(item.lastpx),
    leavesQuantity: Number(item.lvsqty),
    lastQuantity: Number(item.lastqty),
    strategy: item.strategy,
    currencyPair: item.symbol,
    transactionTime: item.transacttime,
    tenor: item.tenor,
    tenor2: item.tenor1,
    tradeDate: tradeDate,
    strike: item.strike,
    spotDate: spotDate,
    deliveryDate: deliveryDate,
    expiryDate: expiryDate1,
    expiryDate2: expiryDate2,
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
  if (strategy === undefined) {
    throw new Error(`strategy not found: ${deal.strategy}`);
  }
  return {
    ccypair: deal.currencyPair,
    strategy: deal.strategy,
    premstyle: "",
    not1: 1e6 * deal.lastQuantity,
    not2: null,
    legadj: getVegaAdjust(strategy.OptionProductType, deal.symbol),
    buyer: deal.buyer,
    seller: deal.seller,
    tradeDate: deal.tradeDate,
    expiry1: deal.expiryDate,
    expiry2: deal.expiryDate2,
    deliveryDate: deal.deliveryDate,
    dealId: id.toString(),
    status: deal.status,
    style: "European",
    tenor1: deal.tenor,
    tenor2: deal.tenor2,
    model: 3,
    legs: legsCount,
    dealstrike: coalesce(deal.strike, strategy.strike),
    vol: strategy.spreadvsvol === "vol" ? deal.lastPrice : undefined,
    spread: strategy.spreadvsvol === "spread" ? deal.lastPrice : undefined,
    dealType: dealSourceToDealType(deal.source),
    type: EntryType.ExistingDeal,
  };
};
