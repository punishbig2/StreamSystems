import { MOStrategy } from "components/MiddleOffice/types/moStrategy";
import { SummaryLeg } from "components/MiddleOffice/types/summaryLeg";
import { Tenor } from "types/tenor";
import { Point } from "structures/point";
import { addToDate, dateDiff, toIsoDate } from "utils/timeUtils";

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
  date: toIsoDate(internal.date),
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
  tenor1: Tenor,
  tenor2: Tenor | null
): Point[] | undefined => {
  if (summary === null) return undefined;
  const { fwdrate1: value } = summary;
  if (value === null) return undefined;
  const points: InternalPoint[] = generatePoints(tenor1.expiryDate, value, 7);
  if (strategy.spreadvsvol === "spread" || strategy.spreadvsvol === "both") {
    if (tenor2 !== null) {
      points.push(...generatePoints(tenor2.expiryDate, value, 7));
    }
  }
  return points.sort(comparePoints).map(convertToPoint);
};
