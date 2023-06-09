import getStyles, { Styles } from 'styles';

export const idealBlotterHeight = (): number => {
  const styles: Styles = getStyles();
  return styles.windowToolbarHeight + 2.3 * styles.tableHeaderHeight + 4 * styles.tableRowHeight;
};
