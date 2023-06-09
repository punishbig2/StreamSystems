const style: CSSStyleDeclaration = getComputedStyle(document.documentElement);

export interface Styles {
  tableRowHeight: number;
  windowToolbarHeight: number;
  tableHeaderHeight: number;
  windowFooterSize: number;
  tableFontSize: string;
  tableFontWeight: string;
}

export default (): Styles => ({
  tableRowHeight: parseInt(style.getPropertyValue('--table-row-height')),
  windowToolbarHeight: parseInt(style.getPropertyValue('--window-toolbar-height')),
  tableHeaderHeight: parseInt(style.getPropertyValue('--table-header-height')),
  windowFooterSize: parseInt(style.getPropertyValue('--window-toolbar-height')),
  tableFontSize: style.getPropertyValue('--table-font-size'),
  tableFontWeight: style.getPropertyValue('--table-font-weight'),
});
