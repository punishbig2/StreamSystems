import config from 'config';
import {Order} from 'interfaces/order';
import {OrderResponse} from 'interfaces/orderResponse';
import {Product} from 'interfaces/product';

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
            // TODO: throw an exception or handle the one thrown here
            const object: any = JSON.parse(xhr.responseText);
            // Return the object converted to the correct type
            resolve(object as T);
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
export class API {
  static Root: string = '';
  static Config: string = '/api/fxopt/config';

  static getUrl(section: string, object: Endpoints, verb: 'get' | 'create'): string {
    return `${Api.Protocol}://${Api.Host}${section}/${verb}${object}`;
  }

  static getSymbols(): Promise<string[]> {
    return get<string[]>(API.getUrl(API.Config, 'symbols', 'get'));
  }

  static getProducts(): Promise<Product[]> {
    return get<Product[]>(API.getUrl(API.Config, 'products', 'get'));
  }

  static getTenors(): Promise<string[]> {
    return get<string[]>(API.getUrl(API.Config, 'tenors', 'get'));
  }

  static async createOrder(order: Order): Promise<OrderResponse> {
    return post<OrderResponse>(API.getUrl(API.Root, 'order', 'create'), order);
  }

  static async updateOrder(order: Order): Promise<OrderResponse> {
    return {} as OrderResponse;
  }

  static async cancelOrder(order: Order): Promise<OrderResponse> {
    return {} as OrderResponse;
  }
}
