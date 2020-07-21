import { Globals } from "golbals";
import moment from "moment";

export const FIX_DATE_FORMAT: string = "YYYYMMDD-hh:mm:ss";

export const formatters = {
  date: new Intl.DateTimeFormat(undefined, {
    timeZone: Globals.timezone || undefined,
    day: "numeric",
    month: "numeric",
    year: "numeric",
  }),
  time: new Intl.DateTimeFormat(undefined, {
    timeZone: Globals.timezone || undefined,
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
  }),
};

export const parser = {
  parse: (value: string): moment.Moment => {
    return moment(Date.parse(value));
  },
};

export const parseTime = (date: string, tz: string | null): Date => {
  const regex: RegExp = /(\d{4})(\d{2})(\d{2})-(\d{2}):(\d{2}):(\d{2})/;
  const match: RegExpExecArray | null = regex.exec(date);
  if (match === null) return new Date();
  return new Date(
    Date.UTC(
      Number(match[1]),
      Number(match[2]) - 1,
      Number(match[3]),
      Number(match[4]),
      Number(match[5]),
      Number(match[6])
    )
  );
};

const zeroPad = (value: number, count: number): string => {
  const digits: string[] = [];
  let multiplier: number = Math.pow(10, count - 1);
  while (value < Math.floor(multiplier) - 1) {
    digits.push("0");
    multiplier /= 10;
  }
  digits.push(value.toString(10));
  return digits.join("");
};

export const momentToUTCFIXFormat = (moment: moment.Moment): string => {
  // The ridiculous moment.js library modifies the object
  // in place, so all kinds of side effects :(
  const utc: moment.Moment = moment.isUTC() ? moment : moment.utc();
  // Format as FIX date
  return utc.format(FIX_DATE_FORMAT);
};

export const forceParseDate = (value: string): moment.Moment => {
  if (value.match(/\d{4}\d{2}\d{2}-\d{2}:\d{2}:\d{2}.\d{3}/)) {
    return moment(value, FIX_DATE_FORMAT);
  } else {
    // ISO format
    return moment(value);
  }
};

export const currentTimestampFIXFormat = (): string => {
  return momentToUTCFIXFormat(moment());
};
