import { Leg, Rates } from "components/MiddleOffice/interfaces/leg";
import { VolSurface } from "components/MiddleOffice/interfaces/pricer";
import { SummaryLeg } from "components/MiddleOffice/interfaces/summaryLeg";
import { addMissingInformationToPricingMessage } from "ensureDataIsSane";
import { parser } from "timeUtils";

export interface PricingResult {
  summary: Partial<SummaryLeg>;
  legs: Leg[];
}

interface OutputEntry {
  "%_CCY1": number[];
  "%_FOR": number[];
  "%_USD": number[];
  CCY1: number[];
  FOR: number[];
  USD: number[];
}
export interface LegInputs {
  Forward: number[];
  Legs: string[];
  Not: number[];
  Rd: number[];
  Rf: number[];
  Side: string[];
  Spot: number[];
  Strike: number[];
  Time: number[];
  Vol: number[];
}

export interface Inputs {
  LegInputs: LegInputs;
  forward: number;
  isLong: boolean;
  spot: number;
  time: number;
}

export interface DeltaVol {
  xPoints: number[];
  yPoints: number[];
}

export interface StrikeVol {
  xPoints: number[];
  yPoints: number[];
}

export interface VolSurfaceSnap {
  DeltaVol: DeltaVol;
  StrikeVol: StrikeVol;
  slope: number;
}

export interface MarketSnap {
  VolSurfaceSnap: VolSurfaceSnap;
  ccy1Zero: number;
  ccy2Zero: number;
  forward: number;
  spot: number;
  time: number;
}

export interface Raw {
  Butterfly?: any;
  CNDdm: number[];
  CNDdp: number[];
  Delta: number[];
  FwdDelta: number[];
  FwdDelta_pa: number[];
  Gamma: number[];
  GammaP: number[];
  NDdm: number[];
  NDdp: number[];
  PV: number[];
  PV_d: number[];
  PV_df: number[];
  PV_f: number[];
  PV_fd: number[];
  Pd: number[];
  Pf: number[];
  RhoRd: number[];
  RhoRdP: number[];
  RhoRf: number[];
  RhoRfP: number[];
  SpotDelta: number[];
  SpotDelta_pa: number[];
  Theta: number[];
  ThetaP: number[];
  Vanna: number[];
  VannaP: number[];
  Vega: number[];
  VegaP: number[];
  VolSlope: number[];
  Volga: number[];
  VolgaP: number[];
  dm: number[];
  dp: number[];
}

type Premium = OutputEntry & {
  CCY2: number[];
  CCY2_pips: number[];
  DOM: number[];
  DOM_pips: number[];
  MXN: number[];
  MXN_pips: number[];
};

export interface Results {
  Forward_Delta: OutputEntry;
  Gamma: OutputEntry;
  Legs: string[];
  Premium: Premium;
  Product: string;
  RhoRd: OutputEntry;
  RhoRf: OutputEntry;
  Smile_Delta: OutputEntry;
  Spot_Delta: OutputEntry;
  Theta: OutputEntry;
  Vega: OutputEntry;
}

export interface Output {
  Inputs: Inputs;
  MarketSnap: MarketSnap;
  Raw: Raw;
  Results: Results;
  VolSurface: VolSurface;
}

export interface PricingMessage {
  Output: Output;
  days: number;
  deliveryDate: string;
  description: string;
  expiryDate: string;
  fwdPts: number;
  id: string;
  party: string;
  premiumCurrency: string;
  premiumDate: string;
  rates: Rates;
  symbol: string;
  timeStamp: number;
  version: string;
}

export const buildPricingResult = (
  serverMessage: PricingMessage
): PricingResult => {
  const message: PricingMessage = addMissingInformationToPricingMessage(
    serverMessage
  );
  const {
    Output: {
      Results: { Premium, Gamma, Vega, Forward_Delta, Legs },
      Inputs: { LegInputs, spot },
    },
  } = message;
  const legs: Leg[] = Legs.map(
    (option: string, index: number): Leg => {
      return {
        option: option,
        // Calculated fields
        pricePercent: Premium["%_CCY1"][index],
        delta: Forward_Delta["%_CCY1"][index],
        premium: Premium["CCY1"][index],
        gamma: Gamma["CCY1"][index],
        vega: Vega["CCY1"][index],
        hedge: Forward_Delta["CCY1"][index],
        // Leg inputs derived fields
        fwdRate: LegInputs.Forward[index],
        notional: LegInputs.Not[index],
        strike: Number(LegInputs.Strike[index]).toLocaleString(undefined, {
          minimumFractionDigits: 4,
          maximumFractionDigits: 4,
        }),
        vol: LegInputs.Vol[index],
        side: LegInputs.Side[index],
        spot: spot, // LegInputs.Spot[index],
        // Fields inherited directly from the message
        fwdPts: message.fwdPts,
        premiumCurrency: message.premiumCurrency,
        rates: message.rates,
        days: message.days,
        party: message.party,
        // Inserted members
        deliveryDate: parser.parse(message.deliveryDate),
        expiryDate: parser.parse(message.expiryDate),
        premiumDate: parser.parse(message.premiumDate),
      };
    }
  );
  return {
    summary: { dealOutput: legs[0] },
    legs: legs.length === 1 ? legs : legs.slice(1),
  };
};
