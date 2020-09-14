import { MenuItem, Select } from "@material-ui/core";
import { ReadOnlyField } from "components/FormField/readOnlyField";
import { SearchItem } from "components/FormField/searchItem";
import { DropdownItem } from "forms/fieldDef";
import React, { Component } from "react";

interface Props<T, R> {
  readonly disabled?: boolean;
  readonly value: any;
  readonly name: keyof T;
  readonly editable?: boolean;
  readonly items: DropdownItem<R>[];
  readonly onChange?: (name: keyof T, value: any) => void;
  readonly emptyMessage: string;
}

interface State {
  readonly searchKeyword: string;
}

export class DropdownField<T, R = string> extends Component<
  Props<T, R>,
  State
> {
  public state: State = {
    searchKeyword: "",
  };

  private onChange = (
    event: React.ChangeEvent<{ name?: string; value: unknown }>,
    child: React.ReactNode
  ) => {
    const { props } = this;
    const { items } = props;
    if (!props.editable) return;
    const { value } = event.target;
    const item: DropdownItem<R> | undefined = items.find(
      (item: DropdownItem<R>): boolean => item.value === value
    );
    if (item === undefined) {
      console.warn("oops, cannot find the item for: " + value);
      return;
    }
    // Call the callback
    setTimeout(() => {
      if (props.onChange !== undefined) {
        // We copy the object here in order to remove
        // any proxies that it might be wrapped into
        props.onChange(props.name, item.internalValue);
      }
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

  private renderSelectValue = (value: any): string => {
    const { props } = this;
    const { items } = props;
    const item: DropdownItem<R> | undefined = items.find(
      (item: DropdownItem<R>): boolean => {
        return item.value === value;
      }
    );
    if (item === undefined) return props.emptyMessage;
    return item.label;
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

  public render(): React.ReactElement {
    const { props } = this;
    const { items } = props;
    if (!props.editable) {
      return (
        <ReadOnlyField
          name={props.name as string}
          disabled={props.disabled}
          value={this.renderSelectValue(props.value)}
        />
      );
    }
    return (
      <Select
        value={props.value}
        renderValue={this.renderSelectValue}
        displayEmpty={true}
        readOnly={!props.editable}
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
