export interface MessageResponse {
  MsgType: "D" | "F" | "G";
  TransactTime: number;
  OrderID: string;
  Status: "Success" | "Failure";
  Response: string;
  Firm: string;
}
