import { getExtraFields } from 'API/getExtraFields';
import { isInvalidTenor, isTenor } from 'components/FormField/helpers';
import { Leg } from 'components/MiddleOffice/types/leg';
import { LegOptionsDefIn } from 'components/MiddleOffice/types/legOptionsDef';
import { OptionLeg, ValuationModel, VolMessageIn } from 'components/MiddleOffice/types/pricer';
import { SummaryLeg } from 'components/MiddleOffice/types/summaryLeg';
import config from 'config';
import workareaStore from 'mobx/stores/workareaStore';
import { NotApplicableProxy } from 'notApplicableProxy';
import { NONE } from 'stateDefs/workspaceState';
import { BankEntity } from 'types/bankEntity';
import { BrokerageCommissionResponse } from 'types/brokerageCommissionResponse';
import { BrokerageWidthsResponse } from 'types/brokerageWidthsResponse';
import { CalendarVolDatesQuery, CalendarVolDatesResponse } from 'types/calendarFXPair';
import { DarkPoolQuote } from 'types/darkPoolQuote';
import { DealEntry, ServerDealQuery } from 'types/dealEntry';
import { FXSymbol } from 'types/FXSymbol';
import { GetDealsDateRange } from 'types/getDealsDateRange';
import { LegAdjustValue } from 'types/legAdjustValue';
import { Message } from 'types/message';
import { MessageResponse } from 'types/messageResponse';
import { CreateOrderBulk, DarkPoolOrder, FIXMessage, Order, OrderMessage } from 'types/order';
import { Product } from 'types/product';
import { hasRole, OktaUser, Role } from 'types/role';
import { Sides } from 'types/sides';
import { InvalidTenor, Tenor } from 'types/tenor';
import { OCOModes, User, UserInfo } from 'types/user';
import { MessageTypes, W } from 'types/w';
import { WorkSchedule } from 'types/workSchedule';
import {
  coalesce,
  floatAsString,
  getCurrentTime,
  getSideFromType,
  tryToNumber,
} from 'utils/commonUtils';
import { getDealId, getTenor, resolveBankToEntity, resolveEntityToBank } from 'utils/dealUtils';
import { buildFwdRates } from 'utils/fwdRates';
import { toNumber } from 'utils/isNumeric';
import { mergeDefinitionsAndLegs } from 'utils/legsUtils';
import { forceParseDate, toUTC, toUTCFIXFormat } from 'utils/timeUtils';
import { toValidNumberStringDumb } from 'utils/toValidNumberString';

export type BankEntitiesQueryResponse = { [p: string]: BankEntity[] };

const toUrlQuery = (obj: { [key: string]: string } | any): string => {
  const entries: Array<[string, string]> = Object.entries(obj);
  return entries.map(([key, value]: [string, string]) => `${key}=${encodeURI(value)}`).join('&');
};

enum Method {
  Get = 'GET',
  Post = 'POST',
  Delete = 'DELETE',
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

interface TaskHandler<_T> {
  status: PromiseStatus;

  reject(reason: any): void;
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
    reject: () => {
      return;
    },
    status: PromiseStatus.Pending,
  };
  // This should be accessible from outside the executor/promise to allow cancellation
  const xhr = new XMLHttpRequest();
  // Executor
  const executor = (resolve: (data: T) => void, reject: (error?: any) => void): void => {
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
                // FIXME: what is this?
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore
                resolve(responseText);
              }
            } else {
              taskHandler.status = PromiseStatus.Fulfilled;
              resolve(null as unknown as T);
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
      if (contentType === undefined || contentType === 'application/json') {
        xhr.setRequestHeader('content-type', 'application/json');
        xhr.send(JSON.stringify(data));
      } else if (contentType === 'application/x-www-form-urlencoded') {
        xhr.setRequestHeader('content-type', 'application/x-www-form-urlencoded');
        xhr.send(toUrlQuery(data));
      } else {
        throw new Error('unsupported media type');
      }
    } else {
      if (method.toUpperCase() === Method.Post)
        xhr.setRequestHeader('content-type', 'application/json');
      xhr.send();
    }
  };
  return {
    execute: (): Promise<T> => new Promise<T>(executor),
    cancel: () => {
      const { status } = taskHandler;
      if (status === PromiseStatus.Pending) {
        taskHandler.reject('aborted');
        xhr.abort();
      }
    },
  };
};

const POST = <T>(url: string, data?: any, contentType?: string): Task<T> =>
  request<T>(url, Method.Post, data, contentType);

const GET = <T>(url: string, args?: any): Task<T> => request<T>(url, Method.Get, args);

const DELETE = <T>(url: string, args?: any): Task<T> => request<T>(url, Method.Delete, args);

