export class Action {
  public type: string;
  public payload: any = undefined;

  constructor(type: string, payload: any = undefined) {
    this.type = type;
    this.payload = payload;
  }
}

