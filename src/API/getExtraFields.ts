import { DealEntry } from "../types/dealEntry";
import { SummaryLeg } from "../components/MiddleOffice/types/summaryLeg";

export const getExtraFields = (
  entry: DealEntry,
  summaryLeg: SummaryLeg | null
): { extra_fields?: any } => {
  const spotDateObj = summaryLeg?.spotDate
    ? { spotDate: summaryLeg.spotDate, spot_date: summaryLeg.spotDate }
    : {};
  if (entry.extra_fields) {
    return {
      extra_fields: {
        ...entry.extra_fields,
        ...spotDateObj,
      },
    };
  } else {
    return { extra_fields: { ...spotDateObj } };
  }
};
