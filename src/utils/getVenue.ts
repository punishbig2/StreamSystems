import { Deal } from 'components/MiddleOffice/types/deal';

export const getVenue = (deal: Deal): string => {
  if (deal.isdarkpool) {
    return 'Dark Pool';
  } else {
    return deal.source;
  }
};
