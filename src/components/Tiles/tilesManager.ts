import * as React from "react";

class TilesManager {
  private readonly children: React.ReactNode;

  public constructor(children: React.ReactNode) {
    this.children = children;
  }

  public render(): React.Reactnode {
    return this.children;
  }
}

export default TilesManager;
