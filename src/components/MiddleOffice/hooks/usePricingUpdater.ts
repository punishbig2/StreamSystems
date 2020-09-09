import { Deal } from "components/MiddleOffice/types/deal";
import moStore, { MOStatus } from "mobx/stores/moStore";
import { useEffect } from "react";

const onUpdate = (deal: Deal, data: { dealId: string }) => {
  if (deal === null) return;
  // If this is not the deal we're showing, it's too late and we must skip it
  if (data.dealId !== deal.dealID) return;
  /* */
  // In case we're pricing
  if (moStore.status === MOStatus.Pricing) {
    moStore.setStatus(MOStatus.Normal);
  }
};

export const usePricingUpdater = (deal: Deal | null) => {
  useEffect(() => {
    if (deal === null) {
      return;
    } else {
      onUpdate(deal, {
        dealId: deal.dealID,
      });
    }
  }, [deal]);
};
