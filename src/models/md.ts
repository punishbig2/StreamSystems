import {FirmTypes, MDEntry, Types} from 'models/mdEntry';

export interface Message {
  MsgType: string;
  TransactTime: number;
  Symbol: string;
  Strategy: string;
  User: string;
  Tenor: string;
  NoMDEntries: number;
  MDEntries: MDEntry[];
}

const sampleTenors = ['1W', '2W', '1M', '2M', '3M', '9M', '1Y', '2Y', '3Y', '4Y', '5Y'];
const firms = ['Firm 1', 'Firm 2', 'Firm 3', 'Firm 4'];
const getRandomEntry = (firm: string, type: Types): MDEntry => {
  return {
    MDEntryType: type,
    MDEntryPx: 5 * Math.random() + 100,
    MDEntrySize: Math.floor(8 * Math.random()) + 20,
    MDUserId: Math.random() > 0.5 ? '1' : '2',
    MDFirm: firm,
    MDFirmType: Math.random() > 0.75 ? FirmTypes.Bank : FirmTypes.Broker,
  };
};

export const fake = (): Message[] => {
  return sampleTenors.map((tenor) => {
    const count = Math.floor(3 * Math.random() + 12);
    return {
      MsgType: 'W',
      TransactTime: Date.now(),
      Strategy: 'ATM',
      Symbol: 'USD/MXN',
      NoMDEntries: count,
      User: 'nobody',
      Tenor: tenor,
      MDEntries: [
        ...firms.map((firm) => {
          return getRandomEntry(firm, Types.Bid);
        }),
        ...firms.map((firm) => {
          return getRandomEntry(firm, Types.Ask);
        }),
      ],
    };
  });
};

