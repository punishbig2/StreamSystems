import {STRM, WorkspaceState} from 'redux/stateDefs/workspaceState';
import {WindowState, defaultWindowState} from 'redux/stateDefs/windowState';
import {Currency} from 'interfaces/currency';
import {WindowTypes} from 'redux/constants/workareaConstants';
import shortid from 'shortid';

const createWindow = (symbols: Currency[], symbolName: string, strategy: string, index: number): { [key: string]: WindowState } => {
  const symbol: Currency | undefined = symbols.find((symbol: Currency) => symbol.name === symbolName);
  if (symbol === undefined)
    throw new Error(`cannot create group workspace for symbol ${symbolName}`);
  const type: WindowTypes = WindowTypes.PodTile;
  const id: string = `${symbol.name}${strategy}-${shortid()}`;
  const minimized = index > 7;
  const title: string = `${symbol.name} ${strategy}`;
  // Finally build the object
  return {[id]: {...defaultWindowState, id, strategy, symbol, type, title, minimized}};
};

export const defaultLatamWorkspace = (symbols: Currency[]): WorkspaceState => {
  let count = 0;
  const windows: { [key: string]: WindowState } = {
    ...createWindow(symbols, 'USDBRL', 'ATMF', count++),
    ...createWindow(symbols, 'USDBRL', '25D RR', count++),
    ...createWindow(symbols, 'USDMXN', 'ATMF', count++),
    ...createWindow(symbols, 'USDMXN', '25D RR', count++),
    ...createWindow(symbols, 'USDCOP', 'ATMF', count++),
    ...createWindow(symbols, 'USDCOP', '25D RR', count++),
    ...createWindow(symbols, 'EURBRL', 'ATMF', count++),
    ...createWindow(symbols, 'EURBRL', '25D RR', count++),
    ...createWindow(symbols, 'EURMXN', 'ATMF', count++),
    ...createWindow(symbols, 'EURMXN', '25D RR', count++),
    ...createWindow(symbols, 'BRLJPY', 'ATMF', count++),
    ...createWindow(symbols, 'BRLJPY', '25D RR', count++),
    ...createWindow(symbols, 'USDCLP', 'ATMF', count++),
    ...createWindow(symbols, 'USDCLP', '25D RR', count++),
    ...createWindow(symbols, 'USDMXN', '25D BFLY', count++),
    ...createWindow(symbols, 'USDCLP', '25D BFLY', count++),
    ...createWindow(symbols, 'USDCOP', '25D BFLY', count++),
    ...createWindow(symbols, 'EURMXN', '25D BFLY', count++),
    ...createWindow(symbols, 'EURBRL', '25D BFLY', count++),
  };
  return {
    id: '',
    name: '',
    windows: windows,
    toast: null,
    markets: [],
    isDefaultWorkspace: true,
    isUserProfileModalVisible: false,
    personality: STRM,
    errorMessage: null,
  };
};

