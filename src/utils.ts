export const arrayInsertAt = (array: any[], source: number, target: number) => {
  const fn1 = (item: any, index: number, array: any[]) => {
    if (index === target) {
      return array[source];
    } else if (index > target && index <= source) {
      return array[index - 1];
    } else {
      return array[index];
    }
  };
  const fn2 = (item: any, index: number, array: any[]) => {
    if (index === target - 1) {
      return array[source];
    } else if (index >= source && index < target - 1) {
      return array[index + 1];
    } else {
      return array[index];
    }
  };
  return array.map(target < source ? fn1 : fn2);
};
