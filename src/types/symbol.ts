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
  premiumCCYformat: string;
  premiumCCYpercent: boolean;
  riskCCY: string;
  riskCCYformat: string;
  riskCCYpercent: boolean;
  symbolID: string;
  vegaAdjustBF: boolean;
  vegaAdjustRR: boolean;
  volsource: string;
  "premium-rounding": number | undefined;
  "strike-rounding": number | undefined;
}

export const InvalidSymbol: Symbol = {
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
  notionalCCY: "",
  premiumAdjustDelta: false,
  premiumCCY: "",
  premiumCCYformat: "",
  riskCCYpercent: false,
  symbolID: "",
  vegaAdjustBF: false,
  vegaAdjustRR: false,
  volsource: "",
  "premium-rounding": undefined,
  "strike-rounding": undefined,
  premiumCCYpercent: false,
  riskCCY: "",
  riskCCYformat: "",
};
