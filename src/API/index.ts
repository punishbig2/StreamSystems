import { isInvalidTenor } from "components/FormField/helpers";
import { Deal } from "components/MiddleOffice/types/deal";
import { Leg } from "components/MiddleOffice/types/leg";
import { MOStrategy } from "components/MiddleOffice/types/moStrategy";
import {
  OptionLeg,
  ValuationModel,
  VolMessageIn,
} from "components/MiddleOffice/types/pricer";
import { SummaryLeg } from "components/MiddleOffice/types/summaryLeg";
import config from "config";
import moStore from "mobx/stores/moStore";
import workareaStore from "mobx/stores/workareaStore";
import { STRM } from "stateDefs/workspaceState";
import { DealEntry, ServerDealQuery } from "structures/dealEntry";
import { BankEntity } from "types/bankEntity";
import { BrokerageCommissionResponse } from "types/brokerageCommissionResponse";
import { BrokerageWidthsResponse } from "types/brokerageWidthsResponse";
import {
  CalendarFXTenorsQuery,
  CalendarFXTenorsResponse,
  CalendarVolDatesQuery,
  CalendarVolDatesResponse,
} from "types/calendarFXPair";
import { Message } from "types/message";
import { MessageResponse } from "types/messageResponse";
import {
  CreateOrder,
  CreateOrderBulk,
  DarkPoolOrder,
  Order,
  OrderMessage,
} from "types/order";
import { Sides } from "types/sides";
import { Strategy } from "types/strategy";
import { Symbol } from "types/symbol";
import { InvalidTenor, Tenor } from "types/tenor";
import { User } from "types/user";
import { MessageTypes, W } from "types/w";

import {
  createDealFromBackendMessage,
  getDealId,
  getTenor,
  resolveBankToEntity,
  resolveEntityToBank,
} from "utils/dealUtils";
import { buildFwdRates } from "utils/fwdRates";
import { mergeDefinitionsAndLegs } from "utils/legsUtils";
import {
  currentTimestampFIXFormat,
  naiveTenorToDateString,
  toUTC,
  toUTCFIXFormat,
} from "utils/timeUtils";
import {
  coalesce,
  getCurrentTime,
  getSideFromType,
  numberifyIfPossible,
} from "../utils/commonUtils";

export type BankEntitiesQueryResponse = { [p: string]: BankEntity[] };

const toUrlQuery = (obj: { [key: string]: string } | any): string => {
  const entries: [string, string][] = Object.entries(obj);
  return entries
    .map(([key, value]: [string, string]) => `${key}=${encodeURI(value)}`)
    .join("&");
};

enum Method {
  Get = "GET",
  Post = "POST",
  Delete = "DELETE",
}

enum ReadyState {
  Unsent = 0,
  Opened = 1,
  HeadersReceived = 2,
  Loading = 3,
  Done = 4,
}

export class HTTPError {
  private readonly code: number;
  private readonly message: string;

  constructor(code: number, message: string) {
    this.code = code;
    this.message = message;
  }

  public getMessage = (): string => {
    return this.message;
  };

  public getCode = (): number => {
    return this.code;
  };
}

export interface Task<T> {
  execute(): Promise<T>;

  cancel(): void;
}

enum PromiseStatus {
  Pending,
  Fulfilled,
  Rejected,
}

interface TaskHandler<T> {
  reject(reason: any): void;

  status: PromiseStatus;
}

