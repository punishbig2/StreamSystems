import React, { ReactElement } from "react";
import { LegDetailsFields } from "components/MiddleOffice/LegDetailsForm/LegDetailsFields";
import { Leg } from "components/MiddleOffice/interfaces/leg";
import middleOfficeStore from "mobx/stores/middleOfficeStore";
import { observer } from "mobx-react";
import { NoDataMessage } from "components/noDataMessage";

interface Props {}

export const LegDetailsForm: React.FC<Props> = observer(
  (): ReactElement | null => {
    const { legs } = middleOfficeStore;
    if (legs.length === 0) {
      return <NoDataMessage />;
    }
    return (
      <form>
        {legs.map((leg: Leg, index: number) => {
          return (
            <fieldset key={index}>
              <legend className={"leg-legend"}>Leg {index + 1}</legend>
              <LegDetailsFields {...leg} />
            </fieldset>
          );
        })}
      </form>
    );
  }
);
