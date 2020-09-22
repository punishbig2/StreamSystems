import { ColumnSpec } from "components/Table/columnSpecification";

export const getOptimalWidthFromColumnsSpec = (
  columns: ColumnSpec[]
): number => {
  // Create an element to use it as a placeholder and measure
  // the size of the column using the template of the column
  // specification
  const el = document.createElement("div");
  const { body } = document;
  const { style } = el;
  // FIXME: ideally we should be able to read variables from the .scss file
  style.display = "inline-block";
  style.fontFamily = '"Roboto", sans-serif';
  style.fontSize = "15px";
  style.fontWeight = "500";
  style.padding = "4px";
  // Sums the widths of individual elements
  const reducer = (value: number, column: ColumnSpec): number => {
    const { template } = column;
    el.innerHTML = template;
    if (column.sortable) return value + el.offsetWidth + 24;
    return value + el.offsetWidth;
  };
  // Temporarily add the element to the document so that it's measurable
  body.appendChild(el);
  const candidateWidth: number = columns.reduce(reducer, 0);
  const columnCount: number = Math.round(window.innerWidth / candidateWidth);
  body.removeChild(el);
  if (columnCount === 1) return candidateWidth;
  return window.innerWidth / columnCount;
};
