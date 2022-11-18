import getStyles, { Styles } from 'styles';

export const idealBlotterHeight = (): number => {
  const styles: Styles = getStyles();
  return styles.windowToolbarHeight + styles.tableHeaderHeight + 4 * styles.tableRowHeight;
};
