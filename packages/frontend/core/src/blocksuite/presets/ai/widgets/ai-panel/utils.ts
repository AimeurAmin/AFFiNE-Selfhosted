import type { EditorHost } from '@blocksuite/affine/block-std';
import type { AIItemGroupConfig } from '@blocksuite/affine/blocks';
import { isInsidePageEditor } from '@blocksuite/affine/blocks';

export function filterAIItemGroup(
  host: EditorHost,
  configs: AIItemGroupConfig[]
): AIItemGroupConfig[] {
  const editorMode = isInsidePageEditor(host) ? 'page' : 'edgeless';
  return configs
    .map(group => ({
      ...group,
      items: group.items.filter(item =>
        item.showWhen
          ? item.showWhen(host.command.chain(), editorMode, host)
          : true
      ),
    }))
    .filter(group => group.items.length > 0);
}
