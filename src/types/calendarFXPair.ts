export interface CalendarFXTenorsQuery {
  tradeDate: string;
  fxPair: string;
  Tenors: string[];
  addHolidays: boolean;
}

export interface CalendarVolTenorsQuery {
  tradeDate: string;
  fxPair: string;
  Tenors: string[];
  addHolidays: boolean;
}

export interface CalendarVolDatesQuery {
  tradeDate: string;
  fxPair: string;
  rollExpiryDates: boolean;
  addHolidays: boolean;
}

export interface CalendarFXTenorsResponse {
  Status: "OK" | "ERROR";
  TimeStamp: number;
  TradeDate: string;
  HorizonDate: string;
  HorizonDateUTC: string;
  Tenors: string[];
  SpotDate: string;
  SettleDates: string[];
  Holidays: string[];
}

export interface TemporaryResponse {
  Status: "OK" | "ERROR";
  TimeStamp: number;
  TradeDate: string;
  HorizonDate: string;
  HorizonDateUTC: string;
  Tenors: string[];
  ExpiryDates: string[];
  DeliveryDates: string[];
  SpotDate: string;
  SettleDates: string[];
  Holidays: string[];
}
