import { API } from "API";
import { Deal } from "components/MiddleOffice/types/deal";
import {
  InvalidStrategy,
  MOStrategy,
} from "components/MiddleOffice/types/moStrategy";
import { Globals } from "golbals";
import { getVegaAdjust } from "legsUtils";
import moStore from "mobx/stores/moStore";
import { DealEntry, DealType, EntryType } from "structures/dealEntry";
import { BankEntity } from "types/bankEntity";
import { DealStatus } from "types/dealStatus";
import { InvalidSymbol, Symbol } from "types/symbol";
import { Tenor } from "types/tenor";
import { coalesce } from "utils";
import { getDefaultStrikeForStrategy } from "utils/getDefaultStrikeForStrategy";
import { DealDates, resolveDealDates } from "utils/tenorUtils";
import { addToDate, parseTime } from "utils/timeUtils";

export const stateMap: { [key: number]: string } = {
  [DealStatus.Pending]: "Pending",
  [DealStatus.Priced]: "Priced",
  [DealStatus.SEFUnconfirmed]: "SEF Unconfirmed",
  [DealStatus.STP]: "STP",
  [DealStatus.SEFConfirmed]: "SEF Confirmed",
};

export const resolveEntityToBank = (source: string): string => {
  const bank: BankEntity | undefined = moStore.entitiesMap[source];
  if (bank === undefined) {
    return source;
  }
  return bank.id;
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

const getCommissionRates = async (item: any): Promise<any> => {
  if (
    item.buyer_comm_rate === undefined ||
    item.seller_comm_rate === undefined
  ) {
    const deals: Deal[] = await API.getDeals();
    if (deals.length === 0) return undefined;
    const found: Deal | undefined = deals.find(
      (deal: Deal): boolean => deal.id === item.linkid
    );
    if (found === undefined) return undefined;
    return found.commissions;
  }
  return {
    buyer: {
      rate: item.buyer_comm_rate,
      value: item.buyer_comm,
    },
    seller: {
      rate: item.seller_comm_rate,
      value: item.seller_comm,
    },
  };
};

const getSpread = (item: any): number | null => {
  if (item.spread !== "" && item.spread !== null && item.spread !== undefined)
    return item.spread;
  const strategy: MOStrategy | undefined = moStore.getStrategyById(
    item.strategy
  );
  if (strategy === undefined || strategy.spreadvsvol === "vol") return null;
  return item.lastpx / 100;
};

const getVol = (item: any): number | null => {
  if (item.vol !== "" && item.vol !== null && item.vol !== undefined)
    return item.vol;
  const strategy: MOStrategy | undefined = moStore.getStrategyById(
    item.strategy
  );
  if (strategy === undefined || strategy.spreadvsvol === "spread") return null;
  return item.lastpx / 100;
};

// FIXME: create the deal entry directly
export const createDealFromBackendMessage = async (
  source: any
): Promise<Deal> => {
  const symbol: Symbol = moStore.findSymbolById(source.symbol);
  const object: any = typeof source === "string" ? JSON.parse(source) : source;
  const tradeDate: Date = parseTime(object.transacttime, Globals.timezone);
  const strike: string = coalesce(
    object.strike,
    getDefaultStrikeForStrategy(object.strategy)
  );
  const premiumDate: Date = addToDate(tradeDate, symbol.SettlementWindow, "d");
  return {
    id: object.linkid,
    buyer: coalesce(object.buyerentitycode, object.buyer),
    seller: coalesce(object.sellerentitycode, object.seller),
    currency: object.symbol,
    spread: getSpread(object),
    vol: getVol(object),
    notional1: Number(object.lastqty) * 1e6,
    notional2: object.notional1 === null ? null : Number(object.notional1),
    strategy: object.strategy,
    currencyPair: object.symbol,
    tenor1: {
      name: object.tenor,
      expiryDate: object.expirydate,
      deliveryDate: new Date(),
      spotDate: new Date(),
    },
    tenor2:
      object.tenor1 !== null
        ? {
            name: object.tenor1,
            expiryDate: object.expirydate1,
            deliveryDate: new Date(),
            spotDate: new Date(),
          }
        : null,
    tradeDate: tradeDate,
    spotDate: new Date(),
    premiumDate: premiumDate,
    strike: strike,
    symbol: symbol,
    source: object.source,
    status: object.state,
    deltaStyle: object.deltastyle === "" ? "Forward" : object.deltastyle,
    premiumStyle: object.premstyle === "" ? "Forward" : object.premstyle,
    fwdRate1: object.fwdrate1,
    fwdPts1: object.fwdpts1,
    fwdRate2: object.fwdrate2,
    fwdPts2: object.fwdpts2,
    commissions: await getCommissionRates(object),
    usi: object.usi_num,
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
  const id: string = deal.id;
  const legsCount: number = moStore.getOutLegsCount(deal.strategy);
  const symbol: Symbol = moStore.findSymbolById(deal.currencyPair);
  if (symbol === InvalidSymbol)
    throw new Error("cannot find symbol: " + deal.currencyPair);
  const strategy: MOStrategy = moStore.getStrategyById(deal.strategy);
  if (strategy === InvalidStrategy)
    throw new Error("cannot find strategy: " + deal.strategy);
  return {
    symbol: symbol,
    strategy: strategy,
    premstyle: deal.premiumStyle,
    deltastyle: deal.deltaStyle,
    not1: deal.notional1,
    not2: deal.notional2,
    size: Math.round(deal.notional1 / 1e6),
    legadj: getVegaAdjust(strategy.OptionProductType, deal.symbol),
    buyer: deal.buyer,
    seller: deal.seller,
    tradeDate: deal.tradeDate,
    premiumDate: deal.premiumDate,
    spotDate: deal.spotDate,
    dealID: id.toString(),
    status: deal.status,
    style: "European",
    tenor1: deal.tenor1,
    tenor2: deal.tenor2,
    model: 3,
    legs: legsCount,
    dealstrike: coalesce(deal.strike, strategy.strike),
    vol: deal.vol,
    spread: deal.spread,
    dealType: dealSourceToDealType(deal.source),
    type: EntryType.ExistingDeal,
    fwdpts1: deal.fwdPts1,
    fwdpts2: deal.fwdPts2,
    fwdrate1: deal.fwdRate1,
    fwdrate2: deal.fwdRate2,
    usi: deal.usi,
    commissions: deal.commissions,
  };
};

export const getTenor = (
  deal: Pick<Deal, "tenor1" | "tenor2"> | Pick<DealEntry, "tenor1" | "tenor2">,
  index: number
): Tenor => {
  if (index === 1 && deal.tenor2 !== null) return deal.tenor2;
  return deal.tenor1;
};

export const withDatesResolved = async (deal: Deal): Promise<Deal> => {
  const { symbol, tenor1, tenor2 } = deal;
  const dates1: DealDates = await resolveDealDates(
    symbol,
    tenor1.name,
    deal.tradeDate,
    // If tenor1.name === SPECIFIC use this
    tenor1.expiryDate
  );
  const dates2: DealDates | null =
    tenor2 !== null
      ? await resolveDealDates(
          symbol,
          tenor2.name,
          deal.tradeDate,
          // If tenor1.name === SPECIFIC use this
          tenor2.expiryDate
        )
      : null;
  return {
    ...deal,
    spotDate: dates1.spot,
    tenor1: {
      ...tenor1,
      expiryDate: dates1.expiry,
      deliveryDate: dates1.delivery,
    },
    tenor2:
      dates2 !== null && tenor2 !== null
        ? {
            ...tenor2,
            expiryDate: dates2.expiry,
            deliveryDate: dates2.delivery,
          }
        : null,
  };
};

export const getDealId = (deal: DealEntry): string | undefined => {
  return deal.dealID !== undefined && deal.dealID !== null && deal.dealID !== ""
    ? deal.dealID
    : undefined;
};
