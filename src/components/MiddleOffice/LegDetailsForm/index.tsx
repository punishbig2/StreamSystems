import { LegDetailsFields } from "components/MiddleOffice/LegDetailsForm/LegDetailsFields";
import { Leg } from "components/MiddleOffice/types/leg";
import { NoDataMessage } from "components/noDataMessage";
import { LdsSpinner } from "components/ldsSpinner";
import React, { ReactElement } from "react";
import { DealEntry } from "structures/dealEntry";
import { StyledValue } from "types/styledValue";
import { StylesMap } from "utils/legsUtils";

interface Props {
  readonly dealEntry: DealEntry;
  readonly isEditMode: boolean;
  readonly legs: ReadonlyArray<Leg>;
  readonly isLoading: boolean;
  readonly disabled: boolean;
  readonly onUpdateLeg: (
    index: number,
    key: keyof Leg,
    items: any
  ) => Promise<void>;
}

export const LegDetailsForm: React.FC<Props> = (
  props: Props
): ReactElement | null => {
  const { dealEntry, legs } = props;
  const onValueChange = (index: number) => async (
    key: keyof Leg,
    value: any
  ): Promise<void> => {
    switch (key) {
      case "rates":
        return undefined;
      case "hedge":
      case "price":
      case "premium":
        if (dealEntry.premstyle === undefined) {
          return props.onUpdateLeg(index, key, [null, null, null]);
        } else {
          const array: StyledValue = [...legs[index][key]];
          array[StylesMap[dealEntry.premstyle]] = value;
          return props.onUpdateLeg(index, key, array);
        }
      default:
        return props.onUpdateLeg(index, key, value);
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
                dealEntry={dealEntry}
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
