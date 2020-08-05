import { API } from "API";
import config from "config";
import moStore, { MOStatus } from "mobx/stores/moStore";
import { DealEntry } from "structures/dealEntry";

const SOFT_ERROR: string =
  "Timed out while waiting for the submission result, please refresh the screen. " +
  "If the deal is not submitted yet, try again as this is a problem that should not happen and never be repeated. " +
  "If otherwise the problem persists, please contact support.";

moStore.setSoftError(SOFT_ERROR);

export const submitToSEF = (entry: DealEntry) => {
  const { dealId } = entry;
  moStore.setStatus(MOStatus.Submitting);
  API.sendTradeCaptureReport(dealId)
    .then(() => {
      setTimeout(() => {
        moStore.setSoftError(SOFT_ERROR);
      }, config.RequestTimeout);
    })
    .catch((error: any) => {
      moStore.setError({
        status: "Unknown problem",
        code: 1,
        error: "Unexpected error",
        message: typeof error === "string" ? error : error.message(),
      });
    });
};
