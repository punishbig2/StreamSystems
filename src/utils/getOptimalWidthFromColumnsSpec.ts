import { TableColumn } from "components/Table/tableColumn";
import styles from "styles";

export const getOptimalWidthFromColumnsSpec = (
  columns: ReadonlyArray<TableColumn>
): number => {
  // Create an element to use it as a placeholder and measure
  // the size of the column using the template of the column
  // specification
  const variables = styles();
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  if (context === null) return 0;
  context.font = `${variables.tableFontSize} ${variables.tableFontFamily}`;
  // Sums the widths of individual elements
  const reducer = (value: number, column: TableColumn): number => {
    const measurement = context.measureText(column.template);
    return value + measurement.width - 4;
  };
  return columns.reduce(reducer, 0);
};