// Special type to exclude 1 type from a set of types
type NotOfType<T> = T extends string ? never : T;
// Generic request builder
const request = <T>(
  url: string,
  method: Method,
  data?: NotOfType<string>,
  contentType?: string
): Task<T> => {
  const taskHandler: TaskHandler<T> = {
    reject: () => {},
    status: PromiseStatus.Pending,
  };
  // This should be accessible from outside the executor/promise to allow cancellation
  const xhr = new XMLHttpRequest();
  // Executor
  const executor = (
    resolve: (data: T) => void,
    reject: (error?: any) => void
  ): void => {
    taskHandler.reject = reject;
    // Send the request
    xhr.open(method, url, true);
    xhr.onreadystatechange = (): void => {
      switch (xhr.readyState as ReadyState) {
        case ReadyState.Unsent:
          break;
        case ReadyState.Opened:
          break;
        case ReadyState.HeadersReceived:
          break;
        case ReadyState.Loading:
          break;
        case ReadyState.Done:
          if (xhr.status === 0) {
            taskHandler.status = PromiseStatus.Rejected;
            reject();
          } else if (xhr.status >= 200 && xhr.status < 300) {
            const { responseText } = xhr;
            if (responseText.length > 0) {
              try {
                const object: any = JSON.parse(responseText);
                // Return the object converted to the correct type
                taskHandler.status = PromiseStatus.Fulfilled;
                resolve(object as T);
              } catch {
                taskHandler.status = PromiseStatus.Fulfilled;
                // @ts-ignore
                resolve(responseText);
              }
            } else {
              taskHandler.status = PromiseStatus.Fulfilled;
              resolve((null as unknown) as T);
            }
          } else {
            taskHandler.status = PromiseStatus.Rejected;
            reject(new HTTPError(xhr.status, xhr.responseText));
          }
          break;
      }
    };
    if (data) {
      // Content type MUST be json
      if (contentType === undefined || contentType === "application/json") {
        xhr.setRequestHeader("content-type", "application/json");
        xhr.send(JSON.stringify(data));
      } else if (contentType === "application/x-www-form-urlencoded") {
        xhr.setRequestHeader(
          "content-type",
          "application/x-www-form-urlencoded"
        );
        xhr.send(toUrlQuery(data));
      } else {
        throw new Error("unsupported media type");
      }
    } else {
      if (method.toUpperCase() === Method.Post)
        xhr.setRequestHeader("content-type", "application/json");
      xhr.send();
    }
  };
  return {
    execute: (): Promise<T> => new Promise<T>(executor),
    cancel: () => {
      const { status } = taskHandler;
      if (status === PromiseStatus.Pending) {
        taskHandler.reject("aborted");
        xhr.abort();
      }
    },
  };
};

const post = <T>(url: string, data?: any, contentType?: string): Task<T> =>
  request<T>(url, Method.Post, data, contentType);

const get = <T>(url: string, args?: any): Task<T> =>
  request<T>(url, Method.Get, args);

const httpDelete = <T>(url: string, args?: any): Task<T> =>
  request<T>(url, Method.Delete, args);

type Endpoints =
  | "deal"
  | "symbols"
  | "products"
  | "tenors"
  | "order"
  | "bulkorders"
  | "allonpxchg"
  | "messages"
  | "all"
  | "runorders"
  | "UserGroupSymbol"
  | "Users"
  | "UserJson"
  | "markets"
  | "allextended"
  | "userregions"
  | "manual"
  | "price"
  | "valumodel"
  | "optexstyle"
  | "cuts"
  | "optionsproducts"
  | "tradecapreport"
  | "deals"
  | "exproducts"
  | "request"
  | "legs"
  | "optionlegsdefin"
  | "optionlegsdefout"
  | "width"
  | "commission"
  | "deltastyle"
  | "premstyle";

type Verb =
  | "get"
  | "cancel"
  | "modify"
  | "cxl"
  | "publish"
  | "save"
  | "cxlall"
  | "clear"
  | "create"
  | "clone"
  | "update"
  | "remove"
  | "send"
  | "pricing";

export class API {
  public static FxOpt: string = "/api/fxopt";
  public static MarketData: string = `${API.FxOpt}/marketdata`;
  public static Oms: string = `${API.FxOpt}/oms`;
  public static UserApi: string = "/api/UserApi";
  public static Config: string = `${API.FxOpt}/config`;
  public static DarkPool: string = `${API.FxOpt}/darkpool`;
  // Middle office
  public static Mlo: string = "/api/mlo";
  public static Deal: string = `${API.Mlo}/deal`;
  public static SEF: string = `${API.Mlo}/sef`;
  public static Legs: string = `${API.Mlo}/legs`;
  public static Brokerage: string = `${API.Mlo}/brokerage`;
  public static MloConfig = `${API.Mlo}/config`;

