import { API } from "API";
import { Commission, Deal } from "components/MiddleOffice/types/deal";
import {
  InvalidStrategy,
  MOStrategy,
} from "components/MiddleOffice/types/moStrategy";
import { Globals } from "golbals";
import moStore from "mobx/stores/moStore";
import { DealEntry, DealType, EntryType } from "structures/dealEntry";
import { BankEntity } from "types/bankEntity";
import { DealStatus } from "types/dealStatus";
import { InvalidSymbol, Symbol } from "types/symbol";
import { InvalidTenor, Tenor } from "types/tenor";
import { coalesce } from "utils/commonUtils";
import { getDefaultStrikeForStrategy } from "utils/getDefaultStrikeForStrategy";
import { getVegaAdjust } from "utils/getVegaAdjust";
import {
  addToDate,
  forceParseDate,
  naiveTenorToDate,
  parseTime,
} from "utils/timeUtils";

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

const getSpreadOrVol = (item: any, key: "spread" | "vol"): number | null => {
  const value: any = item[key];
  if (value !== "" && value !== undefined) return value;
  const strategy: MOStrategy | undefined = moStore.getStrategyById(
    item.strategy
  );
  if (strategy === undefined) return null;
  if (strategy.spreadvsvol !== key) return null;
  return item.lastpx / 100;
};

const getSpread = (item: any): number | null => getSpreadOrVol(item, "spread");
const getVol = (item: any): number | null => getSpreadOrVol(item, "vol");

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
  const tenor1: Tenor | null = partialTenor(
    symbol,
    object.tenor,
    object.expirydate
  );
  if (tenor1 === null) {
    throw new Error("invalid backend message for deal, missing tenor");
  }
  const tenor2: Tenor | null = partialTenor(
    symbol,
    object.tenor1,
    object.expirydate1
  );
  const spread: number | null = getSpread(object);
  const vol: number | null = getVol(object);
  const price: number | null = getPrice(object.lastpx, object.pricedvol);
  return {
    id: object.linkid,
    buyer: coalesce(object.buyerentitycode, object.buyer),
    seller: coalesce(object.sellerentitycode, object.seller),
    currency: object.symbol,
    isdarkpool: object.isdarkpool,
    spread: coalesce(spread, price),
    vol: coalesce(vol, price),
    legAdj: object.legadj,
    notional1: Number(object.lastqty) * 1e6,
    notional2: object.notional1 === null ? null : Number(object.notional1),
    strategy: object.strategy,
    currencyPair: object.symbol,
    tenor1: tenor1.name,
    expiryDate1: tenor1.expiryDate,
    tenor2: !!tenor2 ? tenor2.name : undefined,
    expiryDate2: !!tenor2 ? tenor2.expiryDate : undefined,
    tradeDate: tradeDate,
    spotDate: new Date(),
    premiumDate: new Date(),
    price: price,
    strike: strike,
    symbol: symbol,
    source: object.source,
    status: object.state,
    deltaStyle: object.deltastyle === "" ? "Forward" : object.deltastyle,
    premiumStyle: object.premstyle === "" ? "Forward" : object.premstyle,
    commissions: await getCommissionRates(object),
    usi: object.usi_num,
    extraFields: {
      ...JSON.parse(object.extra_fields),
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
    size: deal.notional1 / 1e6,
    legadj: coalesce(deal.legAdj, getVegaAdjust(symbol, strategy)),
    buyer: deal.buyer,
    seller: deal.seller,
    tradeDate: deal.tradeDate,
    premiumDate: deal.premiumDate,
    spotDate: deal.spotDate,
    dealID: id.toString(),
    status: deal.status,
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
    strike: coalesce(deal.strike, strategy.strike),
    vol: deal.vol,
    spread: deal.spread,
    dealType: dealSourceToDealType(deal.source),
    type: EntryType.ExistingDeal,
    usi: deal.usi,
    ...expandCommission(deal.commissions),
    extra_fields: deal.extraFields,
  };
};

export const getTenor = (
  deal: Pick<DealEntry, "tenor1" | "tenor2">,
  index: number
): Tenor | InvalidTenor => {
  const { tenor2 } = deal;
  if (index === 1 && tenor2 !== null && tenor2.name !== "") return tenor2;
  return deal.tenor1;
};

export const getDealId = (deal: DealEntry): string | undefined => {
  return deal.dealID !== undefined && deal.dealID !== null && deal.dealID !== ""
    ? deal.dealID
    : undefined;
};
