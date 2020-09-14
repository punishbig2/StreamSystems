import { API, HTTPError } from "API";
import { ValuationModel } from "components/MiddleOffice/types/pricer";
import { SummaryLeg } from "components/MiddleOffice/types/summaryLeg";
import config from "config";
import moStore, { MOStatus } from "mobx/stores/moStore";
import { DealEntry } from "structures/dealEntry";

const SOFT_ERROR: string =
  "Timed out while waiting for the pricing result, please refresh the screen. " +
  "If the deal is not priced yet, try again as this is a problem that should not happen and never be repeated. " +
  "If otherwise the problem persists, please contact support.";

export const sendPricingRequest = (
  entry: DealEntry,
  summary: SummaryLeg | null
): void => {
  if (entry === null) throw new Error("no deal to get a pricing for");
  if (entry.strategy === undefined) throw new Error("invalid deal found");
  if (entry.model === "") throw new Error("node model specified");
  const valuationModel: ValuationModel = moStore.getValuationModelById(
    entry.model as number
  );
  const { strategy } = entry;
  // Set the status to pricing to show a loading spinner
  moStore.setStatus(MOStatus.Pricing);
  // Send the request
  API.sendPricingRequest(entry, moStore.legs, summary, valuationModel, strategy)
    .then(() => {
      setTimeout(() => {
        moStore.setSoftError(SOFT_ERROR);
      }, config.RequestTimeout);
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