  public static getRawUrl(section: string, rest: string, args?: any): string {
    if (args === undefined) return `${config.BackendUrl}${section}/${rest}`;
    return `${config.BackendUrl}${section}/${rest}?${toUrlQuery(args)}`;
  }

  public static buildUrl(
    section: string,
    object: Endpoints,
    verb: Verb,
    args?: any
  ): string {
    if (args === undefined)
      return `${config.BackendUrl}${section}/${verb}${object}`;
    return `${config.BackendUrl}${section}/${verb}${object}?${toUrlQuery(
      args
    )}`;
  }

  public static async getSymbols(region?: string): Promise<Symbol[]> {
    const task: Task<Symbol[]> = get<Symbol[]>(
      API.buildUrl(
        API.Config,
        "symbols",
        "get",
        region ? { region } : undefined
      )
    );
    const currencies: Symbol[] = await task.execute();
    // Sort them and return :)
    currencies.sort((c1: Symbol, c2: Symbol): number => {
      const { name: n1 } = c1;
      const { name: n2 } = c2;
      return (
        1000 * (n1.charCodeAt(0) - n2.charCodeAt(0)) +
        (n1.charCodeAt(4) - n2.charCodeAt(4))
      );
    });
    return currencies;
  }

  public static getProducts(): Promise<Strategy[]> {
    const task: Task<Strategy[]> = get<Strategy[]>(
      API.buildUrl(API.Config, "products", "get")
    );
    return task.execute();
  }

  public static getTenors(): Promise<string[]> {
    const task: Task<string[]> = get<string[]>(
      API.buildUrl(API.Config, "tenors", "get", { criteria: "Front=true" })
    );
    return task.execute();
  }

  public static async executeCreateOrderRequest(
    request: CreateOrder
  ): Promise<MessageResponse> {
    const task: Task<MessageResponse> = await post<MessageResponse>(
      API.buildUrl(API.Oms, "order", "create"),
      request
    );
    const result: MessageResponse = await task.execute();
    if (result.Status !== "Success")
      console.warn(`error creating an order ${result.Response}`);
    return result;
  }

  public static async createOrdersBulk(
    orders: Order[],
    symbol: string,
    strategy: string,
    user: User,
    minimumSize: number
  ): Promise<MessageResponse> {
    const personality: string = workareaStore.personality;
    // Build a create order request
    if (user.isbroker && personality === STRM)
      throw new Error("brokers cannot create orders when in streaming mode");
    const MDMkt: string | undefined = user.isbroker ? personality : undefined;
    const request: CreateOrderBulk = {
      MsgType: MessageTypes.D,
      TransactTime: getCurrentTime(),
      User: user.email,
      Symbol: symbol,
      Strategy: strategy,
      Orders: orders.map((order: Order) => {
        if (order.price === null || order.size === null)
          throw new Error("price and size MUST be specified");
        if (order.size < minimumSize) order.size = minimumSize;
        const { price, size } = order;
        return {
          Side: getSideFromType(order.type),
          Tenor: order.tenor,
          Quantity: size.toString(),
          Price: price.toString(),
        };
      }),
      MDMkt,
    };
    const task: Task<MessageResponse> = await post<MessageResponse>(
      API.buildUrl(API.Oms, "bulkorders", "create"),
      request
    );
    const result: MessageResponse = await task.execute();
    if (result.Status !== "Success")
      console.warn(`error creating an order ${result.Response}`);
    return result;
  }

  public static async cancelAllExtended(
    symbol: string | undefined,
    strategy: string | undefined,
    side: Sides
  ): Promise<MessageResponse> {
    const user: User = workareaStore.user;
    const personality: string = workareaStore.personality;
    const request = {
      MsgType: MessageTypes.F,
      User: user.email,
      TransactTime: getCurrentTime(),
      Side: side,
      Strategy: strategy,
      Symbol: symbol,
      MDMkt: personality,
    };
    const task: Task<MessageResponse> = post<MessageResponse>(
      API.buildUrl(API.Oms, "allextended", "cxl"),
      request
    );
    return task.execute();
  }

