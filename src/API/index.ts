import config from 'config';
import {Message, MessageTypes} from 'interfaces/md';
import {EntryTypes} from 'interfaces/mdEntry';
import {CreateOrder, Sides} from 'interfaces/order';
import {OrderResponse} from 'interfaces/orderResponse';
import {Strategy} from 'interfaces/strategy';
import {TOBEntry} from 'interfaces/tobEntry';

enum Method {
  Get = 'GET',
  Post = 'POST',
  Put = 'PUT',
  Delete = 'DELETE',
  Head = 'Head',
}

enum ReadyState {
  Unsent = 0,
  Opened = 1,
  HeadersReceived = 2,
  Loading = 3,
  Done = 4,
}

class HTTPError {
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
              resolve(null as unknown as T);
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

const post = <T>(url: string, data: any): Promise<T> => request(url, Method.Post, data);
const get = <T>(url: string): Promise<T> => request(url, Method.Get);

type Endpoints = 'symbols' | 'products' | 'tenors' | 'order'

// Synchronous request methods
const urlParameters: URLSearchParams = new URLSearchParams(window.location.search);
const currentUserId: string = urlParameters.get('user') || 'ashar@anttechnologies.com';

export class API {
  static MarketData: string = '/api/fxopt/marketdata';
  static Oms: string = '/api/fxopt/oms';
  static Config: string = '/api/fxopt/config';

  static getRawUrl(section: string, rest: string): string {
    return `${Api.Protocol}://${Api.Host}${section}/${rest}`;
  }

  static getUrl(section: string, object: Endpoints, verb: 'get' | 'create' | 'cancel' | 'modify'): string {
    return `${Api.Protocol}://${Api.Host}${section}/${verb}${object}`;
  }

  static getSymbols(): Promise<string[]> {
    return get<string[]>(API.getUrl(API.Config, 'symbols', 'get'));
  }

  static getProducts(): Promise<Strategy[]> {
    return get<Strategy[]>(API.getUrl(API.Config, 'products', 'get'));
  }

  static getTenors(): Promise<string[]> {
    return get<string[]>(API.getUrl(API.Config, 'tenors', 'get'));
  }

  static async createOrder(entry: TOBEntry, side: Sides, quantity: number): Promise<OrderResponse> {
    if (entry.price === null)
      throw new Error('price MUST be specified');
    // Build a create order request
    const request: CreateOrder = {
      MsgType: MessageTypes.D,
      TransactTime: (Math.round(Date.now() / 1000)).toString(),
      User: currentUserId,
      Symbol: entry.symbol,
      Strategy: entry.strategy,
      Tenor: entry.tenor,
      Side: side,
      Quantity: quantity.toString(),
      Price: entry.price.toString(),
    };
    return post<OrderResponse>(API.getUrl(API.Oms, 'order', 'create'), request);
  }

  static async updateOrder(entry: TOBEntry): Promise<OrderResponse> {
    return {} as OrderResponse;
  }

  static async cancelAll(type: EntryTypes): Promise<OrderResponse> {
    const request = {
      MsgType: MessageTypes.F,
      User: currentUserId,
      TransactTime: Math.round(Date.now() / 1000).toString(),
    };
    return post<OrderResponse>(API.getUrl(API.Oms, 'order', 'cancel'), request);
  }

  static async cancelOrder(orderId: string, tenor: string, symbol: String, strategy: string): Promise<OrderResponse> {
    const request = {
      MsgType: MessageTypes.F,
      TransactTime: Math.round(Date.now() / 1000).toString(),
      User: currentUserId,
      Symbol: symbol,
      Strategy: strategy,
      Tenor: tenor,
      OrderID: orderId,
    };
    return post<OrderResponse>(API.getUrl(API.Oms, 'order', 'cancel'), request);
  }

  static async getSnapshot(symbol: string, strategy: string, tenor: string): Promise<Message | null> {
    if (!symbol || !strategy || !tenor)
      return null;
    const url: string = API.getRawUrl(API.MarketData, `snapshot?symbol=${symbol}&strategy=${strategy}&tenor=${tenor}`);
    // Execute the query
    return get<Message | null>(url);
  }
}
