import config from 'config';
import {Currency} from 'interfaces/currency';
import {Message} from 'interfaces/message';
import {CreateOrder, Order, UpdateOrder, DarkPoolOrder, OrderMessage} from 'interfaces/order';
import {MessageResponse} from 'interfaces/messageResponse';
import {Strategy} from 'interfaces/strategy';
import {User} from 'interfaces/user';
import {MessageTypes, W} from 'interfaces/w';
import {getSideFromType} from 'utils';
import {getAuthenticatedUser} from 'utils/getCurrentUser';
import {STRM} from 'redux/stateDefs/workspaceState';
import {$$} from 'utils/stringPaster';
import {Sides} from 'interfaces/sides';

const toQuery = (obj: { [key: string]: string }): string => {
  const entries: [string, string][] = Object.entries(obj);
  return entries
    .map(([key, value]: [string, string]) => `${key}=${encodeURI(value)}`)
    .join('&');
};

enum Method {
  Get = 'GET',
  Post = 'POST',
  Put = 'PUT',
  Delete = 'DELETE',
  Head = 'Head'
}

enum ReadyState {
  Unsent = 0,
  Opened = 1,
  HeadersReceived = 2,
  Loading = 3,
  Done = 4
}

export class HTTPError {
  private code: number;
  private message: string;

  constructor(code: number, message: string) {
    this.code = code;
    this.message = message;
  }
}

// Special type to exclude 1 type from a set of types
type NotOfType<T> = T extends string ? never : T;
// Generic request builder
const request = <T>(url: string, method: Method, data?: NotOfType<string>): Promise<T> => {
  // This should be accessible from outside the executor/promise to allow cancellation
  const xhr = new XMLHttpRequest();
  // Executor
  const executeRequest = (resolve: (data: T) => void, reject: (error?: any) => void): void => {
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
            reject();
          } else if (xhr.status >= 200 && xhr.status < 300) {
            const {responseText} = xhr;
            if (responseText.length > 0) {
              // TODO: throw an exception or handle the one thrown here
              const object: any = JSON.parse(responseText);
              // Return the object converted to the correct type
              resolve(object as T);
            } else {
              resolve((null as unknown) as T);
            }
          } else {
            reject(new HTTPError(xhr.status, xhr.responseText));
          }
          break;
      }
    };
    if (data) {
      // Content type MUST be json
      xhr.setRequestHeader('Content-Type', 'application/json');
      xhr.send(JSON.stringify(data));
    } else {
      xhr.send();
    }
  };
  return new Promise(executeRequest);
};

const {Api} = config;

const post = <T>(url: string, data: any): Promise<T> =>
  request(url, Method.Post, data);
const get = <T>(url: string, args?: any): Promise<T> =>
  request(url, Method.Get, args);

type Endpoints =
  | 'symbols'
  | 'products'
  | 'tenors'
  | 'order'
  | 'messages'
  | 'all'
  | 'runorders'
  | 'UserGroupSymbol'
  | 'Users'
  | 'UserJson'
  | 'markets'
  | 'allextended'
  | 'price';

type Verb = 'get' | 'create' | 'cancel' | 'modify' | 'cxl' | 'publish' | 'save' | 'cxlall';

const getCurrentTime = (): string => Math.round(Date.now()).toString();

export class API {
  static FxOpt: string = '/api/fxopt';
  static MarketData: string = `${API.FxOpt}/marketdata`;
  static Oms: string = `${API.FxOpt}/oms`;
  static UserApi: string = '/api/UserApi';
  static Config: string = `${API.FxOpt}/config`;
  static DarkPool: string = `${API.FxOpt}/darkpool`;

  static getRawUrl(section: string, rest: string, args?: any): string {
    if (args === undefined)
      return `${Api.Protocol}://${Api.Host}${section}/${rest}`;
    return `${Api.Protocol}://${Api.Host}${section}/${rest}?${toQuery(args)}`;
  }

  static getUrl(section: string, object: Endpoints, verb: Verb, args?: any): string {
    if (args === undefined)
      return `${Api.Protocol}://${Api.Host}${section}/${verb}${object}`;
    return `${Api.Protocol}://${Api.Host}${section}/${verb}${object}?${toQuery(args)}`;
  }

  static getSymbols(): Promise<Currency[]> {
    return get<Currency[]>(API.getUrl(API.Config, 'symbols', 'get'));
  }

  static getProducts(): Promise<Strategy[]> {
    return get<Strategy[]>(API.getUrl(API.Config, 'products', 'get'));
  }