  public static async cancelAll(
    symbol: string | undefined,
    strategy: string | undefined,
    side: Sides
  ): Promise<MessageResponse> {
    const user: User = workareaStore.user;
    const request = {
      MsgType: MessageTypes.F,
      User: user.email,
      TransactTime: getCurrentTime(),
      Side: side,
      Strategy: strategy,
      Symbol: symbol,
    };
    const task: Task<MessageResponse> = post<MessageResponse>(
      API.buildUrl(API.Oms, "all", "cancel"),
      request
    );
    return task.execute();
  }

  public static async cancelOrder(
    order: Order,
    user: User
  ): Promise<MessageResponse> {
    if (order.user !== user.email && !user.isbroker)
      throw new Error(
        `cancelling someone else's order: ${order.user} -> ${user.email}`
      );
    const request = {
      MsgType: MessageTypes.F,
      TransactTime: getCurrentTime(),
      User: order.user,
      Symbol: order.symbol,
      Strategy: order.strategy,
      Tenor: order.tenor,
      OrderID: order.orderId,
    };
    const task: Task<MessageResponse> = await post<MessageResponse>(
      API.buildUrl(API.Oms, "order", "cancel"),
      request
    );
    const result: MessageResponse = await task.execute();
    if (result.Status !== "Success") {
      console.warn("error cancelling an order");
    }
    return result;
  }

  public static async getDarkPoolSnapshot(
    symbol: string,
    strategy: string
  ): Promise<{ [k: string]: W } | null> {
    if (!symbol || !strategy) return null;
    const url: string = API.getRawUrl(API.DarkPool, "tilesnapshot", {
      symbol,
      strategy,
    });
    const task: Task<{ [k: string]: W } | null> = get<{
      [k: string]: W;
    } | null>(url);
    // Execute the query
    return task.execute();
  }

  public static getTOBSnapshot(
    symbol: string,
    strategy: string
  ): Promise<{ [k: string]: W } | null> {
    if (!symbol || !strategy)
      throw new Error(
        "you have to tell me which symbol, strategy and tenor you want"
      );
    const url: string = API.getRawUrl(API.MarketData, "tiletobsnapshot", {
      symbol,
      strategy,
    });
    const task: Task<{ [k: string]: W } | null> = get<{
      [k: string]: W;
    } | null>(url);
    // Execute the query
    return task.execute();
  }

  public static getSnapshot(
    symbol: string,
    strategy: string
  ): Promise<{ [k: string]: W } | null> {
    if (!symbol || !strategy)
      throw new Error(
        "you have to tell me which symbol, strategy and tenor you want"
      );
    const url: string = API.getRawUrl(API.MarketData, "tilesnapshot", {
      symbol,
      strategy,
    });
    const task: Task<{ [p: string]: W } | null> = get<{
      [k: string]: W;
    } | null>(url);
    // Execute the query
    return task.execute();
  }

  public static async getMessagesSnapshot(
    useremail: string,
    timestamp: number
  ): Promise<Message[]> {
    const query: any = { timestamp };
    const task1: Task<Message[]> = get<Message[]>(
      API.buildUrl(API.DarkPool, "messages", "get", query)
    );
    const task2: Task<Message[]> = get<Message[]>(
      API.buildUrl(API.Oms, "messages", "get", query)
    );
    const darkpool: Message[] = await task1.execute();
    const normal: Message[] = await task2.execute();
    return [...darkpool, ...normal];
  }

  public static async getRunOrders(
    useremail: string,
    symbol: string,
    strategy: string
  ): Promise<OrderMessage[]> {
    const task: Task<OrderMessage[]> = get<OrderMessage[]>(
      API.buildUrl(API.Oms, "runorders", "get", { symbol, strategy, useremail })
    );
    return task.execute();
  }

  public static async getUsers(): Promise<User[]> {
    const task: Task<User[]> = get<User[]>(
      API.buildUrl(API.UserApi, "Users", "get")
    );
    return task.execute();
  }

