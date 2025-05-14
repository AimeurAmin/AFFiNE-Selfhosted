import { cssVarV2 } from '@toeverything/theme/v2';
import { style } from '@vanilla-extract/css';
export const scrollContainer = style({
  flex: 1,
  width: '100%',
  paddingBottom: '32px',
});
export const headerCreateNewButton = style({
  transition: 'opacity 0.1s ease-in-out',
});

export const headerCreateNewCollectionIconButton = style({
  padding: '4px 8px',
  fontSize: '16px',
  width: '32px',
  height: '28px',
  borderRadius: '8px',
});
export const headerCreateNewButtonHidden = style({
  opacity: 0,
  pointerEvents: 'none',
});

export const body = style({
  display: 'flex',
  flexDirection: 'column',
  flex: 1,
  height: '100%',
  width: '100%',
  containerName: 'docs-body',
  containerType: 'size',
});

export const scrollArea = style({
  height: 0,
  flex: 1,
  paddingTop: '24px',
});

// group
export const groupHeader = style({
  background: cssVarV2.layer.background.primary,
});

export const docItem = style({
  transition: 'width 0.2s ease-in-out',
});

export const pinnedCollection = style({
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
  padding: '0 24px',
  paddingTop: '24px',
  '@container': {
    'docs-body (width <= 500px)': {
      padding: '0 20px',
    },
    'docs-body (width <= 393px)': {
      padding: '0 16px',
    },
  },
});

export const filterArea = style({
  display: 'flex',
  flexDirection: 'row',
  gap: 8,
  padding: '0 24px',
  paddingTop: '24px',
  '@container': {
    'docs-body (width <= 500px)': {
      padding: '0 20px',
    },
    'docs-body (width <= 393px)': {
      padding: '0 16px',
    },
  },
});

export const filters = style({
  flex: 1,
});
