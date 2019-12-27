const getNthParentOf = (element: Element, count: number): Element | null => {
  let parent: Node | null = element.parentNode;
  for (let i = 0; i < count - 1; ++i) {
    if (parent === null)
      return null;
    parent = parent.parentNode;
  }
  return parent as Element;
};

export const skipTabIndex = (target: HTMLInputElement, n: number, cycle: number = 0) => {
  const parent: Element | null = getNthParentOf(target, 4);
  if (parent !== null) {
    const inputs: HTMLInputElement[] = Array.from(parent.querySelectorAll('input:not([tabindex="-1"])'));
    const startAt: number = inputs.indexOf(target);
    if (startAt === -1)
      return;
    const next: HTMLInputElement = inputs[startAt + n];
    if (next) {
      // Now just focus the input
      next.focus();
    } else {
      if (inputs[cycle]) {
        inputs[cycle].focus();
      }
    }
  }
};

export const skipTabIndexAll = (target: HTMLInputElement, n: number, cycle: number = 0) => {
  const parent: Element | null = getNthParentOf(target, 4);
  if (parent !== null) {
    const inputs: HTMLInputElement[] = Array.from(parent.querySelectorAll('input'));
    const startAt: number = inputs.indexOf(target);
    if (startAt === -1)
      return;
    const next: HTMLInputElement = inputs[startAt + n];
    if (next) {
      // Now just focus the input
      next.focus();
    } else {
      if (inputs[cycle]) {
        inputs[cycle].focus();
      }
    }
  }
};