type Endpoints =
  | 'timetable'
  | 'legadjustvalues'
  | 'deal'
  | 'symbols'
  | 'products'
  | 'tenors'
  | 'order'
  | 'bulkorders'
  | 'allonpxchg'
  | 'messages'
  | 'all'
  | 'runorders'
  | 'UserGroupSymbol'
  | 'AllUsers'
  | 'UserInfo'
  | 'UserJson'
  | 'markets'
  | 'allextended'
  | 'userregions'
  | 'manual'
  | 'price'
  | 'valumodel'
  | 'optexstyle'
  | 'cuts'
  | 'optionsproducts'
  | 'tradecapreport'
  | 'deals'
  | 'exproducts'
  | 'request'
  | 'report'
  | 'legs'
  | 'optionlegsdefin'
  | 'optionlegsdefout'
  | 'width'
  | 'commission'
  | 'deltastyle'
  | 'premstyle'
  | 'lastquote';

type Verb =
  | 'get'
  | 'cancel'
  | 'modify'
  | 'cxl'
  | 'publish'
  | 'save'
  | 'cxlall'
  | 'clear'
  | 'create'
  | 'clone'
  | 'update'
  | 'remove'
  | 'send'
  | 'pricing';

export class API {
  public static FxOpt = '/api/fxopt';
  public static MarketData = `${API.FxOpt}/marketdata`;
  public static Oms = `${API.FxOpt}/oms`;
  public static UserApi = '/api/UserApi';
  public static Config = `${API.FxOpt}/config`;
  public static DarkPool = `${API.FxOpt}/darkpool`;
  // Middle office
  public static Mlo = '/api/mlo';
  public static Deal = `${API.Mlo}/deal`;
  public static SEF = `${API.Mlo}/sef`;
  public static STP = `${API.Mlo}/stp`;
  public static Legs = `${API.Mlo}/legs`;
  public static Brokerage = `${API.Mlo}/brokerage`;
  public static MloConfig = `${API.Mlo}/config`;

  public static getRawUrl(section: string, rest: string, args?: any): string {
    if (args === undefined) return `${config.BackendUrl}${section}/${rest}`;
    return `${config.BackendUrl}${section}/${rest}?${toUrlQuery(args)}`;
  }

  public static buildUrl(section: string, object: Endpoints, verb: Verb, args?: any): string {
    if (args === undefined) return `${config.BackendUrl}${section}/${verb}${object}`;
    return `${config.BackendUrl}${section}/${verb}${object}?${toUrlQuery(args)}`;
  }

  public static async getTimeTable(): Promise<readonly WorkSchedule[]> {
    const task: Task<readonly WorkSchedule[]> = GET<readonly WorkSchedule[]>(
      API.buildUrl(API.Config, 'timetable', 'get')
    );
    return task.execute();
  }

  public static async getSymbols(region?: string): Promise<readonly FXSymbol[]> {
    const task: Task<FXSymbol[]> = GET<FXSymbol[]>(
      API.buildUrl(API.Config, 'symbols', 'get', region ? { region } : undefined)
    );
    const currencies: FXSymbol[] = await task.execute();
    // Sort them and return :)
    currencies.sort((c1: FXSymbol, c2: FXSymbol): number => {
      return c1.rank - c2.rank;
    });
    return currencies;
  }

  public static getProducts(): Promise<Product[]> {
    const task: Task<Product[]> = GET<Product[]>(API.buildUrl(API.Config, 'products', 'get'));
    return task.execute();
  }

  public static getTenors(): Promise<string[]> {
    const task: Task<string[]> = GET<string[]>(
      API.buildUrl(API.Config, 'tenors', 'get', { criteria: 'Front=true' })
    );
    return task.execute();
  }

  public static async executeCreateOrderRequest(request: FIXMessage): Promise<MessageResponse> {
    const task: Task<MessageResponse> = await POST<MessageResponse>(
      API.buildUrl(API.Oms, 'order', 'create'),
      request
    );
    const result: MessageResponse = await task.execute();
    if (result === null) {
      console.warn('the server did not respond apparently');
    } else if (result.Status !== 'Success') {
      console.warn(`error creating an order ${result.Response}`);
    }
    return result;
  }

  public static getCancelCondition(): { CancelCondition?: number } {
    const { preferences } = workareaStore;
    if (preferences.oco === OCOModes.Disabled) {
      return {};
    } else {
      return {
        CancelCondition: preferences.oco === OCOModes.PartialEx ? 0 : 1,
      };
    }
  }

