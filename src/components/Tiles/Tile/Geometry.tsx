import {CSSProperties} from "react";

export class Geometry {
  public x: number;
  public y: number;
  public height: number;
  public width: number;

  static fromClientRect = (clientRect: ClientRect): Geometry => {
    const geometry: Geometry = new Geometry();
    // Initialize the values
    geometry.x = clientRect.left;
    geometry.width = clientRect.width;
    geometry.y = clientRect.top;
    geometry.height = clientRect.height;
    // Return the initialized object
    return geometry;
  };

  public constructor(x: number = 0, y: number = 0, width: number = 360, height: number = 360) {
    this.x = x;
    this.width = width;
    this.y = y;
    this.height = height;
  }

  public toStyle = (): CSSProperties => {
    return {
      top: this.y,
      height: this.height,
      left: this.x,
      width: this.width,
    };
  };

  public moveTo = (x: number, y: number): Geometry => new Geometry(this.x + x, this.y + y, this.width, this.height);

  public resize(amountX: number, amountY: number): Geometry {
    return new Geometry(this.x, this.y, this.width + amountX, this.height + amountY);
  }
}
