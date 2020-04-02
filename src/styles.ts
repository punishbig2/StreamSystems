const style: CSSStyleDeclaration = getComputedStyle(document.documentElement);

export interface Dimensions {
  tableRowHeight: number;
  windowToolbarHeight: number;
  tableHeaderHeight: number;
}

export default (): Dimensions => ({
  tableRowHeight: parseInt(style.getPropertyValue('--table-row-height')),
  windowToolbarHeight: parseInt(
    style.getPropertyValue('--window-toolbar-height'),
  ),
  tableHeaderHeight: parseInt(style.getPropertyValue('--table-header-height')),
});
