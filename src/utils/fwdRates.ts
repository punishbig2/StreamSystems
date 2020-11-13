import { isInvalidTenor } from "components/FormField/helpers";
import { MOStrategy } from "components/MiddleOffice/types/moStrategy";
import { SummaryLeg } from "components/MiddleOffice/types/summaryLeg";
import { Point } from "structures/point";
import { InvalidTenor, Tenor } from "types/tenor";
import { coalesce } from "utils/commonUtils";
import { addToDate, dateDiff, toUTC } from "utils/timeUtils";

interface InternalPoint {
  date: Date;
  point: number;
}

const generatePoints = (
  when: Date,
  value: number,
  distance: number
): InternalPoint[] => {
  const points: InternalPoint[] = [];
  for (let days = -distance; days < distance; days += distance) {
    points.push({
      date: addToDate(when, days, "d"),
      point: value!,
    });
  }
  return points;
};

const convertToPoint = (internal: InternalPoint): Point => ({
  date: toUTC(internal.date),
  point: internal.point,
});

const comparePoints = (
  { date: d1 }: InternalPoint,
  { date: d2 }: InternalPoint
): number => {
  return dateDiff(d1, d2);
};

export const buildFwdRates = (
  summary: SummaryLeg | null,
  strategy: MOStrategy,
  tenor1: Tenor | InvalidTenor,
  tenor2: Tenor | null
): Point[] | undefined => {
  if (summary === null || isInvalidTenor(tenor1)) return undefined;
  const { fwdrate1, fwdrate2 } = summary;
  if (fwdrate1 === null && fwdrate2 === null) return undefined;
  if (fwdrate1 !== null && fwdrate2 !== null) {
    const points: InternalPoint[] = generatePoints(
      tenor1.deliveryDate,
      fwdrate1,
      1
    );
    if (strategy.spreadvsvol === "spread" || strategy.spreadvsvol === "both") {
      const tenor: Tenor = coalesce(tenor2, tenor1);
      points.push(...generatePoints(tenor.deliveryDate, fwdrate2, 1));
    }
    return points.sort(comparePoints).map(convertToPoint);
  } else {
    const value: number = coalesce(fwdrate1, fwdrate2);
    const points: InternalPoint[] = generatePoints(
      tenor1.deliveryDate,
      value,
      7
    );
    if (strategy.spreadvsvol === "spread" || strategy.spreadvsvol === "both") {
      if (tenor2 !== null) {
        points.push(...generatePoints(tenor2.deliveryDate, value, 1));
      }
    }
    return points.sort(comparePoints).map(convertToPoint);
  }
};
