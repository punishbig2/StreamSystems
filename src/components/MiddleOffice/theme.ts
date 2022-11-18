import { createTheme as createMuiTheme, Theme } from '@material-ui/core';
import { alpha } from '@material-ui/core/styles';
import { Palette } from '@material-ui/core/styles/createPalette';
import { getPalette } from 'styles/palette';
import { typography } from 'styles/typography';

const labelWidth = '35%';
const fieldSize = 25;

export const createTheme = (name: string, fontFamily: string): Theme => {
  const palette: Palette = getPalette(name as 'light' | 'dark');
  return createMuiTheme({
    spacing: 4,
    palette: palette,
    typography: typography(palette, fontFamily),
    overrides: {
      MuiMenuItem: {
        root: {
          fontSize: 'smaller',
          fontWeight: 600,
        },
      },
      MuiOutlinedInput: {
        root: {
          borderRadius: 0,
        },
        adornedStart: {
          paddingLeft: 8,
        },
        adornedEnd: {
          paddingRight: 8,
        },
        input: {
          paddingTop: 0,
          paddingBottom: 0,
          paddingLeft: 8,
          paddingRight: 8,
          height: fieldSize,
          lineHeight: fieldSize + 'px',
        },
        notchedOutline: {
          borderRadius: 3,
          borderWidth: 1,
          borderStyle: 'solid',
          borderColor: 'inherit',
        },
      },
      MuiSelect: {
        selectMenu: {
          height: fieldSize,
          lineHeight: fieldSize + 'px',
        },
        iconOutlined: {
          fill: 'inherit',
          '&$disabled': {
            fill: palette.text.disabled,
          },
        },
      },
      MuiInputBase: {
        root: {
          fontWeight: 600,
          fontSize: 'smaller',
          color: 'inherit',
          height: fieldSize,
          lineHeight: fieldSize + 'px',
          flex: 1,
          marginTop: 3,
          marginBottom: 3,
          '&$error': {
            backgroundColor: alpha(palette.error.main, 0.15),
            color: palette.error.main,
          },
        },
        input: {
          paddingTop: 0,
          paddingBottom: 0,
        },
      },
      MuiFormLabel: {
        root: {
          minWidth: labelWidth,
          maxWidth: labelWidth,
          fontWeight: 500,
          fontSize: 'smaller',
          color: 'inherit',
          '&$disabled': {
            color: alpha(palette.text.disabled, 0.5),
          },
        },
      },
    },
    props: {
      MuiTextField: {
        variant: 'outlined',
        label: null,
      },
      MuiSelect: {
        variant: 'outlined',
      },
    },
  });
};
