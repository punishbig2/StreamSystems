import { Globals } from "golbals";
import moment from "moment";

export const FIX_DATE_FORMAT: string = "YYYYMMDD-hh:mm:ss";

export const DateTimeFormatter: Intl.DateTimeFormat = new Intl.DateTimeFormat(
  undefined,
  {
    timeZone: Globals.timezone || undefined,
  }
);

export const DateFormatter: Intl.DateTimeFormat = new Intl.DateTimeFormat(
  undefined,
  {
    timeZone: Globals.timezone || undefined,
    year: "numeric",
    month: "numeric",
    day: "numeric",
  }
);

export const TimeFormatter: Intl.DateTimeFormat = new Intl.DateTimeFormat(
  undefined,
  {
    timeZone: Globals.timezone || undefined,
    hour: "numeric",
    minute: "numeric",
  }
);

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

export const momentToUTCFIXFormat = (date: Date): string => {
  // "YYYYMMDD-hh:mm:ss"
  const m: moment.Moment = moment(date);
  if (m === undefined || m === null) return "";
  // The ridiculous moment.js library modifies the object
  // in place, so all kinds of side effects :(
  const utc: moment.Moment = m.isUTC() ? m : m.utc();
  // Format as FIX date
  return utc.format(FIX_DATE_FORMAT);
};

export const forceParseDate = (
  value: string | null | undefined
): Date | undefined => {
  if (!value) return undefined;
  if (value.match(/\d{4}\d{2}\d{2}-\d{2}:\d{2}:\d{2}/)) {
    const m: moment.Moment = moment(value, FIX_DATE_FORMAT);
    if (!m.isValid()) return undefined;
    return m.toDate();
  } else {
    // ISO format
    const m: moment.Moment = moment(value);
    if (!m.isValid()) return undefined;
    return m.toDate();
  }
};

export const currentTimestampFIXFormat = (): string => {
  return momentToUTCFIXFormat(new Date());
};

export const addToDate = (
  date: Date,
  value: number,
  units: moment.DurationInputArg2
): Date => {
  const asMoment: moment.Moment = moment(date);
  const newMoment: moment.Moment = asMoment.add(value, units);
  return newMoment.toDate();
};

export const toIsoDate = (date: Date): string => {
  return date.toISOString();
};

export const dateDiff = (d1: Date, d2: Date): number => {
  const m1: moment.Moment = moment(d1);
  const m2: moment.Moment = moment(d2);
  return m1.diff(m2);
};
