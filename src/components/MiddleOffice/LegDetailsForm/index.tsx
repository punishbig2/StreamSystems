import { LegDetailsFields } from "components/MiddleOffice/LegDetailsForm/LegDetailsFields";
import { Leg } from "components/MiddleOffice/types/leg";
import { StylesMap } from "legsUtils";
import { MoStatus } from "mobx/stores/moStore";
import React, { ReactElement } from "react";
import { DealEntry } from "structures/dealEntry";

interface Props {
  readonly entry: DealEntry;
  readonly status: MoStatus;
  readonly isEditMode: boolean;
  readonly legs: ReadonlyArray<Leg>;
  readonly isLoading: boolean;
  readonly onUpdateLeg: (index: number, key: keyof Leg, items: any) => void;
}

export const LegDetailsForm: React.FC<Props> = (
  props: Props
): ReactElement | null => {
  const { entry, legs } = props;
  const disabled: boolean = props.status !== MoStatus.Normal;
  const onValueChange = (index: number) => (key: keyof Leg, value: any) => {
    switch (key) {
      case "rates":
        break;
      case "hedge":
      case "premium":
        if (entry.premstyle === undefined) {
          props.onUpdateLeg(index, key, [null, null, null]);
        } else {
          const array: [number | null, number | null, number | null] = [
            ...legs[index][key],
          ];
          array[StylesMap[entry.premstyle]] = value;
          props.onUpdateLeg(index, key, array);
        }
        break;
      default:
        props.onUpdateLeg(index, key, value);
    }
  };
  return (
    <form>
      {legs.map((leg: Leg, index: number) => {
        return (
          <fieldset
            className={"group"}
            key={index}
            disabled={props.status !== MoStatus.Normal}
          >
            <legend className={"leg-legend"}>Leg {index + 1}</legend>
            <LegDetailsFields
              leg={leg}
              disabled={disabled}
              entry={entry}
              isEditMode={props.isEditMode}
              onValueChange={onValueChange(index)}
            />
          </fieldset>
        );
      })}
    </form>
  );
};
