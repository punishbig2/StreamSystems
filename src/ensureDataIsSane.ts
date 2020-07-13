import { PricingMessage } from "components/MiddleOffice/interfaces/pricingResult";
import moStore from "mobx/stores/moStore";
import moment from "moment";

export const addMissingInformationToPricingMessage = (message: PricingMessage): PricingMessage => {
  const {
    Output: { MarketSnap },
  } = message;
  const { deal } = moStore;
  if (deal === null) throw new Error("What the fuck?");
  const { symbol, deliveryDate, tradeDate, expiryDate } = deal;
  const missingFields = {};
  const premiumDate = moment(tradeDate).add(symbol.SettlementWindow, "d");
  if (
    message.premiumCurrency === null ||
    message.premiumCurrency === undefined
  ) {
    message.premiumCurrency = symbol.premiumCCY;
  }
  if (message.premiumDate === null || message.premiumDate === undefined) {
    message.premiumDate = premiumDate.format();
  }
  if (message.deliveryDate === null || message.deliveryDate === undefined) {
    message.deliveryDate = deliveryDate.format();
  }
  if (message.expiryDate === null || message.expiryDate === undefined) {
    message.expiryDate = expiryDate.format();
  }
  if (message.days === null || message.days === undefined) {
    message.days = expiryDate.diff(tradeDate, "d");
  }
  if (message.rates === null || message.rates === undefined) {
    const { symbolID } = symbol;
    message.rates = [
      {
        currency: symbol.premiumCCY,
        value: MarketSnap.ccy1Zero,
      },
      {
        currency: symbolID.replace(symbol.premiumCCY, ""),
        value: MarketSnap.ccy2Zero,
      },
    ];
  }
  if (message.party === null || message.party === undefined) {
    message.party = deal.buyer;
  }
  if (message.fwdPts === null || message.fwdPts === undefined) {
    message.fwdPts = 1000 * (message.Output.Inputs.forward - message.Output.Inputs.spot);
  }
  return { ...message, ...missingFields };
};
