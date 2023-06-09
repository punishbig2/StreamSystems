export const getNthParentOf = (element: HTMLElement, count: number): HTMLElement | null => {
  let parent: HTMLElement | null = element.parentElement;
  for (let i = 0; i < count - 1; ++i) {
    if (parent === null) return null;
    parent = parent.parentElement;
  }
  return parent;
};

export const skipTabIndex = (target: HTMLInputElement, n: number, cycle = 0): void => {
  const parent: Element | null = getNthParentOf(target, 4);
  if (parent !== null) {
    const tabindex: any = target.getAttribute('tabindex');
    // Force it to work
    target.removeAttribute('tabindex');
    const inputs: HTMLInputElement[] = Array.from(
      parent.querySelectorAll('input:not([tabindex="-1"]):not([readonly])')
    );
    target.setAttribute('tabindex', tabindex);
    const startAt: number = inputs.indexOf(target);
    if (startAt === -1) return;
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

export const skipTabIndexAll = (
  target: HTMLInputElement,
  n: number,
  cycle: number | 'first-row' | 'last-row' = 0,
  containerDistance = 7
): void => {
  const parent: Element | null = getNthParentOf(target, containerDistance);
  if (parent !== null) {
    const inputs: HTMLInputElement[] = Array.from(parent.querySelectorAll('input'));
    const startAt: number = inputs.indexOf(target);
    if (startAt === -1) {
      return;
    }
    const next: HTMLInputElement = inputs[startAt + n];
    if (next) {
      // Now just focus the input
      next.focus();
    } else {
      if (cycle === 'first-row') {
        return;
      } else if (cycle === 'last-row') {
        return;
      } else {
        if (inputs[cycle]) {
          inputs[cycle].focus();
        }
      }
    }
  }
};
