export enum CCYPair {
  AUDBRL = "AUDBRL",
  AUDMXN = "AUDMXN",
  BRLJPY = "BRLJPY",
  CADBRL = "CADBRL",
  CHFBRL = "CHFBRL",
  CADMXN = "CADMXN",
  CHFMXN = "CHFMXN",
  EURBRL = "EURBRL",
  EURMXN = "EURMXN",
  EURCLP = "EURCLP",
  EURCOP = "EURCOP",
  GBPBRL = "GBPBRL",
  GBPMXN = "GBPMXN",
  MXNJPY = "MXNJPY",
  USDBRL = "USDBRL",
  USDMXN = "USDMXN",
  USDCLP = "USDCLP",
  USDCOP = "USDCOP",
  USDARS = "USDARS",
  USDPEN = "USDPEN",
  BRLMXN = "BRLMXN",
}

export enum RRStrategy {
  _10D_RR = "10D RR",
  _25D_RR = "25D RR",
}
export type Tag = "+AC" | "+BP" | "+CC" | "+EC" | "+GC" | "+BP" | "+UC" | "+MP";

export const CCYGroupTags: {
  [pair in CCYPair]: { [strategy in RRStrategy]: Tag };
} = {
  AUDBRL: { "10D RR": "+AC", "25D RR": "+AC" },
  AUDMXN: { "10D RR": "+AC", "25D RR": "+AC" },
  BRLJPY: { "10D RR": "+BP", "25D RR": "+BP" },
  CADBRL: { "10D RR": "+CC", "25D RR": "+CC" },
  CHFBRL: { "10D RR": "+CC", "25D RR": "+CC" },
  CADMXN: { "10D RR": "+CC", "25D RR": "+CC" },
  CHFMXN: { "10D RR": "+CC", "25D RR": "+CC" },
  EURBRL: { "10D RR": "+EC", "25D RR": "+EC" },
  EURMXN: { "10D RR": "+EC", "25D RR": "+EC" },
  EURCLP: { "10D RR": "+EC", "25D RR": "+EC" },
  EURCOP: { "10D RR": "+EC", "25D RR": "+EC" },
  GBPBRL: { "10D RR": "+GC", "25D RR": "+GC" },
  GBPMXN: { "10D RR": "+GC", "25D RR": "+GC" },
  MXNJPY: { "10D RR": "+MP", "25D RR": "+MP" },
  USDBRL: { "10D RR": "+UC", "25D RR": "+UC" },
  USDMXN: { "10D RR": "+UC", "25D RR": "+UC" },
  USDCLP: { "10D RR": "+UC", "25D RR": "+UC" },
  USDCOP: { "10D RR": "+UC", "25D RR": "+UC" },
  USDARS: { "10D RR": "+UC", "25D RR": "+UC" },
  USDPEN: { "10D RR": "+UC", "25D RR": "+UC" },
  BRLMXN: { "10D RR": "+MP", "25D RR": "+MP" },
};
