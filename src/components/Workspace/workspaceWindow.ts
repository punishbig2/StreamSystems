import {Window, WindowStatus} from 'interfaces/window';
import {WindowTypes} from 'redux/constants/workareaConstants';
import shortid from 'shortid';

export class WorkspaceWindow implements Window {
  public id: string;
  public type: WindowTypes;
  public strategy: string;
  public symbol: string;
  public geometry: ClientRect = new DOMRect(0, 0, 600, 450);
  public status: WindowStatus = WindowStatus.None;
  public minimized: boolean;
  public title: string;
  public autoSize: boolean;

  constructor(type: WindowTypes) {
    this.id = `wn-${shortid()}-${type}`;
    this.type = type;
    this.strategy = '';
    this.symbol = '';
    this.minimized = false;
    this.title = 'Untitled';
    this.autoSize = true;
  }
}
