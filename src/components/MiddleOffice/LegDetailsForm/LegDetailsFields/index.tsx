import React, { ReactElement } from "react";
import { Grid } from "@material-ui/core";
import { Leg } from "components/MiddleOffice/interfaces/leg";

import fields from "./fields";
import moStore from "mobx/stores/moStore";
import { fieldsMapper } from "components/MiddleOffice/LegDetailsForm/LegDetailsFields/fieldMapper";

type Props = {
  leg: Leg;
  onValueChange: (key: keyof Leg, value: any) => void;
};
export const LegDetailsFields: React.FC<Props> = (
  props: Props
): ReactElement | null => {
  const deal = moStore.deal;
  if (deal === null) return null;
  return <Grid container>{fields.map(fieldsMapper(props.leg, props.onValueChange))}</Grid>;
};
