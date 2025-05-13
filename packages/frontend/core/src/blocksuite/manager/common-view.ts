import { buildDocDisplayMetaExtension } from '@affine/core/blocksuite/extensions/display-meta';
import { patchFileSizeLimitExtension } from '@affine/core/blocksuite/extensions/file-size-limit';
import {
  type ViewExtensionContext,
  ViewExtensionProvider,
} from '@blocksuite/affine/ext-loader';
import { FrameworkProvider } from '@toeverything/infra';
import { z } from 'zod';

const optionsSchema = z.object({
  framework: z.instanceof(FrameworkProvider).optional(),
});

export class AffineCommonViewExtension extends ViewExtensionProvider<
  z.infer<typeof optionsSchema>
> {
  override name = 'affine-view-extensions';

  override schema = optionsSchema;

  override setup(
    context: ViewExtensionContext,
    options?: z.infer<typeof optionsSchema>
  ) {
    super.setup(context, options);
    const { framework } = options || {};
    if (framework) {
      context.register(buildDocDisplayMetaExtension(framework));
      if (context.scope === 'edgeless' || context.scope === 'page') {
        context.register(patchFileSizeLimitExtension(framework));
      }
    }
  }
}
