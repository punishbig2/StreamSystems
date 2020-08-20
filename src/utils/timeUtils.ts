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

export const momentToUTCFIXFormat = (moment: moment.Moment): string => {
  if (moment === undefined) return "";
  // The ridiculous moment.js library modifies the object
  // in place, so all kinds of side effects :(
  const utc: moment.Moment = moment.isUTC() ? moment : moment.utc();
  // Format as FIX date
  return utc.format(FIX_DATE_FORMAT);
};

export const forceParseDate = (
  value: string | null | undefined
): moment.Moment | undefined => {
  if (!value) return undefined;
  if (value.match(/\d{4}\d{2}\d{2}-\d{2}:\d{2}:\d{2}/)) {
    const m: moment.Moment = moment(value, FIX_DATE_FORMAT);
    if (!m.isValid()) return undefined;
    return m;
  } else {
    // ISO format
    const m: moment.Moment = moment(value);
    if (!m.isValid()) return undefined;
    return m;
  }
};

export const currentTimestampFIXFormat = (): string => {
  return momentToUTCFIXFormat(moment());
};
