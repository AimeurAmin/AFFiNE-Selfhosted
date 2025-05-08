import { PropertyValue } from '@affine/component';
import { PublicUserLabel } from '@affine/core/modules/cloud/views/public-user';
import { DocService } from '@affine/core/modules/doc';
import { WorkspaceService } from '@affine/core/modules/workspace';
import { useI18n } from '@affine/i18n';
import { useLiveData, useService } from '@toeverything/infra';

import { userWrapper } from './created-updated-by.css';

const CreatedByUpdatedByAvatar = (props: {
  type: 'CreatedBy' | 'UpdatedBy';
}) => {
  const docService = useService(DocService);
  const userId = useLiveData(
    props.type === 'CreatedBy'
      ? docService.doc.createdBy$
      : docService.doc.updatedBy$
  );

  if (userId) {
    return (
      <div className={userWrapper}>
        <PublicUserLabel id={userId} />
      </div>
    );
  }
  return <NoRecordValue />;
};

const NoRecordValue = () => {
  const t = useI18n();
  return (
    <span>
      {t['com.affine.page-properties.property-user-avatar-no-record']()}
    </span>
  );
};

const LocalUserValue = () => {
  const t = useI18n();
  return <span>{t['com.affine.page-properties.local-user']()}</span>;
};

export const CreatedByValue = () => {
  const workspaceService = useService(WorkspaceService);
  const isCloud = workspaceService.workspace.flavour !== 'local';

  if (!isCloud) {
    return (
      <PropertyValue readonly>
        <LocalUserValue />
      </PropertyValue>
    );
  }

  return (
    <PropertyValue readonly>
      <CreatedByUpdatedByAvatar type="CreatedBy" />
    </PropertyValue>
  );
};

export const UpdatedByValue = () => {
  const workspaceService = useService(WorkspaceService);
  const isCloud = workspaceService.workspace.flavour !== 'local';

  if (!isCloud) {
    return (
      <PropertyValue readonly>
        <LocalUserValue />
      </PropertyValue>
    );
  }

  return (
    <PropertyValue readonly>
      <CreatedByUpdatedByAvatar type="UpdatedBy" />
    </PropertyValue>
  );
};
