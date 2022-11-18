export interface Symbol {
  ATMType: string;
  "DayCountBasis-FX": string;
  "DayCountBasis-VOL": string;
  DeltaType: string; // Probably an enum
  FixingSource: string;
  PrimaryCutCode: string;
  PrimaryUTCTime: string;
  SecondaryCutCode: string;
  SecondaryUTCTime: string;
  SettlementType: string;
  SettlementWindow: number;
  ccyGroup: string;
  cross: boolean;
  defaultqty: number;
  description: string;
  forwardcode: string | null;
  fxsource: string | null;
  minqty: number;
  name: string;
  notionalCCY: string;
  premiumAdjustDelta: boolean;
  premiumCCY: string;
  premiumCCYpercent: boolean;
  riskCCY: string;
  riskCCYformat: string;
  riskCCYpercent: boolean;
  symbolID: string;
  vegaAdjustBF: string | null;
  vegaAdjustRR: string | null;
  volsource: string;
  "premium-rounding": number | undefined;
  "strike-rounding": number | undefined;
  rank: number;
  legadjustvalues: ReadonlyArray<string>;
}

export const InvalidSymbol: symbol = {
  ATMType: "",
  "DayCountBasis-FX": "0",
  "DayCountBasis-VOL": "0",
  DeltaType: "Forward",
  FixingSource: "",
  PrimaryCutCode: "",
  PrimaryUTCTime: "",
  SecondaryCutCode: "",
  SecondaryUTCTime: "",
  SettlementType: "",
  SettlementWindow: 0,
  ccyGroup: "",
  cross: false,
  defaultqty: 0,
  description: "",
  forwardcode: null,
  fxsource: null,
  minqty: 0,
  name: "",
  notionalCCY: "USD",
  premiumAdjustDelta: false,
  premiumCCY: "USD",
  riskCCYpercent: false,
  symbolID: "",
  vegaAdjustBF: null,
  vegaAdjustRR: null,
  volsource: "",
  "premium-rounding": undefined,
  "strike-rounding": undefined,
  premiumCCYpercent: false,
  riskCCY: "USD",
  riskCCYformat: "",
  rank: Number.MAX_SAFE_INTEGER,
  legadjustvalues: [],
};
