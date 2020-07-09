import { Symbol } from "interfaces/symbol";
import { Message } from "interfaces/message";
import {
  CreateOrder,
  Order,
  DarkPoolOrder,
  OrderMessage,
  CreateOrderBulk,
} from "interfaces/order";
import { MessageResponse } from "interfaces/messageResponse";
import { User } from "interfaces/user";
import { MessageTypes, W } from "interfaces/w";
import { getSideFromType, getCurrentTime } from "utils";
import { STRM } from "stateDefs/workspaceState";
import { Sides } from "interfaces/sides";
import config from "config";
import workareaStore from "mobx/stores/workareaStore";
import { Strategy } from "interfaces/strategy";
import { Deal } from "components/MiddleOffice/interfaces/deal";
import { createDealFromBackendMessage } from "utils/dealUtils";
import { DealEntry } from "structures/dealEntry";
import {
  VolMessageIn,
  OptionLeg,
  ValuationModel,
} from "components/MiddleOffice/interfaces/pricer";
import { Leg } from "components/MiddleOffice/interfaces/leg";
import { MOStrategy } from "components/MiddleOffice/interfaces/moStrategy";
import { LegOptionsDefIn } from "components/MiddleOffice/interfaces/legOptionsDef";
import MO from "mobx/stores/moStore";
import { splitCurrencyPair } from "symbolUtils";
import { getVegaAdjust } from "legsUtils";
import moment from "moment";

const currentTimestampFIXFormat = (): string => {
  const now: moment.Moment = moment();
  return now.format("YYYYMMDD-HH:mm:ss.SSS");
};

const toUrlQuery = (obj: { [key: string]: string } | any): string => {
  const entries: [string, string][] = Object.entries(obj);
  return entries
    .map(([key, value]: [string, string]) => `${key}=${encodeURI(value)}`)
    .join("&");
};

enum ProductSource {
  Electronic = "Electronic",
}

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
  private code: number;
  private message: string;

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

const { Api } = config;

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
  | "price"
  | "valumodel"
  | "optexstyle"
  | "cuts"
  | "optionsproducts"
  | "deals"
  | "exproducts"
  | "request"
  | "legs"
  | "optionlegsdefin"
  | "optionlegsdefout";

type Verb =
  | "get"
  | "create"
  | "cancel"
  | "modify"
  | "cxl"
  | "publish"
  | "save"
  | "cxlall"
  | "clear"
  | "create"
  | "clone"
  | "remove"
  | "pricing";

export class API {
  static FxOpt: string = "/api/fxopt";
  static MarketData: string = `${API.FxOpt}/marketdata`;
  static Oms: string = `${API.FxOpt}/oms`;
  static UserApi: string = "/api/UserApi";
  static Config: string = `${API.FxOpt}/config`;
  static DarkPool: string = `${API.FxOpt}/darkpool`;
  // Middle office
  static Mlo: string = "/api/mlo";
  static Deal: string = `${API.Mlo}/deal`;
  static Legs: string = `${API.Mlo}/legs`;

  static getRawUrl(section: string, rest: string, args?: any): string {
    if (args === undefined)
      return `${Api.Protocol}://${Api.Host}${section}/${rest}`;
    return `${Api.Protocol}://${Api.Host}${section}/${rest}?${toUrlQuery(
      args
    )}`;
  }

  static buildUrl(
    section: string,
    object: Endpoints,
    verb: Verb,
    args?: any
  ): string {
    if (args === undefined)
      return `${Api.Protocol}://${Api.Host}${section}/${verb}${object}`;
    return `${Api.Protocol}://${
      Api.Host
    }${section}/${verb}${object}?${toUrlQuery(args)}`;
  }