  public static async getBanks(): Promise<string[]> {
    const task: Task<string[]> = get<string[]>(
      API.buildUrl(API.Config, "markets", "get")
    );
    return task.execute();
  }

  public static async createDarkPoolOrder(order: DarkPoolOrder): Promise<any> {
    const user: User = workareaStore.user;
    const personality: string = workareaStore.personality;
    if (user.isbroker && order.MDMkt === STRM) {
      throw new Error("brokers cannot create orders when in streaming mode");
    } else if (!user.isbroker) {
      order.MDMkt = user.firm;
    } else {
      order.MDMkt = personality;
    }
    const task: Task<MessageResponse> = post<MessageResponse>(
      API.buildUrl(API.DarkPool, "order", "create"),
      order
    );
    return task.execute();
  }

  public static async cancelDarkPoolOrder(order: Order): Promise<any> {
    const user: User = workareaStore.user;
    const request = {
      MsgType: MessageTypes.F,
      TransactTime: getCurrentTime(),
      User: user.email,
      Symbol: order.symbol,
      Strategy: order.strategy,
      Tenor: order.tenor,
      OrderID: order.orderId,
    };
    const task: Task<MessageResponse> = post<MessageResponse>(
      API.buildUrl(API.DarkPool, "order", "cancel"),
      request
    );
    return task.execute();
  }

  public static async cancelAllDarkPoolOrder(
    currency: string,
    strategy: string,
    tenor: string
  ): Promise<any> {
    const user: User = workareaStore.user;
    const task: Task<MessageResponse> = post<MessageResponse>(
      API.buildUrl(API.DarkPool, "allonpxchg", "cxl"),
      {
        User: user.email,
        Symbol: currency,
        Strategy: strategy,
        Tenor: tenor,
      }
    );
    return task.execute();
  }

  public static async publishDarkPoolPrice(
    user: string,
    symbol: string,
    strategy: string,
    tenor: string,
    price: number | ""
  ): Promise<any> {
    const data = {
      User: user,
      Symbol: symbol,
      Strategy: strategy,
      Tenor: tenor,
      DarkPrice: price,
    };
    const task: Task<any> = post<any>(
      API.buildUrl(API.DarkPool, "price", "publish"),
      data
    );
    return task.execute();
  }

  public static async getUserProfile(
    email: string
  ): Promise<[{ workspace: any }]> {
    const task: Task<any> = get<any>(
      API.buildUrl(API.UserApi, "UserJson", "get", { useremail: email })
    );
    return task.execute();
  }

  public static async saveUserProfile(data: any): Promise<any> {
    const { useremail, workspace } = data;
    const contentType = "application/x-www-form-urlencoded";
    const task: Task<any> = post<any>(
      API.buildUrl(API.UserApi, "UserJson", "save"),
      { useremail, workspace },
      contentType
    );
    return task.execute();
  }

  public static async brokerRefAll() {
    const user: User = workareaStore.user;
    const personality: string = workareaStore.personality;
    const request = {
      MsgType: MessageTypes.F,
      User: user.email,
      MDMkt: personality === STRM ? undefined : personality,
      TransactTime: getCurrentTime(),
    };
    await post<MessageResponse>(
      API.buildUrl(API.Oms, "all", "cxlall"),
      request
    ).execute();
    await post<MessageResponse>(
      API.buildUrl(API.DarkPool, "all", "cxlall"),
      request
    ).execute();
    await post<any>(API.buildUrl(API.DarkPool, "price", "clear")).execute();
  }

  public static async getUserRegions(
    useremail: string
  ): Promise<ReadonlyArray<string>> {
    const task: Task<ReadonlyArray<{ ccyGroup: string }>> = get<any>(
      API.buildUrl(API.Config, "userregions", "get", { useremail })
    );
    const regions = await task.execute();
    return regions.map(
      (region: { ccyGroup: string }): string => region.ccyGroup
    );
  }

