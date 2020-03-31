import {STRM, WorkspaceState} from 'redux/stateDefs/workspaceState';
import {WindowState, defaultWindowState} from 'redux/stateDefs/windowState';
import {Currency} from 'interfaces/currency';
import {WindowTypes} from 'redux/constants/workareaConstants';
import shortid from 'shortid';

const createWindow = (symbols: Currency[], symbolName: string, strategy: string): { [key: string]: WindowState } => {
  const symbol: Currency | undefined = symbols.find((symbol: Currency) => symbol.name === symbolName);
  if (symbol === undefined)
    throw new Error(`cannot create group workspace for symbol ${symbolName}`);
  const type: WindowTypes = WindowTypes.PodTile;
  const id: string = `${symbol.name}${strategy}-${shortid()}`;
  const title: string = `${symbol.name} ${strategy}`;
  // Finally build the object
  return {[id]: {...defaultWindowState, id, strategy, symbol, type, title}};
};

export const defaultLatamWorkspace = (symbols: Currency[]): WorkspaceState => {
  const windows: { [key: string]: WindowState } = {
    ...createWindow(symbols, 'USDBRL', 'ATMF'),
    ...createWindow(symbols, 'USDBRL', '25D RR'),
    ...createWindow(symbols, 'USDMXN', 'ATMF'),
    ...createWindow(symbols, 'USDMXN', '25D RR'),
    ...createWindow(symbols, 'USDCOP', 'ATMF'),
    ...createWindow(symbols, 'USDCOP', '25D RR'),
    ...createWindow(symbols, 'EURBRL', 'ATMF'),
    ...createWindow(symbols, 'EURBRL', '25D RR'),
    ...createWindow(symbols, 'EURMXN', 'ATMF'),
    ...createWindow(symbols, 'EURMXN', '25D RR'),
    ...createWindow(symbols, 'BRLJPY', 'ATMF'),
    ...createWindow(symbols, 'BRLJPY', '25D RR'),
    ...createWindow(symbols, 'USDCLP', 'ATMF'),
    ...createWindow(symbols, 'USDCLP', '25D RR'),
    ...createWindow(symbols, 'USDMXN', '25D BFLY'),
    ...createWindow(symbols, 'USDCLP', '25D BFLY'),
    ...createWindow(symbols, 'USDCOP', '25D BFLY'),
    ...createWindow(symbols, 'EURMXN', '25D BFLY'),
    ...createWindow(symbols, 'EURBRL', '25D BFLY'),
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