  static async getSymbols(region?: string): Promise<Symbol[]> {
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

  static getProducts(): Promise<Strategy[]> {
    const task: Task<Strategy[]> = get<Strategy[]>(
      API.buildUrl(API.Config, "products", "get")
    );
    return task.execute();
  }

  static getTenors(): Promise<string[]> {
    const task: Task<string[]> = get<string[]>(
      API.buildUrl(API.Config, "tenors", "get", { criteria: "Front=true" })
    );
    return task.execute();
  }

  static async executeCreateOrderRequest(
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

  static async createOrdersBulk(
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

  /*static async createOrder(
    order: Order,
    user: User,
    minimumSize: number
  ): PromiseType<MessageResponse> {
    if (order.price === null || order.size === null)
      throw new Error("price and size MUST be specified");
    if (order.size < minimumSize) order.size = minimumSize;
    const { price, size } = order;
    const personality: string = workareaStore.personality;
    // Build a create order request
    if (user.isbroker && personality === STRM)
      throw new Error("brokers cannot create orders when in streaming mode");
    const MDMkt: string | undefined = user.isbroker ? personality : undefined;
    const request: CreateOrder = {
      MsgType: MessageTypes.D,
      TransactTime: getCurrentTime(),
      User: user.email,
      Symbol: order.symbol,
      Strategy: order.strategy,
      Tenor: order.tenor,
      Side: getSideFromType(order.type),
      Quantity: size.toString(),
      Price: price.toString(),
      MDMkt,
    };
    return API.executeCreateOrderRequest(request);
  }

  static async updateOrder(
    entry: Order,
    user: User
  ): PromiseType<MessageResponse> {
    if (entry.price === null || entry.size === null || !entry.orderId)
      throw new Error("price, size and order id MUST be specified");
    const { price, size } = entry;
    // Build a create order request
    const request: UpdateOrder = {
      MsgType: MessageTypes.G,
      TransactTime: getCurrentTime(),
      User: user.email,
      Quantity: size.toString(),
      Price: price.toString(),
      OrderID: entry.orderId,
      Symbol: entry.symbol,
      Strategy: entry.strategy,
      Tenor: entry.tenor,
    };
    return post<MessageResponse>(
      API.buildUrl(API.Oms, "order", "modify"),
      request
    );
  }*/

  static async cancelAllExtended(
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

  static async cancelAll(
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

  static async cancelOrder(order: Order, user: User): Promise<MessageResponse> {
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

  /*static async getDarkTOBPoolSnapshot(
    symbol: string,
    strategy: string
  ): PromiseType<{ [k: string]: W } | null> {
    if (!symbol || !strategy) return null;
    const url: string = API.getRawUrl(API.DarkPool, "tiletobsnapshot", {
      symbol,
      strategy,
    });
    // Execute the query
    return get<{ [k: string]: W } | null>(url);
  }*/

  static async getDarkPoolSnapshot(
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

  static getTOBSnapshot(
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

  static getSnapshot(
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

  static async getMessagesSnapshot(
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

  static async getRunOrders(
    useremail: string,
    symbol: string,
    strategy: string
  ): Promise<OrderMessage[]> {
    const task: Task<OrderMessage[]> = get<OrderMessage[]>(
      API.buildUrl(API.Oms, "runorders", "get", { symbol, strategy, useremail })
    );
    return task.execute();
  }

  static async getUsers(): Promise<User[]> {
    const task: Task<User[]> = get<User[]>(
      API.buildUrl(API.UserApi, "Users", "get")
    );
    return task.execute();
  }

  static async getBanks(): Promise<string[]> {
    const task: Task<string[]> = get<string[]>(
      API.buildUrl(API.Config, "markets", "get")
    );
    return task.execute();
  }

  static async createDarkPoolOrder(order: DarkPoolOrder): Promise<any> {
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

  /*static async modifyDarkPoolOrder(request: any): PromiseType<any> {
    return post<MessageResponse>(
      API.buildUrl(API.DarkPool, "order", "modify"),
      request
    );
  }*/

  static async cancelDarkPoolOrder(order: Order): Promise<any> {
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

  static async cancelAllDarkPoolOrder(
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

  /*static async getDarkPoolMessages(
    useremail: string,
    timestamp: number
  ): PromiseType<any> {
    return get<MessageResponse>(
      API.buildUrl(API.DarkPool, "messages", "get", { useremail, timestamp })
    );
  }*/

  /*static async getDarkPoolRunOrders(request: any): PromiseType<any> {
    return get<MessageResponse>(API.buildUrl(API.DarkPool, "runorders", "get"));
  }*/

  static async publishDarkPoolPrice(
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

  static async getUserProfile(email: string): Promise<[{ workspace: any }]> {
    const task: Task<any> = get<any>(
      API.buildUrl(API.UserApi, "UserJson", "get", { useremail: email })
    );
    return task.execute();
  }

  static async saveUserProfile(data: any) {
    const { useremail, workspace } = data;
    const contentType = "application/x-www-form-urlencoded";
    return post<any>(
      API.buildUrl(API.UserApi, "UserJson", "save"),
      { useremail, workspace },
      contentType
    );
  }

  static async brokerRefAll() {
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
    );
    await post<MessageResponse>(
      API.buildUrl(API.DarkPool, "all", "cxlall"),
      request
    );
    await post<any>(API.buildUrl(API.DarkPool, "price", "clear"));
  }

  static async getUserRegions(useremail: string): Promise<any> {
    const task: Task<any> = get<any>(
      API.buildUrl(API.Config, "userregions", "get", { useremail })
    );
    return task.execute();
  }

  // Middle middle office
  static async getCuts(currency?: string): Promise<any> {
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

  static async getOptexStyle(): Promise<any> {
    const task: Task<any> = get<any>(
      API.buildUrl(API.Config, "optexstyle", "get")
    );
    return task.execute();
  }

  static async getValuModel(): Promise<any> {
    const task: Task<any> = get<any>(
      API.buildUrl(API.Config, "valumodel", "get")
    );
    return task.execute();
  }

  static async getProductsEx(bAllFields = true): Promise<any> {
    const task: Task<any> = get<any>(
      API.buildUrl(API.Config, "exproducts", "get", {
        bAllFields,
      })
    );
    return task.execute();
  }

  private static divideBy100(value: number | null | undefined): number | null {
    if (value === null || value === undefined) return null;
    return value / 100.0;
  }

  static async sendPricingRequest(
    deal: Deal,
    entry: DealEntry,
    legs: Leg[],
    valuationModel: ValuationModel,
    strategy: MOStrategy
  ) {
    const { currencyPair, tradeDate, symbol } = deal;
    const legDefinitions: { in: LegOptionsDefIn[] } =
      MO.legDefinitions[deal.strategy];
    if (!legDefinitions) throw new Error(`invalid strategy ${deal.strategy}`);
    if (currencyPair.length !== 6)
      throw new Error(`unsupported currency ${currencyPair}`);
    const [ccy1, ccy2] = splitCurrencyPair(currencyPair);
    const tradeDateAsDate: Date = tradeDate.toDate();
    const definitions: LegOptionsDefIn[] = legDefinitions.in;
    const request: VolMessageIn = {
      id: deal.dealID,
      Option: {
        ccyPair: currencyPair,
        ccy1: ccy1,
        ccy2: ccy2,
        OptionProductType: strategy.OptionProductType,
        vegaAdjust: getVegaAdjust(strategy.OptionProductType, symbol),
        notionalCCY: symbol.notionalCCY,
        riskCCY: symbol.riskCCY,
        premiumCCY: symbol.premiumCCY,
        OptionLegs: definitions.map(
          (definition: LegOptionsDefIn): OptionLeg => ({
            notional: 1e6 * deal.lastQuantity,
            expiryDate: deal.expiryDate,
            deliveryDate: deal.deliveryDate,
            spreadVolatiltyOffset: API.divideBy100(entry.spread),
            strike: entry.strike,
            volatilty: API.divideBy100(entry.vol),
            barrier: null,
            barrierLower: null,
            barrierUpper: null,
            barrierRebate: null,
            OptionLegType: definition.OptionLegType,
            SideType: definition.SideType,
            MonitorType: null,
          })
        ),
      },
      ValuationData: {
        valuationDate: new Date(),
        VOL: {
          ccyPair: currencyPair,
          premiumAdjustDelta: false,
          snapTime: tradeDateAsDate,
          DateCountBasisType: symbol["DayCountBasis-VOL"],
          VolSurface: [], // To be filled by the pre-pricer
        },
        FX: {
          ccyPair: currencyPair,
          snapTime: tradeDateAsDate,
          DateCountBasisType: symbol["DayCountBasis-FX"],
        },
        RATES: [],
      },
      ValuationModel: valuationModel,
      description: `FXO-${strategy.OptionProductType}-${
        2 * definitions.length
      }-Legs`,
      timeStamp: new Date(),
      version: "arcfintech-volMessage-0.2.2",
    };
    const task: Task<any> = post<any>(config.PricingRequestUrl, request);
    return task.execute();
  }

  static async getDeals(): Promise<Deal[]> {
    const task: Task<Deal[]> = get<Deal[]>(
      API.buildUrl(API.Deal, "deals", "get")
    );
    const array: any[] = await task.execute();
    return array.map(createDealFromBackendMessage);
  }

  static async removeDeal(id: string): Promise<any> {
    const user: User = workareaStore.user;
    const task: Task<any> = httpDelete<any>(
      API.buildUrl(API.Deal, "deal", "remove", {
        linkid: id,
        useremail: user.email,
      })
    );
    return task.execute();
  }

  static async cloneDeal(data: any): Promise<string> {
    const user: User = workareaStore.user;
    const newDeal = {
      tenor: data.tenor,
      strategy: data.strategy,
      symbol: data.symbol,
      lastpx: data.price,
      lastqty: data.size,
      lvsqty: "0",
      cumqty: "0",
      transacttime: currentTimestampFIXFormat(),
      buyer: data.buyer,
      seller: data.seller,
      useremail: user.email,
    };
    const task: Task<string> = post<string>(
      API.buildUrl(API.Deal, "deal", "clone"),
      newDeal
    );
    return task.execute();
  }

  static async createDeal(data: any): Promise<string> {
    const user: User = workareaStore.user;
    const newDeal = {
      tenor: data.tenor,
      strategy: data.strategy,
      symbol: data.symbol,
      lastpx: data.price,
      lastqty: data.size,
      lvsqty: "0",
      cumqty: "0",
      transacttime: currentTimestampFIXFormat(),
      buyer: data.buyer,
      seller: data.seller,
      useremail: user.email,
    };
    const task: Task<string> = post<string>(
      API.buildUrl(API.Deal, "deal", "create"),
      newDeal
    );
    return task.execute();
  }

  static getLegs(dealid: string): Task<any> {
    // We return the task instead of it's execution promise so that
    // the caller can cancel if desired/needed
    return get<any>(API.buildUrl(API.Legs, "legs", "get", { dealid }));
  }

  static async getOptionLegsDefIn(): Promise<any> {
    const task: Task<any> = get<any>(
      API.buildUrl(API.Config, "optionlegsdefin", "get")
    );
    return task.execute();
  }

  static getOptionLegsDefOut(): Promise<any> {
    const task: Task<any> = get<any>(
      API.buildUrl(API.Config, "optionlegsdefout", "get")
    );
    return task.execute();
  }
}