  static getTenors(): Promise<string[]> {
    return get<string[]>(API.getUrl(API.Config, 'tenors', 'get'));
  }

  static async createOrder(order: Order, personality: string, minimumSize: number): Promise<MessageResponse> {
    const currentUser = getAuthenticatedUser();
    if (order.price === null || order.size === null)
      throw new Error('price and size MUST be specified');
    if (order.size < minimumSize) order.size = minimumSize;
    const {price, size} = order;
    // Build a create order request
    if (currentUser.isbroker && personality === STRM)
      throw new Error('brokers cannot create orders when in streaming mode');
    const MDMkt: string | undefined = currentUser.isbroker ? personality : undefined;
    const request: CreateOrder = {
      MsgType: MessageTypes.D,
      TransactTime: getCurrentTime(),
      User: currentUser.email,
      Symbol: order.symbol,
      Strategy: order.strategy,
      Tenor: order.tenor,
      Side: getSideFromType(order.type),
      Quantity: size.toString(),
      Price: price.toString(),
      MDMkt,
    };
    order.dispatchEvent('CREATE');
    const result: MessageResponse = await post<MessageResponse>(API.getUrl(API.Oms, 'order', 'create'), request);
    if (result.Status !== 'Success') {
      console.warn('error creating an order');
    }
    return result;
  }

  static async updateOrder(entry: Order): Promise<MessageResponse> {
    const currentUser = getAuthenticatedUser();
    if (entry.price === null || entry.size === null || !entry.orderId)
      throw new Error('price, size and order id MUST be specified');
    const {price, size} = entry;
    // Build a create order request
    const request: UpdateOrder = {
      MsgType: MessageTypes.G,
      TransactTime: getCurrentTime(),
      User: currentUser.email,
      Quantity: size.toString(),
      Price: price.toString(),
      OrderID: entry.orderId,
      Symbol: entry.symbol,
      Strategy: entry.strategy,
      Tenor: entry.tenor,
    };
    return post<MessageResponse>(API.getUrl(API.Oms, 'order', 'modify'), request);
  }

  static async cancelAll(symbol: string | undefined, strategy: string | undefined, side: Sides): Promise<MessageResponse> {
    const currentUser = getAuthenticatedUser();
    const request = {
      MsgType: MessageTypes.F,
      User: currentUser.email,
      TransactTime: getCurrentTime(),
      Side: side,
      Strategy: strategy,
      Symbol: symbol,
    };
    // Notify all orders of a given group that they're being cancelled
    const event: CustomEvent = new CustomEvent<void>($$(symbol, strategy, side, 'CANCEL'));
    // Dispatch the event so that listeners are called
    document.dispatchEvent(event);
    // Sadly, in this case it is not possible to know if a given individual order was
    // cancelled (but this is not that bad because in principle it never fails)
    return post<MessageResponse>(API.getUrl(API.Oms, 'all', 'cancel'), request);
  }

  static async cancelOrder(order: Order): Promise<MessageResponse> {
    const currentUser = getAuthenticatedUser();
    if (order.user !== currentUser.email) {
      throw new Error(`cancelling someone else's order: ${order.user} -> ${currentUser.email}`);
    }
    const request = {
      MsgType: MessageTypes.F,
      TransactTime: getCurrentTime(),
      User: order.user,
      Symbol: order.symbol,
      Strategy: order.strategy,
      Tenor: order.tenor,
      OrderID: order.orderId,
    };
    order.dispatchEvent('CANCEL');
    const result: MessageResponse = await post<MessageResponse>(API.getUrl(API.Oms, 'order', 'cancel'), request);
    if (result.Status !== 'Success') {
      console.warn('error cancelling an order');
    }
    return result;
  }

  static async getDarkPoolSnapshot(symbol: string, strategy: string, tenor: string): Promise<W | null> {
    if (!symbol || !strategy || !tenor)
      return null;
    const url: string = API.getRawUrl(API.DarkPool, 'snapshot', {symbol, strategy, tenor});
    // Execute the query
    return get<W | null>(url);
  }

  static async getDarkPoolTOBSnapshot(symbol: string, strategy: string, tenor: string): Promise<W | null> {
    if (!symbol || !strategy || !tenor)
      return null;
    const url: string = API.getRawUrl(API.DarkPool, 'tobsnapshot', {symbol, strategy, tenor});
    // Execute the query
    return get<W | null>(url);
  }

