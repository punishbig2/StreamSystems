export interface CalendarFXPairQuery {
  Type: "VOL";
  tradeDate: string;
  fxPair: string;
  Tenors: string[];
}

export interface CalendarFXPairResponse {
  Status: "OK" | "ERROR";
  TimeStamp: number;
  Message: string;
  TradeDate: string;
  SpotDate: string;
  ExpiryDates: string[];
  DeliveryDates: string[];
  ExpiryDateTimes: string[];
  DeliveryDateTimes: string[];
  Holidays: any;
}
