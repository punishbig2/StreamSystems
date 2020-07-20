import { PodRow } from "interfaces/podRow";
import moment from "moment";

export const SPECIFIC_TENOR = "SPECIFIC";

export const tenorToDate = (value: string): moment.Moment => {
  const now: moment.Moment = moment();
  const duration: moment.Duration = tenorToDuration(value);
  return now.add(duration);
};

export const tenorToDuration = (tenor: string): moment.Duration => {
  const regexp: RegExp = /([0-9])+([DWMY])/;
  if (!regexp.test(tenor))
    return moment.duration(0, "d");
  const match: RegExpMatchArray = tenor.match(regexp)!;
  const count: number = Number(match[1]);
  const unit: string = match[2];
  if (unit === "M") return moment.duration(count, unit);
  return moment.duration(count, unit.toLowerCase() as "d" | "w" | "y");
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
