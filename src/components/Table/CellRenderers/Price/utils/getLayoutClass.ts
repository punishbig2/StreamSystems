export const getLayoutClass = (flash: boolean) => {
  const classes = ['price-layout'];
  if (flash)
    classes.push('flash');
  return classes.join(' ');
};
