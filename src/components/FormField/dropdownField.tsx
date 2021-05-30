import { Grid, MenuItem, Select } from "@material-ui/core";
import { ReadOnlyField } from "components/FormField/readOnlyField";
import { SearchItem } from "components/FormField/searchItem";
import { LoadingEllipsis } from "components/loadingEllipsis";
import { DropdownItem } from "forms/fieldDef";
import React, { Component, ReactElement } from "react";

interface Props<T, R> {
  readonly disabled?: boolean;
  readonly value: any;
  readonly name: keyof T;
  readonly editable?: boolean;
  readonly items: ReadonlyArray<DropdownItem<R>>;
  readonly onChange?: (name: keyof T, value: any) => Promise<void>;
  readonly emptyMessage: string;
}

type HashMap<T> = { [key: string]: T };

interface State<R> {
  readonly loading: boolean;
  readonly searchKeyword: string;
  readonly valuesMap: HashMap<DropdownItem<R>>;
}

export class DropdownField<T, R = string> extends Component<
  Props<T, R>,
  State<R>
> {
  public state: State<R> = {
    loading: false,
    searchKeyword: "",
    valuesMap: {},
  };

  public componentDidUpdate(prevProps: Readonly<Props<T, R>>) {
    const { props } = this;
    if (prevProps.items !== props.items) {
      const { items } = props;
      this.setState({
        valuesMap: items.reduce(
          (
            next: HashMap<DropdownItem<R>>,
            item: DropdownItem
          ): HashMap<DropdownItem<R>> => {
            return {
              ...next,
              [item.value]: item,
            };
          },
          {}
        ),
      });
    }
  }

  public render(): React.ReactElement {
    const { props, state } = this;
    const { items } = props;
    if (!props.editable) {
      return (
        <ReadOnlyField
          name={props.name as string}
          disabled={props.disabled}
          value={this.getValueAsString(props.value)}
        />
      );
    } else {
      return (
        <Select
          value={props.value}
          renderValue={this.renderSelectValue}
          displayEmpty={true}
          readOnly={state.loading}
          disabled={props.disabled}
          onChange={this.onChange}
        >
          {this.getSearchItem()}
          {items.filter(this.filterItems).map((item: DropdownItem<R>) => (
            <MenuItem key={item.value} value={item.value}>
              {item.label}
            </MenuItem>
          ))}
        </Select>
      );
    }
  }

  private onChange = (
    event: React.ChangeEvent<{ name?: string; value: unknown }>,
    child: React.ReactNode
  ) => {
    const { props } = this;
    if (!props.editable) return;
    const { value } = event.target;
    const item: DropdownItem<R> | undefined = this.getItem(value);
    if (item === undefined) {
      console.warn("oops, cannot find the item for: " + value);
      return;
    }
    setTimeout(() => {
      this.setState(
        {
          loading: true,
        },
        () => {
          // Call the callback
          setTimeout(() => {
            if (props.onChange !== undefined) {
              // We copy the object here in order to remove
              // any proxies that it might be wrapped into
              props.onChange(props.name, item.internalValue).finally(() => {
                this.setState({
                  loading: false,
                });
              });
            }
          }, 0);
        }
      );
    }, 0);
    // Child is unused
    void child;
  };

  private onFilterChange = (value: string): void => {
    this.setState({
      searchKeyword: value,
    });
  };

  private filterItems = (item: DropdownItem<R>): boolean => {
    const { searchKeyword } = this.state;
    const trimmed: string = searchKeyword.trim();
    if (trimmed === "") return true;
    const { value } = item;
    const normalizedKeyword: string = trimmed.toLowerCase();
    if (typeof value === "string") {
      // Ignore casing, as humans generally do so!
      const normalizedValue: string = value.toLowerCase();
      // Check that the value, includes the keyword
      return normalizedValue.includes(normalizedKeyword);
    } else {
      // FIXME: unsure of this
      return value.toString() === normalizedKeyword;
    }
  };

  private getItem(value: any): DropdownItem {
    const { valuesMap } = this.state;
    if (value in valuesMap) {
      return valuesMap[value];
    } else {
      return {
        value: "",
        internalValue: "",
        label: "",
      };
    }
  }

  private getValueAsString = (value: any): string => {
    const { props } = this;
    const item: DropdownItem<R> | undefined = this.getItem(value);
    if (item === undefined) return props.emptyMessage;
    return item.label;
  };

  private renderSelectValue = (value: any): ReactElement | string => {
    const { state } = this;
    if (state.loading) {
      return (
        <Grid spacing={1} alignItems={"center"} container>
          <Grid item>Working</Grid>
          <Grid item>
            <LoadingEllipsis />
          </Grid>
        </Grid>
      );
    }
    return this.getValueAsString(value);
  };

  private getSearchItem = (): React.ReactElement | null => {
    const { items } = this.props;
    if (items.length < 7) return null;
    return (
      <SearchItem
        onSelectNext={() => undefined}
        onSelectPrev={() => undefined}
        onChange={this.onFilterChange}
      />
    );
  };
}
