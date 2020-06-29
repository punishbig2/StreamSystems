import { Grid } from "@material-ui/core";
import { FormField } from "components/formField";
import React, { ReactElement } from "react";
import { DealEntry } from "structures/dealEntry";
import { MOStrategy } from "components/MiddleOffice/interfaces/moStrategy";
import { observer } from "mobx-react";
import mo, { MoStore } from "mobx/stores/moStore";
import { FieldDef, SelectItem } from "forms/fieldDef";
import useLegs from "components/MiddleOffice/DealEntryForm/hooks/useLegs";
import { API } from "API";
import { ValuationModel } from "components/MiddleOffice/interfaces/pricer";
import { DealEntryStore, EntryType } from "mobx/stores/dealEntryStore";
import { ExistingEntryButtons } from "components/MiddleOffice/DealEntryForm/existingEntryButtons";
import { NewEntryButtons } from "components/MiddleOffice/DealEntryForm/newEntryButtons";
import { Deal } from "components/MiddleOffice/interfaces/deal";
import existingEntryFields from "components/MiddleOffice/DealEntryForm/existingEntryFields";
import newEntryFields from "components/MiddleOffice/DealEntryForm/newEntryFields";

interface Props {
  store: DealEntryStore;
}

const sendPricingRequest = (deal: Deal, entry: DealEntry): void => {
  if (deal === null || entry === null)
    throw new Error("no deal to get a pricing for");
  if (deal.strategy === undefined) throw new Error("invalid deal found");
  if (entry.model === "") throw new Error("node model specified");
  const valuationModel: ValuationModel = mo.getValuationModelById(
    entry.model as number
  );
  const strategy: MOStrategy = mo.getStrategyById(deal.strategy);
  mo.setSendingPricingRequest(true);
  API.sendPricingRequest(deal, entry, mo.legs, valuationModel, strategy).then(
    () => {
      mo.setSendingPricingRequest(false);
    }
  );
  mo.setSendingPricingRequest(false);
};

export const DealEntryForm: React.FC<Props> = observer(
  (props: Props): ReactElement | null => {
    const { store } = props;
    const { cuts, deal } = mo;
    const { entry } = store;

    useLegs(cuts, deal);

    const onPriced =
      deal === null ? undefined : () => sendPricingRequest(deal, entry);
    const mapper = (
      fieldDef: FieldDef<DealEntry, MoStore>
    ): ReactElement | null => {
      const { transformData, dataSource, ...field } = fieldDef;
      const source: any = !!dataSource ? mo[dataSource] : undefined;
      const data: SelectItem[] = !!transformData ? transformData(source) : [];
      const value: any = !!entry ? entry[field.name] : null;
      if (field.name === "style") {
        return null;
      }
      return (
        <FormField
          key={field.name + field.type}
          {...field}
          data={data}
          onChange={store.updateEntry}
          value={value}
        />
      );
    };

    const getActionButtons = (): ReactElement | null => {
      switch (store.entryType) {
        case EntryType.Empty:
          return null;
        case EntryType.ExistingDeal:
          return (
            <ExistingEntryButtons
              isModified={store.isModified}
              isPriced={false}
              onPriced={onPriced}
            />
          );
        case EntryType.New:
          return <NewEntryButtons />;
      }
    };

    const fields =
      store.entryType === EntryType.New ? newEntryFields : existingEntryFields;
    return (
      <form
        className={
          store.entryType === EntryType.Empty ? "invisible" : undefined
        }
      >
        <Grid alignItems={"stretch"} container>
          <Grid xs={12} item>
            <fieldset className={"full-height"}>{fields.map(mapper)}</fieldset>
          </Grid>
        </Grid>
        <div className={"button-box"}>{getActionButtons()}</div>
      </form>
    );
  }
);
