import { LegDetailsFields } from "components/MiddleOffice/LegDetailsForm/LegDetailsFields";
import { Leg } from "components/MiddleOffice/types/leg";
import { NoDataMessage } from "components/noDataMessage";
import { LdsSpinner } from "components/ldsSpinner";
import React, { ReactElement } from "react";
import { DealEntry } from "structures/dealEntry";
import { StylesMap } from "utils/legsUtils";

interface Props {
  readonly entry: DealEntry;
  readonly isEditMode: boolean;
  readonly legs: ReadonlyArray<Leg>;
  readonly isLoading: boolean;
  readonly disabled: boolean;
  readonly onUpdateLeg: (index: number, key: keyof Leg, items: any) => void;
}

export const LegDetailsForm: React.FC<Props> = (
  props: Props
): ReactElement | null => {
  const { entry, legs } = props;
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
  if (props.isLoading) {
    return (
      <div className={"form-group"}>
        <div className={"centered-container"}>
          <LdsSpinner size={64} />
        </div>
      </div>
    );
  } else if (legs.length === 0) {
    return (
      <div className={"form-group"}>
        <NoDataMessage />
      </div>
    );
  }
  return (
    <div className={"form-group"}>
      <form>
        {legs.map((leg: Leg, index: number) => {
          return (
            <fieldset className={"group"} key={index} disabled={props.disabled}>
              <legend className={"leg-legend"}>Leg {index + 1}</legend>
              <LegDetailsFields
                leg={leg}
                disabled={props.disabled}
                dealEntry={entry}
                isEditMode={props.isEditMode}
                onValueChange={onValueChange(index)}
              />
            </fieldset>
          );
        })}
      </form>
    </div>
  );
};
