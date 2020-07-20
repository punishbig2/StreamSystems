import { API, HTTPError } from "API";
import { Deal } from "components/MiddleOffice/interfaces/deal";
import { MOStrategy } from "components/MiddleOffice/interfaces/moStrategy";
import { ValuationModel } from "components/MiddleOffice/interfaces/pricer";
import moStore, { MOStatus } from "mobx/stores/moStore";
import { DealEntry } from "structures/dealEntry";

export const sendPricingRequest = (deal: Deal, entry: DealEntry): void => {
  if (deal === null || entry === null)
    throw new Error("no deal to get a pricing for");
  if (deal.strategy === undefined) throw new Error("invalid deal found");
  if (entry.model === "") throw new Error("node model specified");
  const valuationModel: ValuationModel = moStore.getValuationModelById(
    entry.model as number
  );
  const strategy: MOStrategy = moStore.getStrategyById(deal.strategy);
  // Set the status to pricing to show a loading spinner
  moStore.setStatus(MOStatus.Pricing);
  // Send the request
  API.sendPricingRequest(deal, entry, moStore.legs, valuationModel, strategy)
    .then(() => {
      // We've got to wait for the priced message to come, because otherwise
      // it's confusing
    })
    .catch((error: HTTPError) => {
      if (error !== undefined) {
        if (typeof error.getMessage === "function") {
          const message: string = error.getMessage();
          moStore.setError({
            code: error.getCode(),
            ...JSON.parse(message),
          });
        } else {
          console.log(error);
        }
      }
    });
};