  // Middle middle office
  public static async getCuts(currency?: string): Promise<any> {
    if (currency) {
      const task: Task<any> = get<any>(
        API.buildUrl(API.Config, "cuts", "get", { currency })
      );
      return task.execute();
    } else {
      const task: Task<any> = get<any>(API.buildUrl(API.Config, "cuts", "get"));
      return task.execute();
    }
  }

  public static async getOptexStyle(): Promise<any> {
    const task: Task<any> = get<any>(
      API.buildUrl(API.Config, "optexstyle", "get")
    );
    return task.execute();
  }

  public static async getBankEntities(): Promise<BankEntitiesQueryResponse> {
    const task: Task<BankEntitiesQueryResponse> = get<
      BankEntitiesQueryResponse
    >(config.PrePricerUrl + "/entities");
    return task.execute();
  }

  public static async getValuModel(): Promise<any> {
    const task: Task<any> = get<any>(
      API.buildUrl(API.Config, "valumodel", "get")
    );
    return task.execute();
  }

  public static async getProductsEx(): Promise<any> {
    const task: Task<any> = get<any>(
      API.buildUrl(API.Config, "exproducts", "get", {
        bAllFields: true,
      })
    );
    return task.execute();
  }

  public static async sendPricingRequest(
    entry: DealEntry,
    legs: ReadonlyArray<Leg>,
    summaryLeg: SummaryLeg | null,
    valuationModel: ValuationModel,
    strategy: MOStrategy
  ): Promise<void> {
    const { tradeDate, symbol } = entry;
    if (entry.dealID === undefined)
      throw new Error("cannot price an transient deal");
    const mergedDefinitions: ReadonlyArray<Leg> = mergeDefinitionsAndLegs(
      entry,
      strategy,
      symbol,
      legs
    );
    const ccyPair: string = symbol.symbolID;
    const legsPromises = mergedDefinitions.map(
      async (leg: Leg, index: number): Promise<OptionLeg> => {
        const { strategy } = entry;
        const tenor: Tenor | InvalidTenor = getTenor(entry, index);
        if (isInvalidTenor(tenor))
          throw new Error(
            "cannot build pricing request without a valid tenor or expiry date for each leg"
          );
        const spread: number | null =
          strategy.productid === "Butterfly-2Leg" && index > 0
            ? null
            : coalesce(entry.spread, null);
        const vol: number | null =
          strategy.productid === "Butterfly-2Leg" && index > 0
            ? null
            : coalesce(leg.vol, entry.vol);
        const notional: number = coalesce(
          index === 1 ? entry.not2 : entry.not1,
          entry.not1
        );
        // We know that the tenor has valid dates now
        const { expiryDate, deliveryDate } = tenor;
        if (deliveryDate === undefined)
          throw new Error("bad tenor for leg " + index);
        return {
          notional: notional,
          expiryDate: toUTC(expiryDate),
          deliveryDate: toUTC(deliveryDate),
          spreadVolatiltyOffset: spread,
          strike: numberifyIfPossible(
            coalesce(leg.strike, coalesce(entry.dealstrike, strategy.strike))
          ),
          volatilty: vol,
          barrier: null,
          barrierLower: null,
          barrierUpper: null,
          barrierRebate: null,
          OptionLegType: leg.option,
          SideType: leg.side.toUpperCase(),
          MonitorType: null,
        };
      }
    );
    if (entry.spotDate === null) {
      throw new Error("entry does not have spot date");
    }
    if (entry.horizonDateUTC === undefined) {
      throw new Error("for some reason horizonDateUTC was not set");
    }
    const request: VolMessageIn = {
      id: entry.dealID,
      Option: {
        ccyPair: ccyPair,
        ccy1: symbol.notionalCCY,
        ccy2: ccyPair.replace(symbol.notionalCCY, ""),
        OptionProductType: strategy.OptionProductType,
        vegaAdjust: entry.legadj,
        notionalCCY: symbol.notionalCCY,
        riskCCY: symbol.riskCCY,
        premiumCCY: symbol.premiumCCY,
        OptionLegs: await Promise.all(legsPromises),
      },
      ValuationData: {
        valuationDate: entry.horizonDateUTC,
        valuationDateUTC: entry.horizonDateUTC,
        VOL: {
          ccyPair: ccyPair,
          premiumAdjustDelta: symbol.premiumAdjustDelta,
          snapTime: tradeDate,
          DateCountBasisType: symbol["DayCountBasis-VOL"],
          VolSurface: [], // To be filled by the pre-pricer
        },
        FX: {
          ccyPair: ccyPair,
          snapTime: tradeDate,
          DateCountBasisType: symbol["DayCountBasis-FX"],
          ForwardRates: buildFwdRates(
            summaryLeg,
            strategy,
            entry.tenor1,
            entry.tenor2
          ),
        },
        RATES: [],
      },
      ValuationModel: valuationModel,
      description: `FXO-${strategy.OptionProductType}-${legs.length}-Legs`,
      timeStamp: toUTC(new Date()),
      spotDate: toUTC(entry.spotDate),
      version: "arcfintech-volMessage-0.2.2",
    };
    const task: Task<any> = post<any>(config.PricerUrl, request);
    return task.execute();
  }

