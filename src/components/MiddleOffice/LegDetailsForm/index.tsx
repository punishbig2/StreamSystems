import { Leg } from "components/MiddleOffice/interfaces/leg";
import { LegDetailsFields } from "components/MiddleOffice/LegDetailsForm/LegDetailsFields";
import { observer } from "mobx-react";
import { DealEntryStore } from "mobx/stores/dealEntryStore";
import moStore from "mobx/stores/moStore";
import MO from "mobx/stores/moStore";
import React, { ReactElement } from "react";

interface Props {
  dealEntryStore: DealEntryStore;
}

export const LegDetailsForm: React.FC<Props> = observer(
  (props: Props): ReactElement | null => {
    const { legs } = MO;
    const onValueChange = (index: number) => (key: keyof Leg, value: any) => {
      // Update the changed leg
      moStore.updateLeg(index, key, value);
    };
    return (
      <form>
        {legs.map((leg: Leg, index: number) => {
          return (
            <fieldset key={index}>
              <legend className={"leg-legend"}>Leg {index + 1}</legend>
              <LegDetailsFields
                leg={leg}
                dealEntryStore={props.dealEntryStore}
                onValueChange={onValueChange(index)}
              />
            </fieldset>
          );
        })}
      </form>
    );
  }
);
