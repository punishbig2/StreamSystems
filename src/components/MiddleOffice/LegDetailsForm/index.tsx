import { Leg } from "components/MiddleOffice/types/leg";
import { LegDetailsFields } from "components/MiddleOffice/LegDetailsForm/LegDetailsFields";
import { StylesMap } from "legsUtils";
import { observer } from "mobx-react";
import moStore, { MOStatus } from "mobx/stores/moStore";
import React, { ReactElement } from "react";
import { DealEntry } from "structures/dealEntry";

interface Props {
  readonly entry: DealEntry;
  readonly status: MOStatus;
}

export const LegDetailsForm: React.FC<Props> = observer(
  (props: Props): ReactElement | null => {
    const { entry } = props;
    const { status, legs } = moStore;
    const disabled: boolean = status !== MOStatus.Normal;
    const onValueChange = (index: number) => (key: keyof Leg, value: any) => {
      switch (key) {
        case "rates":
          break;
        case "hedge":
        case "premium":
          if (entry.premstyle === undefined) {
            moStore.updateLeg(index, key, [null, null, null]);
          } else {
            const array: [number | null, number | null, number | null] = [
              ...legs[index][key],
            ];
            array[StylesMap[entry.premstyle]] = value;
            moStore.updateLeg(index, key, array);
          }
          break;
        default:
          moStore.updateLeg(index, key, value);
      }
    };
    return (
      <form>
        {legs.map((leg: Leg, index: number) => {
          return (
            <fieldset
              className={"group"}
              key={index}
              disabled={props.status !== MOStatus.Normal}
            >
              <legend className={"leg-legend"}>Leg {index + 1}</legend>
              <LegDetailsFields
                leg={leg}
                disabled={disabled}
                entry={entry}
                onValueChange={onValueChange(index)}
              />
            </fieldset>
          );
        })}
      </form>
    );
  }
);
