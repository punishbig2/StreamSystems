export class Point {
  public x: number;
  public y: number;

  public constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  public static fromEvent = (event: React.MouseEvent | MouseEvent): Point => {
    return new Point(event.clientX, event.clientY);
  };
}
