import { API, BankEntitiesQueryResponse, Task } from "API";
import { isTenor } from "components/FormField/helpers";
import { Commission, Deal } from "components/MiddleOffice/types/deal";
import { Leg } from "components/MiddleOffice/types/leg";
import { Globals } from "golbals";
import { MiddleOfficeStore } from "mobx/stores/middleOfficeStore";
import { DealEntry, DealType, EntryType } from "types/dealEntry";
import { BankEntity } from "types/bankEntity";
import { DealStatus } from "types/dealStatus";
import { FixTenorResult } from "types/fixTenorResult";
import { InvalidStrategy, Product } from "types/product";
import { InvalidSymbol, Symbol } from "types/symbol";
import { InvalidTenor, Tenor } from "types/tenor";
import { coalesce, tryToNumber } from "utils/commonUtils";
import { getDefaultStrikeForStrategy } from "utils/getDefaultStrikeForStrategy";
import { DecimalSeparator, isNumeric } from "utils/isNumeric";
import {
  addToDate,
  forceParseDate,
  naiveTenorToDate,
  parseTime,
  safeForceParseDate,
} from "utils/timeUtils";

export const stateMap: { [key: number]: string } = {
  [DealStatus.Pending]: "Pending",
  [DealStatus.Priced]: "Priced",
  [DealStatus.SEFSubmitted]: "SEF Submitted",
  [DealStatus.SEFFailed]: "SEF Failed",
  [DealStatus.SEFComplete]: "SEF Complete",
  [DealStatus.STPSubmitted]: "STP Submitted",
  [DealStatus.STPFailed]: "STP Failed",
  [DealStatus.STPComplete]: "STP Complete",
};

export const resolveEntityToBank = (
  source: string,
  entitiesMap: { [p: string]: BankEntity }
): string => {
  const bank: BankEntity | undefined = entitiesMap[source];
  if (bank === undefined) {
    return source;
  }
  return bank.id;
};