  public static async createOrdersBulk(
    orders: readonly Order[],
    symbol: string,
    strategy: string,
    user: User,
    minimumSize: number
  ): Promise<MessageResponse> {
    const { roles } = user;
    const personality: string = workareaStore.personality;
    // Build a create order request
    const isBroker: boolean = hasRole(roles, Role.Broker);
    if (isBroker && personality === NONE)
      throw new Error('brokers cannot create orders when in streaming mode');
    const MDMkt: string | undefined = isBroker ? personality : undefined;
    const request: CreateOrderBulk = {
      MsgType: MessageTypes.D,
      TransactTime: getCurrentTime(),
      User: user.email,
      Symbol: symbol,
      Strategy: strategy,
      Firm: workareaStore.effectiveFirm,
      Orders: orders.map((order: Order) => {
        if (order.price === null || order.size === null)
          throw new Error('price and size MUST be specified');
        if (order.size < minimumSize) order.size = minimumSize;
        const { price, size } = order;
        return {
          Side: getSideFromType(order.type),
          Tenor: order.tenor,
          Quantity: size.toFixed(0),
          Price: toValidNumberStringDumb(price),
          Firm: workareaStore.effectiveFirm,
        };
      }),
      MDMkt: MDMkt,
      /* Cancel condition -> OCO mode */
      ...API.getCancelCondition(),
    };
    const task: Task<MessageResponse> = await POST<MessageResponse>(
      API.buildUrl(API.Oms, 'bulkorders', 'create'),
      request
    );
    const result: MessageResponse = await task.execute();
    if (result === null) {
      console.warn('create bulk orders backend did not respond');
      return {
        MsgType: MessageTypes.D,
        Status: 'Failure',
        OrderID: '',
        TransactTime: Date.now() / 1000,
        Response: 'No response received',
        Firm: workareaStore.effectiveFirm,
      };
    }
    if (result.Status !== 'Success') console.warn(`error creating an order ${result.Response}`);
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
      Firm: workareaStore.effectiveFirm,
    };
    const task: Task<MessageResponse> = POST<MessageResponse>(
      API.buildUrl(API.Oms, 'allextended', 'cxl'),
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
      Firm: workareaStore.effectiveFirm,
    };
    const task: Task<MessageResponse> = POST<MessageResponse>(
      API.buildUrl(API.Oms, 'all', 'cancel'),
      request
    );
    return task.execute();
  }

  public static async cancelOrder(order: Order, user: User): Promise<MessageResponse> {
    const { roles } = user;
    const isBroker: boolean = hasRole(roles, Role.Broker);
    if (order.user !== user.email && !isBroker)
      throw new Error(`cancelling someone else's order: ${order.user} -> ${user.email}`);
    const firm = ((): string => {
      if (isBroker && order.firm !== workareaStore.personality) {
        throw new Error('you can only cancel orders that you own');
      } else if (isBroker) {
        return workareaStore.personality;
      } else if (order.firm !== undefined) {
        return order.firm;
      } else {
        throw new Error('cannot determine the firm to use as `MDMkt` for this request');
      }
    })();
    const request = {
      MsgType: MessageTypes.F,
      TransactTime: getCurrentTime(),
      User: order.user,
      Symbol: order.symbol,
      Strategy: order.strategy,
      Tenor: order.tenor,
      OrderID: order.orderId,
      MDMkt: firm,
      Firm: workareaStore.effectiveFirm,
    };
    const task: Task<MessageResponse> = await POST<MessageResponse>(
      API.buildUrl(API.Oms, 'order', 'cancel'),
      request
    );
    const result: MessageResponse = await task.execute();
    if (result.Status !== 'Success') {
      console.warn('error cancelling an order');
    }
    return result;
  }

  public static async getDarkPoolSnapshot(
    symbol: string,
    strategy: string
  ): Promise<{ [k: string]: W } | null> {
    if (!symbol || !strategy) return null;
    const url: string = API.getRawUrl(API.DarkPool, 'tilesnapshot', {
      symbol,
      strategy,
    });
    const task: Task<{ [k: string]: W } | null> = GET<{
      [k: string]: W;
    } | null>(url);
    // Execute the query
    return task.execute();
  }

  public static getTOBSnapshot(symbol: string, strategy: string): Task<{ [k: string]: W } | null> {
    if (!symbol || !strategy)
      throw new Error('you have to tell me which symbol, strategy and tenor you want');
    const url: string = API.getRawUrl(API.MarketData, 'tiletobsnapshot', {
      symbol,
      strategy,
    });
    // Execute the query
    return GET<{
      [k: string]: W;
    } | null>(url);
  }

  public static getSnapshot(symbol: string, strategy: string): Task<{ [k: string]: W } | null> {
    if (!symbol || !strategy)
      throw new Error('you have to tell me which symbol, strategy and tenor you want');
    const url: string = API.getRawUrl(API.MarketData, 'tilesnapshot', {
      symbol,
      strategy,
    });
    // Execute the query
    return GET<{
      [k: string]: W;
    } | null>(url);
  }

  public static async getExecutionHistory(
    useremail: string,
    endTimestamp: number,
    timestamp: number
  ): Promise<Message[]> {
    const query: any = {
      timestamp: timestamp,
      end_timestamp: endTimestamp,
      fillsonly: true,
    };
    const task1: Task<Message[]> = GET<Message[]>(
      API.buildUrl(API.DarkPool, 'messages', 'get', query)
    );
    const task2: Task<Message[]> = GET<Message[]>(API.buildUrl(API.Oms, 'messages', 'get', query));
    const darkpool: Message[] = await task1.execute();
    const normal: Message[] = await task2.execute();
    return [...darkpool, ...normal];
  }

  public static async getMessagesSnapshot(
    useremail: string,
    timestamp?: number
  ): Promise<Message[]> {
    const query: any = timestamp ? { timestamp } : {};
    const task1: Task<Message[]> = GET<Message[]>(
      API.buildUrl(API.DarkPool, 'messages', 'get', query)
    );
    const task2: Task<Message[]> = GET<Message[]>(API.buildUrl(API.Oms, 'messages', 'get', query));
    const darkpool: Message[] = await task1.execute();
    const normal: Message[] = await task2.execute();
    return [...darkpool, ...normal];
  }

  public static getRunOrders(
    useremail: string,
    symbol: string,
    strategy: string
  ): Task<OrderMessage[]> {
    return GET<OrderMessage[]>(
      API.buildUrl(API.Oms, 'runorders', 'get', { symbol, strategy, useremail })
    );
  }

  public static async getAllUsers(useremail: string): Promise<User[]> {
    const task: Task<User[]> = GET<User[]>(
      API.buildUrl(API.UserApi, 'AllUsers', 'get', { useremail })
    );
    return task.execute();
  }

  public static async getUserInfo(useremail: string): Promise<UserInfo> {
    const task: Task<UserInfo> = GET<UserInfo>(
      API.buildUrl(API.UserApi, 'UserInfo', 'get', { useremail })
    );

    return task.execute();
  }

  public static async getBanks(): Promise<string[]> {
    const task: Task<string[]> = GET<string[]>(API.buildUrl(API.Config, 'markets', 'get'));
    return task.execute();
  }

  public static async createDarkPoolOrder(order: DarkPoolOrder): Promise<any> {
    const user: User = workareaStore.user;
    const personality: string = workareaStore.personality;
    const { roles } = user;
    const isBroker: boolean = hasRole(roles, Role.Broker);
    if (isBroker && order.MDMkt === NONE) {
      throw new Error('brokers cannot create orders when in streaming mode');
    } else if (!isBroker) {
      order.MDMkt = user.firm;
    } else {
      order.MDMkt = personality;
    }

    const task: Task<MessageResponse> = POST<MessageResponse>(
      API.buildUrl(API.DarkPool, 'order', 'create'),
      { ...order, Price: toValidNumberStringDumb(toNumber(order.Price)) }
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
      Firm: workareaStore.effectiveFirm,
    };

    const task: Task<MessageResponse> = POST<MessageResponse>(
      API.buildUrl(API.DarkPool, 'order', 'cancel'),
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
    const task: Task<MessageResponse> = POST<MessageResponse>(
      API.buildUrl(API.DarkPool, 'allonpxchg', 'cxl'),
      {
        User: user.email,
        Symbol: currency,
        Strategy: strategy,
        Tenor: tenor,
        Firm: workareaStore.effectiveFirm,
      }
    );
    return task.execute();
  }

  public static async clearDarkPoolPrice(
    user: string,
    symbol: string,
    strategy: string,
    tenor: string
  ): Promise<void> {
    const data = {
      User: user,
      Symbol: symbol,
      Strategy: strategy,
      Tenor: tenor,
      Firm: workareaStore.effectiveFirm,
    };
    const task: Task<any> = POST<any>(API.buildUrl(API.DarkPool, 'price', 'clear'), data);
    return task.execute();
  }

  public static async publishDarkPoolPrice(
    user: string,
    symbol: string,
    strategy: string,
    tenor: string,
    price: number | ''
  ): Promise<any> {
    const data = {
      User: user,
      Symbol: symbol,
      Strategy: strategy,
      Tenor: tenor,
      DarkPrice: price !== '' ? price.toString() : '',
      Firm: workareaStore.effectiveFirm,
    };
    const task: Task<any> = POST<any>(API.buildUrl(API.DarkPool, 'price', 'publish'), data);
    return task.execute();
  }

  public static async getUserProfile(email: string): Promise<[{ workspace: any }]> {
    const task: Task<any> = GET<any>(
      API.buildUrl(API.UserApi, 'UserJson', 'get', { useremail: email })
    );

    return task.execute();
  }

  public static async saveUserProfile(data: any): Promise<any> {
    const { useremail, workspace } = data;
    const contentType = 'application/x-www-form-urlencoded';
    const task: Task<any> = POST<any>(
      API.buildUrl(API.UserApi, 'UserJson', 'save'),
      { useremail, workspace },
      contentType
    );
    return task.execute();
  }

  public static async userRefAll(): Promise<void> {
    const user: User = workareaStore.user;
    const request = {
      MsgType: MessageTypes.F,
      User: user.email,
      TransactTime: getCurrentTime(),
      Firm: workareaStore.effectiveFirm,
    };
    await POST<MessageResponse>(API.buildUrl(API.Oms, 'all', 'cancel'), request).execute();
    await POST<MessageResponse>(API.buildUrl(API.DarkPool, 'all', 'cancel'), request).execute();
  }

  public static async brokerRefAll(): Promise<void> {
    const user: User = workareaStore.user;
    const personality: string = workareaStore.personality;
    const request = {
      MsgType: MessageTypes.F,
      User: user.email,
      MDMkt: personality === NONE ? undefined : personality,
      TransactTime: getCurrentTime(),
      Firm: workareaStore.effectiveFirm,
    };
    await POST<MessageResponse>(API.buildUrl(API.Oms, 'all', 'cxlall'), request).execute();
    await POST<MessageResponse>(API.buildUrl(API.DarkPool, 'all', 'cxlall'), request).execute();
  }

  public static async getUserRegions(useremail: string): Promise<readonly string[]> {
    const task: Task<ReadonlyArray<{ ccyGroup: string }>> = GET<any>(
      API.buildUrl(API.Config, 'userregions', 'get', { useremail })
    );
    const regions = await task.execute();
    return regions.map((region: { ccyGroup: string }): string => region.ccyGroup);
  }

  // Middle middle office
  public static async getCuts(currency?: string): Promise<any> {
    if (currency) {
      const task: Task<any> = GET<any>(API.buildUrl(API.Config, 'cuts', 'get', { currency }));
      return task.execute();
    } else {
      const task: Task<any> = GET<any>(API.buildUrl(API.Config, 'cuts', 'get'));
      return task.execute();
    }
  }

  public static async getOptexStyle(): Promise<any> {
    const task: Task<any> = GET<any>(API.buildUrl(API.Config, 'optexstyle', 'get'));
    return task.execute();
  }

  public static async getBankEntities(): Promise<BankEntitiesQueryResponse> {
    const task: Task<BankEntitiesQueryResponse> = GET<BankEntitiesQueryResponse>(
      config.PrePricerUrl + '/entities'
    );
    return task.execute();
  }

  public static async getValuModel(): Promise<any> {
    const task: Task<any> = GET<any>(API.buildUrl(API.Config, 'valumodel', 'get'));
    return task.execute();
  }

  public static async getProductsEx(): Promise<any> {
    const task: Task<any> = GET<any>(
      API.buildUrl(API.Config, 'exproducts', 'get', {
        bAllFields: true,
      })
    );
    return task.execute();
  }

  private static async getSpotDate(
    entry: DealEntry,
    summaryLeg: SummaryLeg | null,
    legs: readonly Leg[]
  ): Promise<Date> {
    if (summaryLeg?.spotDate) {
      return summaryLeg?.spotDate;
    }

    const datesTask = API.queryVolDates(
      {
        tradeDate: toUTC(entry.tradeDate, true),
        addHolidays: true,
        fxPair: entry.symbol.symbolID,
        rollExpiryDates: false,
      },
      legs
        .map((leg: Leg): string => (leg.expiryDate ? toUTC(leg.expiryDate) : ''))
        .filter((dateString: string): boolean => dateString !== '')
    );

    const { SpotDate: spotDateString } = await datesTask.execute();
    if (spotDateString === null) {
      throw new Error('cannot determine the spot date');
    }

    const spotDate = forceParseDate(spotDateString);
    if (spotDate === null) {
      throw new Error('cannot determine the spot date');
    }

    return spotDate;
  }

  public static async sendPricingRequest(
    entry: DealEntry,
    legs: readonly Leg[],
    summaryLeg: SummaryLeg | null,
    valuationModel: ValuationModel,
    strategy: Product,
    defaultLegAdjust: string,
    legDefs: { in: readonly LegOptionsDefIn[] }
  ): Promise<void> {
    const proxyEntry = new Proxy(entry, NotApplicableProxy<DealEntry>('', entry));
    const { tradeDate, symbol } = proxyEntry;
    if (proxyEntry.dealID === undefined) {
      throw new Error('cannot price an transient deal');
    }
    const mergedDefinitions: readonly Leg[] = mergeDefinitionsAndLegs(
      proxyEntry,
      strategy,
      symbol,
      legs,
      legDefs
    );
    const ccyPair: string = symbol.symbolID;
    const legsPromises = mergedDefinitions.map(
      async (leg: Leg, index: number): Promise<OptionLeg> => {
        const proxyLeg = new Proxy(leg, NotApplicableProxy<Leg>('leg', entry));
        const { strategy } = proxyEntry;
        const tenor: Tenor | InvalidTenor = getTenor(proxyEntry, index);
        if (isInvalidTenor(tenor))
          throw new Error(
            'cannot build pricing request without a valid tenor or expiry date for each leg'
          );
        const spread: number | null =
          strategy.productid === 'Butterfly-2Leg' && index > 0
            ? null
            : coalesce(proxyEntry.spread, null);
        const vol: number | null =
          strategy.productid === 'Butterfly-2Leg' && index > 0
            ? null
            : coalesce(proxyLeg.vol, proxyEntry.vol);
        const notional: number = coalesce(
          index === 1 ? proxyEntry.not2 : proxyEntry.not1,
          proxyEntry.not1
        );
        // We know that the tenor has valid dates now
        const { expiryDate, deliveryDate } = tenor;
        if (deliveryDate === undefined) throw new Error('bad tenor for leg ' + index);
        return {
          notional: notional,
          expiryDate: toUTC(expiryDate),
          deliveryDate: toUTC(deliveryDate),
          spreadVolatiltyOffset: spread,
          strike: tryToNumber(
            coalesce(proxyLeg.strike, coalesce(proxyEntry.dealstrike, strategy.strike))
          ),
          volatilty: vol,
          barrier: null,
          barrierLower: null,
          barrierUpper: null,
          barrierRebate: null,
          OptionLegType: proxyLeg.option,
          SideType: proxyLeg.side.toUpperCase(),
          MonitorType: null,
        };
      }
    );
    if (proxyEntry.horizonDateUTC === undefined) {
      throw new Error('for some reason horizonDateUTC was not set');
    }
    const forwardRates = buildFwdRates(summaryLeg, strategy, proxyEntry.tenor1, proxyEntry.tenor2);
    const spotDate = await API.getSpotDate(entry, summaryLeg, legs);
    const request: VolMessageIn = {
      id: proxyEntry.dealID,
      Option: {
        ccyPair: ccyPair,
        ccy1: symbol.notionalCCY,
        ccy2: ccyPair.replace(symbol.notionalCCY, ''),
        OptionProductType: strategy.OptionProductType,
        vegaAdjust: proxyEntry.legadj === null ? defaultLegAdjust : proxyEntry.legadj,
        notionalCCY: symbol.notionalCCY,
        riskCCY: symbol.riskCCY,
        premiumCCY: symbol.premiumCCY,
        ccyGroup: symbol.ccyGroup,
        OptionLegs: await Promise.all(legsPromises),
      },
      ValuationData: {
        valuationDate: toUTC(proxyEntry.horizonDateUTC, true),
        valuationDateUTC: toUTC(proxyEntry.horizonDateUTC),
        VOL: {
          ccyPair: ccyPair,
          premiumAdjustDelta: symbol.premiumAdjustDelta,
          snapTime: tradeDate,
          DateCountBasisType: symbol['DayCountBasis-VOL'],
          VolSurface: [], // To be filled by the pre-pricer
        },
        FX: {
          ccyPair: ccyPair,
          snapTime: tradeDate,
          DateCountBasisType: symbol['DayCountBasis-FX'],
          ForwardRates: forwardRates,
          strikeForwardMRoundingFactor: symbol['strike-rounding'],
          premiumMRoundingFactor: symbol['premium-rounding'],
          InterpolationMethod: forwardRates !== undefined ? 'PIECEWISE_CONSTANT' : null,
          ForwardPoints: null,
        },
        RATES: [],
      },
      ...(summaryLeg !== null && summaryLeg.spot !== undefined && summaryLeg.spot !== null
        ? { Spot: summaryLeg.spot }
        : {}),
      ValuationModel: valuationModel,
      description: `FXO-${strategy.OptionProductType}-${legs.length}-Legs`,
      timeStamp: toUTC(new Date()),
      spotDate: toUTC(spotDate),
      version: 'arcfintech-volMessage-0.2.2',
    };
    const task: Task<any> = POST<any>(config.PricerUrl, request);
    return task.execute();
  }

  public static async getDeals(
    dealID?: string,
    dateRange?: GetDealsDateRange
  ): Promise<ReadonlyArray<{ [key: string]: any }>> {
    const task: Task<ReadonlyArray<{ [key: string]: any }>> = GET<
      ReadonlyArray<{ [key: string]: any }>
    >(
      API.buildUrl(API.Deal, 'deals', 'get', dateRange ?? {}),
      dealID !== undefined ? { dealid: dealID } : undefined
    );
    const array = await task.execute();
    if (array === null) return [];
    return array;
  }

  public static async removeDeal(id: string): Promise<any> {
    const user: User = workareaStore.user;
    const task: Task<any> = DELETE<any>(
      API.buildUrl(API.Deal, 'deal', 'remove', {
        linkid: id,
        useremail: user.email,
      })
    );
    return task.execute();
  }

  public static async stpSendReport(dealID: string): Promise<string> {
    const { user } = workareaStore;
    const task: Task<string> = POST<string>(API.buildUrl(API.STP, 'report', 'send'), {
      dealID: dealID,
      useremail: user.email,
    });
    return task.execute();
  }

  public static async sendTradeCaptureReport(dealID: string): Promise<string> {
    const user: User = workareaStore.user;
    const task: Task<string> = POST<string>(API.buildUrl(API.SEF, 'tradecapreport', 'send'), {
      dealID: dealID,
      useremail: user.email,
      dest: '',
    });
    return task.execute();
  }

  public static async updateDeal(
    data: DealEntry,
    legs: readonly Leg[],
    summaryLeg: SummaryLeg | null,
    entitiesMap: { [key: string]: BankEntity },
    entities: BankEntitiesQueryResponse,
    changed: string[]
  ): Promise<string> {
    if (data.dealID === undefined) throw new Error('to save an existing deal please provide an id');
    await API.saveLegs(data.dealID, legs, summaryLeg);
    // Save the deal now
    const task: Task<string> = POST<string>(
      API.buildUrl(API.Deal, 'deal', 'update'),
      API.createDealRequest(data, summaryLeg, changed, entitiesMap, entities)
    );
    return task.execute();
  }

  public static async cloneDeal(
    data: DealEntry,
    legs: readonly Leg[],
    summaryLeg: SummaryLeg | null,
    entitiesMap: { [key: string]: BankEntity },
    entities: BankEntitiesQueryResponse,
    changed: string[]
  ): Promise<string> {
    const task: Task<string> = POST<string>(
      API.buildUrl(API.Deal, 'deal', 'clone'),
      API.createDealRequest(data, summaryLeg, changed, entitiesMap, entities)
    );
    return API.onDealCreated(task, legs, summaryLeg);
  }

  public static async createDeal(
    data: DealEntry,
    legs: readonly Leg[],
    summaryLeg: SummaryLeg | null,
    entitiesMap: { [key: string]: BankEntity },
    entities: BankEntitiesQueryResponse,
    changed: string[]
  ): Promise<string> {
    const task: Task<string> = POST<string>(
      API.buildUrl(API.Deal, 'deal', 'create'),
      API.createDealRequest(data, summaryLeg, changed, entitiesMap, entities)
    );
    return API.onDealCreated(task, legs, summaryLeg);
  }

  public static getLegs(dealID: string | undefined): Task<{ legs: readonly Leg[] } | null> {
    if (dealID === undefined)
      return {
        execute: async (): Promise<null> => null,
        cancel: () => undefined,
      };
    // We return the task instead of it's execution promise so that
    // the caller can cancel if desired/needed
    return GET<any>(API.buildUrl(API.Legs, 'legs', 'get', { dealid: dealID }));
  }

  public static async getOptionLegsDefIn(): Promise<any> {
    const task: Task<any> = GET<any>(API.buildUrl(API.Config, 'optionlegsdefin', 'get'));
    return task.execute();
  }

  public static getOptionLegsDefOut(): Promise<any> {
    const task: Task<any> = GET<any>(API.buildUrl(API.Config, 'optionlegsdefout', 'get'));
    return task.execute();
  }

  public static getBrokerageWidths(
    ccyPair: string,
    strategy: string
  ): Task<BrokerageWidthsResponse> {
    return GET<BrokerageWidthsResponse>(
      API.buildUrl(API.Brokerage, 'width', 'get', {
        ccypair: ccyPair,
        strategy,
      })
    );
  }

  public static getBrokerageCommission(firm: string): Task<BrokerageCommissionResponse> {
    return GET<BrokerageCommissionResponse>(
      API.buildUrl(API.Brokerage, 'commission', 'get', {
        firm,
      })
    );
  }

  public static getDeltaStyles(): Promise<readonly string[]> {
    const task: Task<readonly string[]> = GET<readonly string[]>(
      API.buildUrl(API.MloConfig, 'deltastyle', 'get')
    );
    return task.execute();
  }

  public static getLegAdjustValues(): Promise<readonly LegAdjustValue[]> {
    const task: Task<readonly LegAdjustValue[]> = GET<readonly LegAdjustValue[]>(
      API.buildUrl(API.MloConfig, 'legadjustvalues', 'get')
    );
    return task.execute();
  }

  public static getPremiumStyles(): Promise<readonly string[]> {
    const task: Task<readonly string[]> = GET<readonly string[]>(
      API.buildUrl(API.MloConfig, 'premstyle', 'get')
    );
    return task.execute();
  }

  public static queryVolDates(
    query: CalendarVolDatesQuery,
    dates: readonly string[]
  ): Task<CalendarVolDatesResponse> {
    const url: string = config.CalendarServiceBaseUrl + '/api/calendar/fxpair/vol/dates';
    return POST<CalendarVolDatesResponse>(url, {
      ...query,
      ExpiryDates: dates,
    });
  }

  public static queryVolTenors(
    query: CalendarVolDatesQuery,
    tenors: readonly string[]
  ): Task<CalendarVolDatesResponse> {
    const url: string = config.CalendarServiceBaseUrl + '/api/calendar/fxpair/vol/tenors';
    return POST<CalendarVolDatesResponse>(url, {
      ...query,
      Tenors: tenors,
    });
  }

  public static async getUser(userId: string): Promise<OktaUser> {
    // First get session id
    const url: string = config.GetRoleEndpoint + '?userid=' + userId;
    const task: Task<OktaUser> = GET<OktaUser>(url);
    return task.execute();
  }

  public static getDarkPoolLastQuotes(
    symbol: string,
    strategy: string
  ): Task<readonly DarkPoolQuote[]> {
    return GET<readonly DarkPoolQuote[]>(
      API.buildUrl(API.DarkPool, 'lastquote', 'get', {
        symbol,
        strategy,
      })
    );
  }

  private static createDealRequest(
    entry: DealEntry,
    summaryLeg: SummaryLeg | null,
    changed: string[],
    entitiesMap: { [p: string]: BankEntity },
    entities: BankEntitiesQueryResponse
  ): ServerDealQuery {
    const user: User = workareaStore.user;
    const { symbol, strategy, tenor1, tenor2 } = entry;
    if (isInvalidTenor(tenor1)) throw new Error('cannot build deal query without at least 1 tenor');

    return {
      linkid: getDealId(entry),
      tenor: tenor1.name,
      tenor1: isTenor(tenor2) ? tenor2.name : null,
      strategy: strategy.productid,
      symbol: symbol.symbolID,
      spread: entry.spread,
      vol: entry.vol,
      lastqty: entry.size,
      notional1: entry.not2 !== undefined ? entry.not2 : null,
      size: entry.size,
      lvsqty: '0',
      cumqty: '0',
      transacttime: toUTCFIXFormat(new Date()),
      buyerentitycode: resolveBankToEntity(entry.buyer, entities),
      sellerentitycode: resolveBankToEntity(entry.seller, entities),
      buyer_useremail: entry.buyer_useremail,
      buyer: resolveEntityToBank(entry.buyer, entitiesMap),
      seller: resolveEntityToBank(entry.seller, entitiesMap),
      seller_useremail: entry.seller_useremail,
      useremail: user.email,
      strike: entry.dealstrike,
      expirydate: toUTCFIXFormat(tenor1.expiryDate),
      expirydate1: isTenor(tenor2) ? toUTCFIXFormat(tenor2.expiryDate) : null,
      deltastyle: entry.deltastyle,
      premstyle: entry.premstyle,
      style: entry.style,
      model: entry.model,
      legadj: entry.legadj,
      buyer_comm: entry.buyer_comm,
      buyer_comm_rate: entry.buyer_comm_rate,
      seller_comm: entry.seller_comm,
      seller_comm_rate: entry.seller_comm_rate,
      product_fields_changed: changed,
      ...getExtraFields(entry, summaryLeg),
    };
  }

  public static async saveLegs(
    dealID: string,
    legs: readonly Leg[],
    summaryLeg: SummaryLeg | null
  ): Promise<string> {
    const { user } = workareaStore;
    const allLegs = [
      ...(summaryLeg
        ? summaryLeg.dealOutput
          ? [
              {
                ...summaryLeg.dealOutput,
                option: 'SumLeg',
              },
            ]
          : []
        : []),
      ...legs,
    ];
    const mappedLegs: readonly Leg[] = allLegs.map((leg: Leg): Leg => {
      const { strike, fwdPts } = leg;
      return {
        ...leg,
        ...(fwdPts !== null && fwdPts !== undefined ? { fwdPts: floatAsString(fwdPts) } : {}),
        ...(strike ? { strike: floatAsString(tryToNumber(strike)) } : {}),
      };
    });
    const task = POST<string>(API.buildUrl(API.Legs, 'manual', 'save'), {
      dealId: dealID,
      useremail: user.email,
      legs: mappedLegs,
    });
    return task.execute();
  }

  private static async onDealCreated(
    task: Task<string>,
    legs: readonly Leg[],
    summaryLeg: SummaryLeg | null
  ): Promise<string> {
    const dealID: string = await task.execute();
    // Save the legs now
    await API.saveLegs(dealID, legs, summaryLeg);
    // Once saved, set them in the store
    // FIXME: notify the store now?
    // moStore.setLegs(legs, summaryLeg);
    // Now we're done
    return dealID;
  }
}
