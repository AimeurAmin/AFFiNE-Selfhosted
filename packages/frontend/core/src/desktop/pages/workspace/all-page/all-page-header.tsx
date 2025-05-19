import { type MenuProps } from '@affine/component';
import { ExplorerDisplayMenuButton } from '@affine/core/components/explorer/display-menu';
import { ViewToggle } from '@affine/core/components/explorer/display-menu/view-toggle';
import type { DocListItemView } from '@affine/core/components/explorer/docs-view/doc-list-item';
import { ExplorerNavigation } from '@affine/core/components/explorer/header/navigation';
import type { ExplorerDisplayPreference } from '@affine/core/components/explorer/types';
import { useCallback } from 'react';

import * as styles from './all-page-header.css';

const menuProps: Partial<MenuProps> = {
  contentOptions: {
    side: 'bottom',
    align: 'end',
    alignOffset: 0,
    sideOffset: 8,
  },
};
export const AllDocsHeader = ({
  displayPreference,
  onDisplayPreferenceChange,
}: {
  displayPreference: ExplorerDisplayPreference;
  onDisplayPreferenceChange: (
    displayPreference: ExplorerDisplayPreference
  ) => void;
}) => {
  const handleViewChange = useCallback(
    (view: DocListItemView) => {
      onDisplayPreferenceChange({ ...displayPreference, view });
    },
    [displayPreference, onDisplayPreferenceChange]
  );

  return (
    <div className={styles.header}>
      <ExplorerNavigation active="docs" />

      <div className={styles.actions}>
        <ViewToggle
          view={displayPreference.view ?? 'list'}
          onViewChange={handleViewChange}
        />
        <ExplorerDisplayMenuButton
          menuProps={menuProps}
          displayPreference={displayPreference}
          onDisplayPreferenceChange={onDisplayPreferenceChange}
        />
      </div>
    </div>
  );
};
