import { TabDirection } from "components/NumericInput";
import { getNthParentOf } from "utils/skipTab";

const VERY_SPECIAL_ID = "#\\#special";

export const moveToNextPrice = (
  input: HTMLInputElement,
  tabDirection: TabDirection
): void => {
  const parent: HTMLElement | null = getNthParentOf(input, 6);

  if (parent !== null) {
    console.log(parent);
    const specialRow = parent.querySelector(VERY_SPECIAL_ID);
    if (specialRow) {
      const inputs: ReadonlyArray<HTMLInputElement> = Array.from(
        specialRow.querySelectorAll("input")
      );

      if (inputs.length !== 4) {
        console.warn(`there should be 4 inputs, but I found ${inputs.length}`);
      }

      if (input === inputs[1]) {
        inputs[3].focus();
      } else {
        inputs[1].focus();
      }
      return;
    }
    const inputs: ReadonlyArray<HTMLInputElement> = Array.from(
      parent.querySelectorAll(":not(.dark-pool-base).price-layout input")
    );

    const index: number = inputs.indexOf(input);
    if (index === -1) {
      throw new Error("self has to have a non -1 index, this is crazy");
    }

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

    if ("readonly" in next && next["readonly"]) {
      return moveToNextPrice(next, tabDirection);
    }

    next.focus();
  }
};
