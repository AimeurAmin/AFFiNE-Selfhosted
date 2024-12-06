import type { Doc } from '@toeverything/infra';
import { DocsService, FrameworkScope, useService } from '@toeverything/infra';
import { type PropsWithChildren, useEffect, useState } from 'react';

export const DocFrameScope = ({
  children,
  docId,
}: PropsWithChildren<{ docId: string }>) => {
  const docsService = useService(DocsService);

  const [doc, setDoc] = useState<Doc | null>(null);
  useEffect(() => {
    if (!docId) return;
    const docRef = docsService.open(docId);
    setDoc(docRef.doc);
    return () => {
      docRef.release();
      setDoc(null);
    };
  }, [docId, docsService]);

  if (!doc || !docId) return null;

  return <FrameworkScope scope={doc.scope}>{children}</FrameworkScope>;
};
