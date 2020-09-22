import { Grid } from "@material-ui/core";
import { BrokerSection } from "components/MiddleOffice/SummaryLegDetailsForm/BrokerSection";
import { DealOutputSection } from "components/MiddleOffice/SummaryLegDetailsForm/DealOutputSection";
import { Field } from "components/MiddleOffice/SummaryLegDetailsForm/field";
import {
  fields,
  IsEditableData,
} from "components/MiddleOffice/SummaryLegDetailsForm/fields";
import { Commission } from "components/MiddleOffice/types/deal";
import { SummaryLeg } from "components/MiddleOffice/types/summaryLeg";
import { NoDataMessage } from "components/noDataMessage";
import { LdsSpinner } from "components/ldsSpinner";
import { FieldDef } from "forms/fieldDef";
import React, { ReactElement, useEffect, useState } from "react";
import { DealEntry } from "structures/dealEntry";

interface Props {
  readonly dealEntry: DealEntry;
  readonly summaryLeg: SummaryLeg | null;
  readonly isEditMode: boolean;
  readonly isLoading: boolean;
  readonly disabled: boolean;
  readonly onUpdateSummaryLeg: (
    fieldName: keyof SummaryLeg,
    value: any
  ) => void;
}

const initialCommission: Commission = {
  rate: null,
  value: null,
};

export const SummaryLegDetailsForm: React.FC<Props> = (
  props: Props
): ReactElement | null => {
  const { summaryLeg } = props;
  const { premstyle } = props.dealEntry;
  const [buyerCommission, setBuyerCommission] = useState<Commission>(
    initialCommission
  );
  const [sellerCommission, setSellerCommission] = useState<Commission>(
    initialCommission
  );
  useEffect(() => {
    const { commissions } = props.dealEntry;
    if (commissions === null || commissions === undefined) return;
    setBuyerCommission(commissions.buyer);
    setSellerCommission(commissions.seller);
  }, [props.dealEntry]);

  if (props.isLoading) {
    return (
      <div className={"centered-container"}>
        <LdsSpinner size={36} />
      </div>
    );
  } else if (summaryLeg === null) {
    return <NoDataMessage />;
  }
  const { dealOutput } = summaryLeg;
  const ignore = (event: React.FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
  };
  return (
    <>
      <form onSubmit={ignore}>
        <Grid container>
          <Grid alignItems={"stretch"} container item>
            <fieldset className={"group"} disabled={props.disabled}>
              {fields.map(
                (
                  field: FieldDef<SummaryLeg, IsEditableData, SummaryLeg>
                ): ReactElement => (
                  <Field
                    key={field.name + field.type}
                    summaryLeg={props.summaryLeg}
                    dealEntry={props.dealEntry}
                    isEditMode={props.isEditMode}
                    field={field}
                    onUpdateSummaryLeg={props.onUpdateSummaryLeg}
                  />
                )
              )}
            </fieldset>
          </Grid>
          <BrokerSection
            buyerCommission={buyerCommission}
            sellerCommission={sellerCommission}
            disabled={props.disabled}
          />
          <DealOutputSection
            dealEntry={props.dealEntry}
            dealOutput={dealOutput}
            disabled={props.disabled}
            premiumStyle={premstyle}
          />
        </Grid>
      </form>
    </>
  );
};
