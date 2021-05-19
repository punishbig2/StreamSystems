const style: CSSStyleDeclaration = getComputedStyle(document.documentElement);

export interface Styles {
  tableRowHeight: number;
  windowToolbarHeight: number;
  tableHeaderHeight: number;
  windowFooterSize: number;
}

export default (): Styles => ({
  tableRowHeight: parseInt(style.getPropertyValue("--table-row-height")),
  windowToolbarHeight: parseInt(
    style.getPropertyValue("--window-toolbar-height")
  ),
  tableHeaderHeight: parseInt(style.getPropertyValue("--table-header-height")),
  windowFooterSize: parseInt(style.getPropertyValue("--window-toolbar-height")),
});
