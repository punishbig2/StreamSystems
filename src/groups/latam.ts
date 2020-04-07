import { PresetWindow } from 'groups/presetWindow';

const defaultEntries: { [k: string]: PresetWindow[] } = {
  'USDBRL': [{
    strategy: 'ATMF',
    minimized: false,
  }, {
    strategy: '25D RR',
    minimized: false,
  }, {
    strategy: '25D BFLY',
    minimized: true,
  }],
  'USDMXN': [{
    strategy: 'ATMF',
    minimized: false,
  }, {
    strategy: '25D RR',
    minimized: false,
  }, {
    strategy: '25D BFLY',
    minimized: true,
  }],
  'USDCOP': [{
    strategy: 'ATMF',
    minimized: false,
  }, {
    strategy: '25D RR',
    minimized: false,
  }, {
    strategy: '25D BFLY',
    minimized: true,
  }],
  'EURBRL': [{
    strategy: 'ATMF',
    minimized: false,
  }, {
    strategy: '25D RR',
    minimized: false,
  }, {
    strategy: '25D BFLY',
    minimized: true,
  }],
  'EURMXN': [{
    strategy: 'ATMF',
    minimized: false,
  }, {
    strategy: '25D RR',
    minimized: false,
  }, {
    strategy: '25D BFLY',
    minimized: true,
  }],
  'BRLJPY': [{
    strategy: 'ATMF',
    minimized: false,
  }, {
    strategy: '25D RR',
    minimized: false,
  }],
  'USDCLP': [{
    strategy: 'ATMF',
    minimized: false,
  }, {
    strategy: '25D RR',
    minimized: false,
  }, {
    strategy: '25D BFLY',
    minimized: true,
  }],
};
export default defaultEntries;

