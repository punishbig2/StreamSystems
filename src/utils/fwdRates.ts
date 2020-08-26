import { MOStrategy } from "components/MiddleOffice/interfaces/moStrategy";
import { SummaryLeg } from "components/MiddleOffice/interfaces/summaryLeg";
import moment from "moment";
import { Point } from "structures/point";

interface InternalPoint {
  date: moment.Moment;
  point: number;
}

const format = (m: moment.Moment) => m.format("YYYY-MM-DD");
const generatePoints = (
  when: moment.Moment,
  value: number,
  distance: number
): InternalPoint[] => {
  const points: InternalPoint[] = [];
  for (let days = -distance; days < distance; days += distance) {
    const copy: moment.Moment = moment(when);
    points.push({
      date: copy.add(days, "d"),
      point: value!,
    });
  }
  return points;
};

const convertToPoint = (internal: InternalPoint): Point => ({
  date: format(internal.date),
  point: internal.point,
});

const comparePoints = (
  { date: d1 }: InternalPoint,
  { date: d2 }: InternalPoint
): number => {
  return d1.diff(d2);
};

export const buildFwdRates = (
  summary: SummaryLeg,
  strategy: MOStrategy,
  expiry1: moment.Moment,
  expiry2: moment.Moment | null
): Point[] | undefined => {
  const { fwdrate1: value } = summary;
  if (value === null) return undefined;
  const points: InternalPoint[] = generatePoints(expiry1, value, 7);
  if (strategy.spreadvsvol === "spread" || strategy.spreadvsvol === "both") {
    if (expiry2 !== null) {
      points.push(...generatePoints(expiry2, value, 7));
    }
  }
  return points.sort(comparePoints).map(convertToPoint);
};
