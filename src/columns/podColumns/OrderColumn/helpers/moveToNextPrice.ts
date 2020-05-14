import { getNthParentOf } from "utils/skipTab";
import { TabDirection } from "components/NumericInput";

export const moveToNextPrice = (
  input: HTMLInputElement,
  tabDirection: TabDirection
) => {
  // Move to the next price
  const parent: HTMLElement | null = getNthParentOf(input, 7);
  if (parent !== null) {
    const inputs: HTMLInputElement[] = Array.from(
      parent.querySelectorAll(":not(.dark-pool-base).price-layout input")
    );
    const index: number = inputs.indexOf(input);
    if (index === -1)
      throw new Error("self has to have a non -1 index, this is crazy");
    const next: HTMLInputElement = ((): HTMLInputElement => {
      if (
        tabDirection === TabDirection.Forward &&
        index === inputs.length - 1
      ) {
        return inputs[0];
      } else if (tabDirection === TabDirection.Backward && index === 0) {
        return inputs[inputs.length - 1];
      } else {
        return inputs[index + tabDirection];
      }
    })();
    next.focus();
  }
};
