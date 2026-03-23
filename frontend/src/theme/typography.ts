import type { TypographyVariantsOptions } from '@mui/material/styles';

const sansFont = '"Public Sans", "Segoe UI", sans-serif';
const monoFont = '"IBM Plex Mono", monospace';

export const typography: TypographyVariantsOptions = {
  fontFamily: sansFont,
  fontSize: 14,
  h1: {
    fontFamily: sansFont,
    fontWeight: 700,
    letterSpacing: '-0.04em',
    lineHeight: 1.08,
  },
  h2: {
    fontFamily: sansFont,
    fontWeight: 700,
    letterSpacing: '-0.035em',
    lineHeight: 1.12,
  },
  h3: {
    fontFamily: sansFont,
    fontWeight: 600,
    letterSpacing: '-0.02em',
    lineHeight: 1.15,
  },
  h4: {
    fontFamily: sansFont,
    fontWeight: 600,
    letterSpacing: '-0.01em',
  },
  h5: {
    fontFamily: sansFont,
    fontWeight: 600,
  },
  h6: {
    fontFamily: sansFont,
    fontWeight: 600,
    letterSpacing: '-0.01em',
  },
  body1: {
    fontFamily: sansFont,
    fontSize: '0.975rem',
    lineHeight: 1.6,
  },
  body2: {
    fontFamily: sansFont,
    fontSize: '0.9rem',
    lineHeight: 1.55,
  },
  button: {
    fontFamily: sansFont,
    fontWeight: 600,
    letterSpacing: '-0.01em',
  },
  subtitle1: {
    fontFamily: sansFont,
    fontWeight: 600,
  },
  subtitle2: {
    fontFamily: sansFont,
    fontWeight: 500,
  },
  caption: {
    fontFamily: sansFont,
    lineHeight: 1.45,
  },
  overline: {
    fontFamily: monoFont,
    textTransform: 'none',
    letterSpacing: '0.06em',
  },
};