export const resolveBankToEntity = (
  source: string,
  entities: BankEntitiesQueryResponse
): string => {
  const bank: BankEntity[] | undefined = entities[source];
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
    const deals: ReadonlyArray<{ [key: string]: any }> = await API.getDeals();
    if (deals.length === 0) return undefined;
    const found: { [key: string]: any } | undefined = deals.find(
      (deal: { [key: string]: any }): boolean => deal.id === item.linkid
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

const getSpreadOrVol = (
  item: any,
  key: "spread" | "vol",
  strategy: Product | undefined
): number | null => {
  const value: any = item[key];
  if (value !== "" && value !== undefined) return value;
  if (strategy === undefined) return null;
  if (strategy.spreadvsvol !== key) return null;
  return item.lastpx / 100;
};

const getSpread = (item: any, strategy: Product | undefined): number | null =>
  getSpreadOrVol(item, "spread", strategy);
const getVol = (item: any, strategy: Product | undefined): number | null =>
  getSpreadOrVol(item, "vol", strategy);

const partialTenor = (
  symbol: Symbol,
  name: string | undefined,
  expiryDate: string
): Tenor | null => {
  if (name === undefined) return null;
  const date: Date | null =
    expiryDate === "" ? null : forceParseDate(expiryDate);
  if (date === undefined) {
    const expiry: Date = naiveTenorToDate(name);
    return {
      name: name,
      deliveryDate: addToDate(expiry, symbol.SettlementWindow, "d"),
      expiryDate: expiry,
    };
  } else {
    return {
      name: name,
      ...(date !== null
        ? { deliveryDate: addToDate(date, symbol.SettlementWindow, "d") }
        : { deliveryDate: new Date() }),
      ...(date !== null ? { expiryDate: date } : { expiryDate: new Date() }),
    };
  }
};

const getPrice = (first: any, second: any): number | null => {
  if (first !== undefined && first !== null) {
    return first / 100;
  } else if (second !== undefined && second !== null) {
    return second / 100;
  } else {
    return null;
  }
};

const JSONSafelyParse = (
  data: unknown
): { [key: string]: string | number | null } | undefined => {
  if (typeof data === "string") {
    try {
      return JSON.parse(data);
    } catch {
      return undefined;
    }
  } else if (typeof data === "undefined") {
    return undefined;
  } else if (data === null) {
    return undefined;
  } else {
    console.warn("passing a non string to json parse: ", data);
    return undefined;
  }
};

const getDealPrice = (deal: Deal, legs: ReadonlyArray<Leg>): number | null => {
  if (deal.vol !== undefined && deal.vol !== null) return 100 * deal.vol;
  if (deal.spread !== undefined && deal.spread !== null)
    return 100 * deal.spread;
  if (deal.price === null || deal.price === undefined) {
    if (legs.length === 0) return null;
    if (legs[0].vol === undefined) return null;
    return legs[0].vol;
  }
  return deal.price;
};

export const createDealFromBackendMessage = async (
  source: { [key: string]: any } | string,
  symbol: Symbol,
  strategy: Product,
  defaultLegAdjust: string | null,
  legs: ReadonlyArray<Leg>
): Promise<Deal> => {
  const data: any = typeof source === "string" ? JSON.parse(source) : source;
  const tradeDate: Date = parseTime(data.transacttime, Globals.timezone);
  const strike: string = coalesce(
    data.strike,
    getDefaultStrikeForStrategy(data.strategy)
  );
  const tenor1: Tenor | null = partialTenor(
    symbol,
    data.tenor,
    data.expirydate
  );
  if (tenor1 === null) {
    throw new Error("invalid backend message for deal, missing tenor");
  }
  const tenor2: Tenor | null = partialTenor(
    symbol,
    data.tenor1,
    data.expirydate1
  );
  const spread: number | null = getSpread(data, strategy);
  const vol: number | null = getVol(data, strategy);
  const price: number | null = getPrice(data.lastpx, data.pricedvol);
  const deal = {
    id: data.linkid,
    buyer: coalesce(data.buyerentitycode, data.buyer),
    buyer_useremail: data.buyer_useremail,
    seller: coalesce(data.sellerentitycode, data.seller),
    seller_useremail: data.seller_useremail,
    currency: data.symbol,
    isdarkpool: data.isdarkpool,
    spread: coalesce(spread, price),
    vol: coalesce(vol, price),
    legAdj: coalesce(data.legadj, defaultLegAdjust),
    notional1: Number(data.lastqty) * 1e6,
    notional2: data.notional1 === null ? null : Number(data.notional1),
    strategy: data.strategy,
    currencyPair: data.symbol,
    tenor1: tenor1.name,
    expiryDate1: tenor1.expiryDate,
    tenor2: !!tenor2 ? tenor2.name : undefined,
    expiryDate2: !!tenor2 ? tenor2.expiryDate : undefined,
    tradeDate: tradeDate,
    spotDate: new Date(),
    premiumDate: new Date(),
    price: price,
    strike: strike === "" ? null : tryToNumber(strike),
    symbol: symbol,
    source: data.source,
    status: data.state,
    sef_namespace: !!data.sef_namespace ? data.sef_namespace : null,
    deltaStyle: data.deltastyle === "" ? "Forward" : data.deltastyle,
    premiumStyle: data.premstyle === "" ? "Forward" : data.premstyle,
    commissions: await getCommissionRates(data),
    usi: data.usi_num,
    extraFields: JSONSafelyParse(data.extra_fields),
    error_msg: data.error_msg,
    dealPrice: null,
  };
  return { ...deal, dealPrice: getDealPrice(deal, legs) };
};

export const dealSourceToDealType = (source: string): DealType => {
  if (!source) return DealType.Invalid;
  switch (source.toLowerCase()) {
    case "manual":
      return DealType.Voice;
    case "electronic":
      return DealType.Electronic;
    case "cloned":
      return DealType.Cloned;
    case "multileg":
      return DealType.Manual;
    default:
      return DealType.Invalid;
  }
};

const expandCommission = (commission?: {
  buyer: Commission;
  seller: Commission;
}): Pick<
  DealEntry,
  "buyer_comm" | "buyer_comm_rate" | "seller_comm" | "seller_comm_rate"
> => {
  if (!commission) {
    return {
      buyer_comm: null,
      buyer_comm_rate: null,
      seller_comm: null,
      seller_comm_rate: null,
    };
  }
  const { buyer, seller } = commission;
  return {
    buyer_comm: buyer ? buyer.value : null,
    buyer_comm_rate: buyer ? buyer.rate : null,
    seller_comm: seller ? seller.value : null,
    seller_comm_rate: seller ? seller.rate : null,
  };
};

const resolveDatesIfNeeded = (entry: DealEntry): Task<DealEntry> => {
  const { tenor1, tenor2 } = entry;
  // Query dates for regular tenors
  const task1: Task<FixTenorResult> = MiddleOfficeStore.fixTenorDates(
    tenor1,
    entry
  );
  const task2: Task<FixTenorResult> = MiddleOfficeStore.fixTenorDates(
    tenor2,
    entry
  );
  return {
    execute: async (): Promise<DealEntry> => {
      const tenor1Dates: FixTenorResult = await task1.execute();
      const tenor2Dates: FixTenorResult = await task2.execute();
      const spotDate: Date | null = forceParseDate(tenor1Dates.spotDate);
      return {
        ...entry,
        tenor1: !!tenor1Dates.tenor ? tenor1Dates.tenor : tenor1,
        tenor2: tenor2Dates.tenor,
        ...safeForceParseDate("horizonDateUTC", tenor1Dates.horizonDateUTC),
        premiumDate: spotDate,
        spotDate: spotDate,
      };
    },
    cancel: (): void => {
      task2.cancel();
      task1.cancel();
    },
  };
};

const toStrike = (rawValue: any): string | undefined => {
  if (typeof rawValue !== "string") {
    return rawValue;
  } else {
    const normalized = rawValue.replaceAll(/[.,]/g, DecimalSeparator);
    if (isNumeric(normalized)) {
      return normalized;
    } else {
      return rawValue;
    }
  }
};

export const createDealEntry = (
  deal: Deal,
  legsCount: number,
  symbol: Symbol,
  strategy: Product,
  defaultLegAdjust: string | null
): Task<DealEntry> => {
  const id: string = deal.id;
  // const legsCount: number = moStore.getOutLegsCount(deal.strategy);
  // const symbol: Symbol = moStore.findSymbolById(deal.currencyPair);
  if (symbol === InvalidSymbol)
    throw new Error("cannot find symbol: " + deal.currencyPair);
  // const strategy: Product = moStore.getStrategyById(deal.strategy);
  if (strategy === InvalidStrategy)
    throw new Error("cannot find strategy: " + deal.strategy);
  const entry: DealEntry = {
    symbol: symbol,
    strategy: strategy,
    premstyle: deal.premiumStyle,
    deltastyle: deal.deltaStyle,
    not1: deal.notional1,
    not2: deal.notional2,
    size: deal.notional1 / 1e6,
    legadj: coalesce(deal.legAdj, defaultLegAdjust),
    buyer: deal.buyer,
    buyer_useremail: deal.buyer_useremail,
    seller: deal.seller,
    seller_useremail: deal.seller_useremail,
    tradeDate: deal.tradeDate,
    premiumDate: deal.premiumDate,
    spotDate: deal.spotDate,
    dealID: id.toString(),
    status: deal.status,
    sef_namespace: deal.sef_namespace,
    style: "European",
    tenor1: {
      name: deal.tenor1,
      deliveryDate: addToDate(deal.expiryDate1, symbol.SettlementWindow, "d"),
      expiryDate: deal.expiryDate1,
    },
    tenor2:
      deal.tenor2 !== undefined && deal.expiryDate2 !== undefined
        ? {
            name: deal.tenor2,
            deliveryDate: addToDate(
              deal.expiryDate2,
              symbol.SettlementWindow,
              "d"
            ),
            expiryDate: deal.expiryDate2,
          }
        : null,
    model: 3,
    legs: legsCount,
    dealstrike: toStrike(coalesce(deal.strike, strategy.strike)),
    vol: deal.vol,
    spread: deal.spread,
    dealType: dealSourceToDealType(deal.source),
    type: EntryType.ExistingDeal,
    usi: deal.usi,
    ...expandCommission(deal.commissions),
    extra_fields: deal.extraFields,
    errorMsg: deal.error_msg,
  };
  return resolveDatesIfNeeded(entry);
};

export const getTenor = (
  deal: Pick<DealEntry, "tenor1" | "tenor2">,
  index: number
): Tenor | InvalidTenor => {
  const { tenor1, tenor2 } = deal;
  if (index === 1 && isTenor(tenor2)) {
    return tenor2;
  }
  return tenor1;
};

export const getDealId = (deal: DealEntry): string | undefined => {
  return deal.dealID !== undefined && deal.dealID !== null && deal.dealID !== ""
    ? deal.dealID
    : undefined;
};
