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
    source.expirydate1
  );
  const expiry1: moment.Moment =
    parsedExpiryDate1 === undefined
      ? addTenorToDate(tradeDate, item.tenor)
      : parsedExpiryDate1;
  const expiry2: moment.Moment =
    parsedExpiryDate2 === undefined
      ? addTenorToDate(tradeDate, item.tenor1)
      : parsedExpiryDate2;
  return {
    dealID: item.linkid,
    buyer: item.buyer,
    seller: item.seller,
    currency: item.symbol,
    price: item.lastpx === null ? null : Number(item.lastpx),
    notional1: Number(item.lastqty) * 1e6,
    notional2: Number(item.notional1),
    strategy: item.strategy,
    currencyPair: item.symbol,
    transactionTime: item.transacttime,
    tenor1: item.tenor,
    expiry1: expiry1,
    tenor2: item.tenor1,
    expiry2: expiry2,
    tradeDate: tradeDate,
    strike: item.strike,
    spotDate: spotDate,
    deliveryDate: deliveryDate,
    symbol: symbol,
    source: item.source,
    status: item.state,
    deltaStyle: item.deltastyle === "" ? "Forward" : item.deltastyle,
    premiumStyle: item.premstyle === "" ? "Forward" : item.premstyle,
    fwdRate1: item.fwdrate1,
    fwdPts1: item.fwdpts1,
    fwdRate2: item.fwdrate2,
    fwdPts2: item.fwdpts2,
    commissions: {
      buyer: {
        rate: item.buyer_comm_rate,
        value: item.buyer_comm,
      },
      seller: {
        rate: item.seller_comm_rate,
        value: item.seller_comm,
      },
    },
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
    premstyle: deal.premiumStyle,
    deltastyle: deal.deltaStyle,
    not1: deal.notional1,
    not2: deal.notional2,
    legadj: getVegaAdjust(strategy.OptionProductType, deal.symbol),
    buyer: deal.buyer,
    seller: deal.seller,
    tradeDate: deal.tradeDate,
    tenor1expiry: deal.expiry1,
    tenor2expiry: deal.expiry2,
    deliveryDate: deal.deliveryDate,
    dealId: id.toString(),
    status: deal.status,
    style: "European",
    tenor1: deal.tenor1,
    tenor2: deal.tenor2,
    model: 3,
    legs: legsCount,
    dealstrike: coalesce(deal.strike, strategy.strike),
    vol: strategy.spreadvsvol === "vol" ? deal.price : undefined,
    spread: strategy.spreadvsvol === "spread" ? deal.price : undefined,
    dealType: dealSourceToDealType(deal.source),
    type: EntryType.ExistingDeal,
  };
};
