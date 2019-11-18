import {Window, WindowStatus} from 'interfaces/window';
import {WindowTypes} from 'redux/constants/workareaConstants';
import shortid from 'shortid';

export class WorkspaceWindow implements Window {
  public id: string;
  public type: WindowTypes;
  public strategy: string;
  public symbol: string;
  public geometry: ClientRect = new DOMRect(0, 0, window.innerWidth / 4, window.innerHeight / 2.5);
  public status: WindowStatus = WindowStatus.None;

  constructor(type: WindowTypes) {
    this.id = `tile-${shortid()}-${type}`;
    this.type = type;
    this.strategy = '';
    this.symbol = '';
  }

}