import { PresetWindow } from "groups/presetWindow";

const defaultEntries: { [k: string]: PresetWindow[] } = {
  USDBRL: [
    {
      strategy: "ATMF",
      minimized: false,
      position: 0,
    },
    {
      strategy: "25D RR",
      minimized: false,
      position: 3,
    },
    {
      strategy: "25D BFLY",
      minimized: true,
      position: 14,
    },
  ],
  USDMXN: [
    {
      strategy: "ATMF",
      minimized: false,
      position: 6,
    },
    {
      strategy: "25D RR",
      minimized: false,
      position: 9,
    },
    {
      strategy: "25D BFLY",
      minimized: true,
      position: 15,
    },
  ],
  USDCOP: [
    {
      strategy: "ATMF",
      minimized: false,
      position: 12,
    },
    {
      strategy: "25D RR",
      minimized: false,
      position: 13,
    },
    {
      strategy: "25D BFLY",
      minimized: true,
      position: 19,
    },
  ],
  EURBRL: [
    {
      strategy: "ATMF",
      minimized: false,
      position: 1,
    },
    {
      strategy: "25D RR",
      minimized: false,
      position: 4,
    },
    {
      strategy: "25D BFLY",
      minimized: true,
      position: 16,
    },
  ],
  EURMXN: [
    {
      strategy: "ATMF",
      minimized: false,
      position: 7,
    },
    {
      strategy: "25D RR",
      minimized: false,
      position: 10,
    },
    {
      strategy: "25D BFLY",
      minimized: true,
      position: 17,
    },
  ],
  BRLJPY: [
    {
      strategy: "ATMF",
      minimized: false,
      position: 2,
    },
    {
      strategy: "25D RR",
      minimized: false,
      position: 5,
    },
  ],
  USDCLP: [
    {
      strategy: "ATMF",
      minimized: false,
      position: 8,
    },
    {
      strategy: "25D RR",
      minimized: false,
      position: 11,
    },
    {
      strategy: "25D BFLY",
      minimized: true,
      position: 18,
    },
  ],
};
export default defaultEntries;
