import {getNthParentOf} from 'utils/skipTab';

export const moveToNextPrice = (input: HTMLInputElement) => {
  // Move to the next price
  const parent: HTMLElement | null = getNthParentOf(input, 7);
  if (parent !== null) {
    const inputs: HTMLInputElement[] = Array.from(parent.querySelectorAll('.price-layout input.pod'));
    const index: number = inputs.indexOf(input);
    if (index === -1)
      throw new Error('self has to have a non -1 index, this is crazy');
    const next: HTMLInputElement = ((): HTMLInputElement => {
      if (index === inputs.length - 1) {
        return inputs[0];
      } else {
        return inputs[index + 1];
      }
    })();
    next.focus();
  }
};
