import { DatabaseSelectionExtension } from '@blocksuite/affine-block-database';
import {
  RootBlockHtmlAdapterExtension,
  RootBlockMarkdownAdapterExtension,
  RootBlockNotionHtmlAdapterExtension,
} from '@blocksuite/affine-block-root';
import { SurfaceBlockSchemaExtension } from '@blocksuite/affine-block-surface';
import {
  type StoreExtensionContext,
  StoreExtensionProvider,
} from '@blocksuite/affine-ext-loader';
import {
  HtmlInlineToDeltaAdapterExtensions,
  InlineDeltaToHtmlAdapterExtensions,
  InlineDeltaToMarkdownAdapterExtensions,
  MarkdownInlineToDeltaAdapterExtensions,
  NotionHtmlInlineToDeltaAdapterExtensions,
} from '@blocksuite/affine-inline-preset';
import {
  RootBlockSchemaExtension,
  TranscriptionBlockSchemaExtension,
} from '@blocksuite/affine-model';
import {
  HtmlAdapterFactoryExtension,
  MarkdownAdapterFactoryExtension,
  MixTextAdapterFactoryExtension,
  NotionHtmlAdapterFactoryExtension,
  NotionTextAdapterFactoryExtension,
  PlainTextAdapterFactoryExtension,
} from '@blocksuite/affine-shared/adapters';
import { HighlightSelectionExtension } from '@blocksuite/affine-shared/selection';
import {
  BlockMetaService,
  FeatureFlagService,
  FileSizeLimitService,
  LinkPreviewerService,
} from '@blocksuite/affine-shared/services';
import {
  BlockSelectionExtension,
  CursorSelectionExtension,
  SurfaceSelectionExtension,
  TextSelectionExtension,
} from '@blocksuite/std';
import type { ExtensionType } from '@blocksuite/store';

function getAdapterFactoryExtensions(): ExtensionType[] {
  return [
    MarkdownAdapterFactoryExtension,
    PlainTextAdapterFactoryExtension,
    HtmlAdapterFactoryExtension,
    NotionTextAdapterFactoryExtension,
    NotionHtmlAdapterFactoryExtension,
    MixTextAdapterFactoryExtension,
  ];
}

const defaultBlockHtmlAdapterMatchers = [RootBlockHtmlAdapterExtension];

const defaultBlockMarkdownAdapterMatchers = [RootBlockMarkdownAdapterExtension];

const defaultBlockNotionHtmlAdapterMatchers: ExtensionType[] = [
  RootBlockNotionHtmlAdapterExtension,
];

function getHtmlAdapterExtensions(): ExtensionType[] {
  return [
    ...HtmlInlineToDeltaAdapterExtensions,
    ...defaultBlockHtmlAdapterMatchers,
    ...InlineDeltaToHtmlAdapterExtensions,
  ];
}

function getMarkdownAdapterExtensions(): ExtensionType[] {
  return [
    ...MarkdownInlineToDeltaAdapterExtensions,
    ...defaultBlockMarkdownAdapterMatchers,
    ...InlineDeltaToMarkdownAdapterExtensions,
  ];
}

function getNotionHtmlAdapterExtensions(): ExtensionType[] {
  return [
    ...NotionHtmlInlineToDeltaAdapterExtensions,
    ...defaultBlockNotionHtmlAdapterMatchers,
  ];
}

const MigratingStoreExtensions: ExtensionType[] = [
  RootBlockSchemaExtension,
  SurfaceBlockSchemaExtension,
  TranscriptionBlockSchemaExtension,

  BlockSelectionExtension,
  TextSelectionExtension,
  SurfaceSelectionExtension,
  CursorSelectionExtension,
  HighlightSelectionExtension,
  DatabaseSelectionExtension,

  getHtmlAdapterExtensions(),
  getMarkdownAdapterExtensions(),
  getNotionHtmlAdapterExtensions(),
  getAdapterFactoryExtensions(),

  FeatureFlagService,
  LinkPreviewerService,
  FileSizeLimitService,
  BlockMetaService,
].flat();

export class MigratingStoreExtension extends StoreExtensionProvider {
  override name = 'migrating';

  override setup(context: StoreExtensionContext) {
    super.setup(context);
    context.register(MigratingStoreExtensions);
  }
}
