import {Currency} from 'interfaces/currency';
import {Order, Sides} from 'interfaces/order';
import {Strategy} from 'interfaces/strategy';
import {TOBRow, TOBRowStatus} from 'interfaces/tobRow';
import {User} from 'interfaces/user';
import {Subscriber} from 'redux/signalRAction';
import {RunState} from 'redux/stateDefs/runState';
import {WindowState} from 'redux/stateDefs/windowState';
import {DispatchProp} from 'react-redux';

export interface OwnProps {
  id: string;
  workspaceID: string;
  user: User;
  tenors: string[];
  products: Strategy[];
  symbols: Currency[];
  connected: boolean;
  setWindowTitle: (id: string, title: string) => void;
  onRowError: (status: TOBRowStatus) => void;
  onClose?: () => void;
  autoSize?: boolean;
  personality: string;
}

export interface DispatchProps {
  initialize: (rows: { [tenor: string]: TOBRow }) => void;
  unsubscribe: Subscriber;
  subscribe: Subscriber;
  subscribeDarkPool: Subscriber;
  getSnapshot: (symbol: string, strategy: string, tenor: string) => void;
  getDarkPoolSnapshot: (
    symbol: string,
    strategy: string,
    tenor: string,
  ) => void;
  setStrategy: (value: string) => void;
  setSymbol: (value: string) => void;
  toggleOCO: () => void;
  createOrder: (order: Order, personality: string, minimumSize: number) => void;
  cancelOrder: (order: Order) => void;
  cancelAll: (symbol: string, strategy: string, side: Sides) => void;
  updateOrder: (entry: Order) => void;
  getRunOrders: (symbol: string, strategy: string) => void;
  setRowStatus: (order: Order, status: TOBRowStatus) => void;
  updateOrderQuantity: (order: Order) => void;
  publishDarkPoolPrice: (
    symbol: string,
    strategy: string,
    tenor: string,
    price: number,
  ) => void;
}

export type Props = OwnProps & WindowState & DispatchProp;
