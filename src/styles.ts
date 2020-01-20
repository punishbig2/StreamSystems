const style: CSSStyleDeclaration = getComputedStyle(document.documentElement);
export default () => ({
  tableRowHeight: parseInt(style.getPropertyValue('--table-row-height')),
  windowToolbarHeight: parseInt(style.getPropertyValue('--window-toolbar-height')),
  tableHeaderHeight: parseInt(style.getPropertyValue('--table-header-height')),
});