  public static async getDeals(dealid?: string): Promise<Deal[]> {
    const task: Task<Deal[]> = get<Deal[]>(
      API.buildUrl(API.Deal, "deals", "get"),
      dealid !== undefined ? { dealid } : undefined
    );
    const array: any[] | null = await task.execute();
    if (array === null) return [];
    const promises: Promise<Deal>[] = array.map(createDealFromBackendMessage);
    return Promise.all(promises);
  }

  public static async removeDeal(id: string): Promise<any> {
    const user: User = workareaStore.user;
    const task: Task<any> = httpDelete<any>(
      API.buildUrl(API.Deal, "deal", "remove", {
        linkid: id,
        useremail: user.email,
      })
    );
    return task.execute();
  }

  private static createDealRequest(
    entry: DealEntry,
    changed: string[]
  ): ServerDealQuery {
    const user: User = workareaStore.user;
    const { symbol, strategy, tenor1, tenor2 } = entry;
    if (isInvalidTenor(tenor1))
      throw new Error("cannot build deal query without at least 1 tenor");
    return {
      linkid: getDealId(entry),
      tenor: tenor1.name,
      tenor1: tenor2 !== null ? tenor2.name : null,
      strategy: strategy.productid,
      symbol: symbol.symbolID,
      spread: entry.spread,
      vol: entry.vol,
      lastqty: entry.size,
      notional1: entry.not1,
      size: entry.size,
      lvsqty: "0",
      cumqty: "0",
      transacttime: currentTimestampFIXFormat(),
      buyerentitycode: resolveBankToEntity(entry.buyer),
      sellerentitycode: resolveBankToEntity(entry.seller),
      buyer: resolveEntityToBank(entry.buyer),
      seller: resolveEntityToBank(entry.seller),
      useremail: user.email,
      strike: entry.dealstrike,
      expirydate: toUTCFIXFormat(tenor1.expiryDate),
      expirydate1: tenor2 !== null ? toUTCFIXFormat(tenor2.expiryDate) : null,
      fwdrate1: entry.fwdrate1,
      fwdpts1: entry.fwdpts1,
      fwdrate2: entry.fwdrate2,
      fwdpts2: entry.fwdpts2,
      deltastyle: entry.deltastyle,
      premstyle: entry.premstyle,
      product_fields_changed: changed,
    };
  }

  private static async saveLegs(dealID: string): Promise<string> {
    const { user } = workareaStore;
    const { legs } = moStore;
    console.log(legs);
    const task = post<string>(API.buildUrl(API.Legs, "manual", "save"), {
      dealId: dealID,
      useremail: user.email,
      legs: legs,
    });
    return task.execute();
  }

  public static async sendTradeCaptureReport(dealID: string): Promise<string> {
    const user: User = workareaStore.user;
    const task: Task<string> = post<string>(
      API.buildUrl(API.SEF, "tradecapreport", "send"),
      {
        dealID: dealID,
        useremail: user.email,
      }
    );
    return task.execute();
  }

