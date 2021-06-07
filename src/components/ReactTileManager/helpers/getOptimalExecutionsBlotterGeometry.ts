import { Geometry } from "@cib/windows-manager";

export const getOptimalExecutionsBlotterGeometry = (
  element: HTMLElement,
  width: number,
  height: number
): Geometry => {
  const container = element.parentElement;
  if (container === null) {
    throw new Error("impossible, the window cannot be floating around");
  }
  return new Geometry(0, container.offsetHeight - height - 1, width, height);
};
