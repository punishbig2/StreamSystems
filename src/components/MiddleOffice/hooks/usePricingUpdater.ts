import { API, Task } from "API";
import { Deal } from "components/MiddleOffice/interfaces/deal";
import { buildPricingResult, PricingResult } from "components/MiddleOffice/interfaces/pricingResult";
import { SummaryLeg } from "components/MiddleOffice/interfaces/summaryLeg";
import { parseManualLegs } from "legsUtils";
import moStore, { MOStatus } from "mobx/stores/moStore";
import { useEffect } from "react";
import signalRManager from "signalR/signalRManager";

const onUpdate = (deal: Deal, data: any) => {
  if (deal === null) return;
  // If this is not the deal we're showing, it's too late and we must skip it
  if (data.id !== deal.dealID) return;
  const pricingResult: PricingResult = buildPricingResult(data);
  moStore.setLegs(pricingResult.legs, {
    ...moStore.summaryLeg,
    ...pricingResult.summary,
  } as SummaryLeg);
  // In case we're pricing
  if (moStore.status === MOStatus.Pricing) {
    moStore.setStatus(MOStatus.Normal);
  }
};

export const usePricingUpdater = (deal: Deal | null) => {
  useEffect(() => {
    if (deal === null) {
      moStore.setDeal(null);
    } else {
      const task: Task<any> = API.getLegs(deal.dealID);
      task
        .execute()
        .then((response: any) => {
          if (response !== null) {
            if ("dealId" in response) {
              moStore.setLegs(parseManualLegs(response.legs), null);
            } else {
              if ("error_msg" in response) {
                moStore.setError({
                  status: "Server error",
                  error: "Unexpected Error",
                  message: response.error_msg,
                  code: 500,
                });
              } else {
                onUpdate(deal, response);
              }
            }
          }
        })
        .catch((reason: any) => {
          if (reason === "aborted") {
            return;
          } else {
            console.warn(reason);
          }
        });
      const removePricingListener: () => void = signalRManager.addPricingResponseListener(
        (response: any) => {
          onUpdate(deal, response);
        }
      );
      return () => {
        removePricingListener();
        task.cancel();
      };
    }
  }, [deal]);
};
