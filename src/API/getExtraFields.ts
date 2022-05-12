import { DealEntry } from "../types/dealEntry";
import { SummaryLeg } from "../components/MiddleOffice/types/summaryLeg";

export const getExtraFields = (
  entry: DealEntry,
  summaryLeg: SummaryLeg | null
): { extra_fields?: any } => {
  if (entry.extra_fields) {
    return {
      extra_fields: entry.extra_fields,
    };
  } else {
    return {};
  }
};
