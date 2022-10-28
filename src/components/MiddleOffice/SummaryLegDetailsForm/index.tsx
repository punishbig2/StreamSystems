import { Grid } from "@material-ui/core";
import { LdsSpinner } from "components/ldsSpinner";
import { BrokerSection } from "components/MiddleOffice/SummaryLegDetailsForm/BrokerSection";
import { DealOutputSection } from "components/MiddleOffice/SummaryLegDetailsForm/DealOutputSection";
import { Field } from "components/MiddleOffice/SummaryLegDetailsForm/field";

import { fields } from "components/MiddleOffice/SummaryLegDetailsForm/fields";
import { SummaryLeg } from "components/MiddleOffice/types/summaryLeg";
import { NoDataMessage } from "components/noDataMessage";
import { FieldDef } from "forms/fieldDef";
import {
  MiddleOfficeStore,
  MiddleOfficeStoreContext,
} from "mobx/stores/middleOfficeStore";
import React, { ReactElement } from "react";
import { DealEntry } from "types/dealEntry";
import { BrokerageCommission } from "types/brokerageCommission";

interface Props {
  readonly dealEntry: DealEntry;
  readonly summaryLeg: SummaryLeg | null;
  readonly isEditMode: boolean;
  readonly isLoading: boolean;
  readonly disabled: boolean;
  readonly onUpdateSummaryLeg: (
    fieldName: keyof SummaryLeg,
    value: any
  ) => Promise<void>;
}

export const SummaryLegDetailsForm: React.FC<Props> = (
  props: Props
): ReactElement | null => {
  const store = React.useContext<MiddleOfficeStore>(MiddleOfficeStoreContext);
  const { summaryLeg, dealEntry } = props;
  const { premstyle } = dealEntry;
  if (props.isLoading) {
    return (
      <div className="centered-container">
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
          <Grid alignItems="stretch" container item>
            <fieldset className="group" disabled={props.disabled}>
              {fields.map(
                (field: FieldDef<SummaryLeg, SummaryLeg>): ReactElement => (
                  <Field
                    key={field.name + field.type}
                    disabled={props.disabled}
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
            buyerComm={dealEntry.buyer_comm}
            buyerCommRate={dealEntry.buyer_comm_rate}
            sellerComm={dealEntry.seller_comm}
            sellerCommRate={dealEntry.seller_comm_rate}
            onUpdateCommission={async (
              value: BrokerageCommission
            ): Promise<void> => {
              store.updateDealEntry({
                ...value,
              });
            }}
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
