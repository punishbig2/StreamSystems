export interface OrderResponse {
  MsgType: 'D' | 'F' | 'G';
  TransactTime: number;
  OrderID: number;
  Status: 'Success' | 'Failure';
  Response: string;
}
