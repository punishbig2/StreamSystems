import { Deal } from "components/MiddleOffice/interfaces/deal";
import { DealEntry } from "structures/dealEntry";
import { ValuationModel } from "components/MiddleOffice/interfaces/pricer";
import mo from "mobx/stores/moStore";
import { MOStrategy } from "components/MiddleOffice/interfaces/moStrategy";
import { API, HTTPError } from "API";
import moStore from "mobx/stores/moStore";

export const sendPricingRequest = (deal: Deal, entry: DealEntry): void => {
  if (deal === null || entry === null)
    throw new Error("no deal to get a pricing for");
  if (deal.strategy === undefined) throw new Error("invalid deal found");
  if (entry.model === "") throw new Error("node model specified");
  const valuationModel: ValuationModel = mo.getValuationModelById(
    entry.model as number
  );
  const strategy: MOStrategy = mo.getStrategyById(deal.strategy);
  mo.setSendingPricingRequest(true);
  API.sendPricingRequest(deal, entry, mo.legs, valuationModel, strategy)
    .then(() => {})
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
      console.log("an error just happened", error);
    })
    .finally(() => {
      mo.setSendingPricingRequest(false);
    });
};
