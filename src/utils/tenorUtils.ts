import { API } from "API";
import { Symbol } from "types/symbol";
import { Tenor } from "types/tenor";
import { CalendarFXPairResponse } from "types/calendarFXPair";
import { PodRow } from "types/podRow";
import { coalesce } from "utils";
import { forceParseDate } from "utils/timeUtils";

export const SPECIFIC_TENOR = "SPECIFIC";
export interface DealDates {
  readonly spot: Date;
  readonly expiry: Date;
  readonly delivery: Date;
}

export const resolveDealDates = async (
  symbol: Symbol,
  tenor: string,
  trade: Date,
  expiryDate?: Date | null
): Promise<DealDates> => {
  if (tenor === "") {
    return {
      delivery: new Date(),
      spot: new Date(),
      expiry: new Date(),
    };
  }
  try {
    const result: CalendarFXPairResponse = await API.calendarFxPair({
      Type: "VOL",
      tradeDate: trade.toISOString(),
      fxPair: symbol.symbolID,
      Tenors: [tenor],
    });
    const spot: Date | undefined = forceParseDate(result.SpotDate);
    const delivery: Date | undefined = forceParseDate(result.DeliveryDates[0]);
    const expiry: Date | undefined = forceParseDate(result.ExpiryDates[0]);
    return {
      delivery: coalesce(delivery, new Date()),
      spot: coalesce(spot, new Date()),
      expiry: coalesce(expiry, new Date()),
    };
  } catch {
    return {
      delivery: new Date(),
      spot: new Date(),
      expiry: new Date(),
    };
  }
};

export const tenorToNumber = (value: string) => {
  // FIXME: probably search the number boundary
  const multiplier: number = Number(value.substr(0, value.length - 1));
  const unit: string = value.substr(-1, 1);
  switch (unit) {
    case "D":
      return multiplier;
    case "W":
      return 7 * multiplier;
    case "M":
      return 30 * multiplier;
    case "Y":
      return 365 * multiplier;
  }
  return 0;
};

export const compareTenors = (a: PodRow, b: PodRow) => {
  const at: string = a.tenor;
  const bt: string = b.tenor;
  return tenorToNumber(at) - tenorToNumber(bt);
};

export const deriveTenor = async (
  symbol: Symbol,
  value: string | Date,
  tradeDate: Date
): Promise<Tenor> => {
  if (typeof value === "string") {
    // It's a normal tenor
    const dates: DealDates = await resolveDealDates(symbol, value, tradeDate);
    return {
      name: value,
      deliveryDate: dates.delivery,
      expiryDate: dates.expiry,
      spotDate: dates.spot,
    };
  } else {
    // It's a specific tenor
    return {
      name: SPECIFIC_TENOR,
      deliveryDate: new Date(),
      expiryDate: value,
      spotDate: value,
    };
  }
};