  static async getTOBSnapshot(symbol: string, strategy: string, tenor: string): Promise<W | null> {
    if (!symbol || !strategy || !tenor)
      return null;
    const url: string = API.getRawUrl(API.MarketData, 'tobsnapshot', {symbol, strategy, tenor});
    // Execute the query
    return get<W | null>(url);
  }

  static async getSnapshot(symbol: string, strategy: string, tenor: string): Promise<W | null> {
    if (!symbol || !strategy || !tenor)
      return null;
    const url: string = API.getRawUrl(API.MarketData, 'snapshot', {symbol, strategy, tenor});
    // Execute the query
    return get<W | null>(url);
  }

  static async getMessagesSnapshot(useremail: string, timestamp: number): Promise<Message[]> {
    return await get<Message[]>(
      API.getUrl(API.Oms, 'messages', 'get', {timestamp}),
    );
  }

  static async getRunOrders(useremail: string, symbol: string, strategy: string): Promise<OrderMessage[]> {
    return get<OrderMessage[]>(
      API.getUrl(API.Oms, 'runorders', 'get', {symbol, strategy, useremail}),
    );
  }

  static async getUserGroupSymbol(useremail: string): Promise<any[]> {
    return get<any[]>(
      API.getUrl(API.Oms, 'UserGroupSymbol', 'get', {useremail}),
    );
  }

  static async getUsers(): Promise<User[]> {
    return get<User[]>(API.getUrl(API.UserApi, 'Users', 'get'));
  }

  static async getBanks(): Promise<string[]> {
    return get<string[]>(API.getUrl(API.Config, 'markets', 'get'));
  }

  static async createDarkPoolOrder(order: DarkPoolOrder): Promise<any> {
    const user: User = getAuthenticatedUser();
    if (user.isbroker && order.MDMkt === STRM) {
      throw new Error('brokers cannot create orders when in streaming mode');
    } else if (!user.isbroker) {
      order.MDMkt = user.firm;
    }
    return post<MessageResponse>(
      API.getUrl(API.DarkPool, 'order', 'create'),
      order,
    );
  }

  static async modifyDarkPoolOrder(request: any): Promise<any> {
    return post<MessageResponse>(API.getUrl(API.DarkPool, 'order', 'modify'), request);
  }

  static async cancelDarkPoolOrder(order: Order): Promise<any> {
    const currentUser = getAuthenticatedUser();
    const request = {
      MsgType: MessageTypes.F,
      TransactTime: getCurrentTime(),
      User: currentUser.email,
      Symbol: order.symbol,
      Strategy: order.strategy,
      Tenor: order.tenor,
      OrderID: order.orderId,
    };
    return post<MessageResponse>(API.getUrl(API.DarkPool, 'order', 'cancel'), request);
  }

  static async cxlAllExtendedDarkPoolOrder(request: any): Promise<any> {
    return post<MessageResponse>(
      API.getUrl(API.DarkPool, 'allextended', 'cxl'),
      request,
    );
  }

  static async cancelAllDarkPoolOrder(request: any): Promise<any> {
    return post<MessageResponse>(API.getUrl(API.DarkPool, 'all', 'cancel'), request);
  }

  static async getDarkPoolMessages(request: any): Promise<any> {
    return get<MessageResponse>(API.getUrl(API.DarkPool, 'messages', 'get'));
  }

  static async getDarkPoolRunOrders(request: any): Promise<any> {
    return get<MessageResponse>(API.getUrl(API.DarkPool, 'runorders', 'get'));
  }

  static async publishDarkPoolPrice(user: string, symbol: string, strategy: string, tenor: string, price: number): Promise<any> {
    const data = {
      User: user,
      Symbol: symbol,
      Strategy: strategy,
      Tenor: tenor,
      DarkPrice: price,
    };
    return post<any>(API.getUrl(API.DarkPool, 'price', 'publish'), data);
  }

  static async getUserProfile(email: string) {
    return get<any>(API.getUrl(API.UserApi, 'UserJson', 'get', {useremail: email}));
  }

  static async saveUserProfile(data: any) {
    const {useremail, workspace} = data;
    return post<any>(API.getUrl(API.UserApi, 'UserJson', 'save', {useremail, workspace}), null);
  }

  static async brokerRefAll(personality: string) {
    const currentUser = getAuthenticatedUser();
    const request = {
      MsgType: MessageTypes.F,
      User: currentUser.email,
      MDMkt: personality === STRM ? undefined : personality,
      TransactTime: getCurrentTime(),
    };
    return post<MessageResponse>(
      API.getUrl(API.Oms, 'all', 'cxlall'),
      request,
    );
  }
}