  public static async updateDeal(
    data: DealEntry,
    changed: string[]
  ): Promise<string> {
    if (data.dealID === undefined)
      throw new Error("to save an existing deal please provide an id");
    await API.saveLegs(data.dealID);
    // Save the deal now
    const task: Task<string> = post<string>(
      API.buildUrl(API.Deal, "deal", "update"),
      API.createDealRequest(data, changed)
    );
    return task.execute();
  }

  public static async cloneDeal(
    data: DealEntry,
    changed: string[]
  ): Promise<string> {
    const task: Task<string> = post<string>(
      API.buildUrl(API.Deal, "deal", "clone"),
      API.createDealRequest(data, changed)
    );
    const dealID: string = await task.execute();
    // Save the legs now
    await API.saveLegs(dealID);
    return dealID;
  }

  public static async createDeal(
    data: DealEntry,
    changed: string[]
  ): Promise<string> {
    const task: Task<string> = post<string>(
      API.buildUrl(API.Deal, "deal", "create"),
      API.createDealRequest(data, changed)
    );
    const dealID: string = await task.execute();
    // Save the legs now
    await API.saveLegs(dealID);
    return dealID;
  }

  public static getLegs(dealid: string | undefined): Task<Leg[] | null> {
    if (dealid === undefined)
      return {
        execute: async (): Promise<null> => null,
        cancel: () => undefined,
      };
    // We return the task instead of it's execution promise so that
    // the caller can cancel if desired/needed
    return get<any>(API.buildUrl(API.Legs, "legs", "get", { dealid }));
  }

  public static async getOptionLegsDefIn(): Promise<any> {
    const task: Task<any> = get<any>(
      API.buildUrl(API.Config, "optionlegsdefin", "get")
    );
    return task.execute();
  }

  public static getOptionLegsDefOut(): Promise<any> {
    const task: Task<any> = get<any>(
      API.buildUrl(API.Config, "optionlegsdefout", "get")
    );
    return task.execute();
  }

  public static getBrokerageWidths(
    ccypair: string,
    strategy: string
  ): Task<BrokerageWidthsResponse> {
    return get<BrokerageWidthsResponse>(
      API.buildUrl(API.Brokerage, "width", "get", {
        ccypair,
        strategy,
      })
    );
  }

  public static getBrokerageCommission(
    firm: string
  ): Task<BrokerageCommissionResponse> {
    return get<BrokerageCommissionResponse>(
      API.buildUrl(API.Brokerage, "commission", "get", {
        firm,
      })
    );
  }

  public static getDeltaStyles(): Promise<ReadonlyArray<string>> {
    const task: Task<ReadonlyArray<string>> = get<ReadonlyArray<string>>(
      API.buildUrl(API.MloConfig, "deltastyle", "get")
    );
    return task.execute();
  }

  public static getPremiumStyles(): Promise<ReadonlyArray<string>> {
    const task: Task<ReadonlyArray<string>> = get<ReadonlyArray<string>>(
      API.buildUrl(API.MloConfig, "premstyle", "get")
    );
    return task.execute();
  }

  public static async queryFxTenorsDates(
    query: CalendarFXTenorsQuery
  ): Promise<CalendarFXTenorsResponse> {
    const url: string =
      config.CalendarServiceBaseUrl + "/api/calendar/fxpair/fx/tenors";
    const task: Task<CalendarFXTenorsResponse> = post<CalendarFXTenorsResponse>(
      url,
      query
    );
    return task.execute();
  }

  public static async queryVolDates(
    query: CalendarVolDatesQuery
  ): Promise<CalendarVolDatesResponse> {
    const { Tenors } = query;
    const url: string =
      config.CalendarServiceBaseUrl + "/api/calendar/fxpair/vol/dates";
    const task: Task<CalendarVolDatesResponse> = post<CalendarVolDatesResponse>(
      url,
      {
        ...query,
        ExpiryDates: Tenors.map(naiveTenorToDateString),
        rollExpiryDates: true,
      }
    );
    return task.execute();
  }
}
