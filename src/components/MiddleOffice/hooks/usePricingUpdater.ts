import { API, Task } from "API";
import { Deal } from "components/MiddleOffice/interfaces/deal";
import { Leg } from "components/MiddleOffice/interfaces/leg";
import { SummaryLeg } from "components/MiddleOffice/interfaces/summaryLeg";
import { fixDates } from "legsUtils";
import moStore, { MOStatus } from "mobx/stores/moStore";
import { useEffect } from "react";
import signalRManager from "signalR/signalRManager";

const onUpdate = (deal: Deal, data: { dealId: string; legs: Leg[] }) => {
  if (deal === null) return;
  // If this is not the deal we're showing, it's too late and we must skip it
  if (data.dealId !== deal.dealID) return;
  const { summaryLeg } = moStore;
  const { legs } = data;
  if (legs[0].option === "SumLeg") {
    moStore.setLegs(legs.slice(1), {
      ...summaryLeg,
      ...{ dealOutput: legs[0] },
    } as SummaryLeg);
  } else {
    moStore.setLegs(legs, null);
  }
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
      const task: Task<any> = API.getLegs(deal.dealID);
      task
        .execute()
        .then((response: any) => {
          if (response !== null) {
            if ("dealId" in response) {
              onUpdate(deal, {
                dealId: deal.dealID,
                legs: fixDates(response.legs),
              });
            } else {
              if ("error_msg" in response) {
                moStore.setError({
                  status: "Server error",
                  error: "Unexpected Error",
                  message: response.error_msg,
                  code: 500,
                });
              } else {
                moStore.setSoftError(
                  "There was a problem trying to deal with a response from the server, please contact support."
                );
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
        () =>
          /* response: any */
          /* Ignore this now */ {
            if (moStore.status === MOStatus.Pricing) {
              moStore.setStatus(MOStatus.Normal);
            }
          }
      );
      return () => {
        removePricingListener();
        task.cancel();
      };
    }
  }, [deal]);
};
