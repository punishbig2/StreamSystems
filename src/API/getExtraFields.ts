import { SummaryLeg } from 'components/MiddleOffice/types/summaryLeg';
import { DealEntry } from 'types/dealEntry';

export const getExtraFields = (
  entry: DealEntry,
  _summaryLeg: SummaryLeg | null
): { extra_fields?: any } => {
  if (entry.extra_fields) {
    return {
      extra_fields: entry.extra_fields,
    };
  } else {
    return {};
  }
};
