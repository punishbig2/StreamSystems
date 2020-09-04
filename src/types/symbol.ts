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
  riskCCY: string;
  riskCCYformat: string;
  symbolID: string;
  vegaAdjustBF: boolean;
  vegaAdjustRR: boolean;
  volsource: string;
  "premium-rounding": number | undefined,
  "strike-rounding": number | undefined,
}
