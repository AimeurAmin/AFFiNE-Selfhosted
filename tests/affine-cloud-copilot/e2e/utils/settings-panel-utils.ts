import { expect, type Page } from '@playwright/test';

const WORKSPACE_EMBEDDING_SWITCH_TEST_ID = 'workspace-embedding-setting-switch';

export class SettingsPanelUtils {
  public static async openSettingsPanel(page: Page) {
    if (await page.getByTestId('workspace-setting:embedding').isHidden()) {
      await page.getByTestId('slider-bar-workspace-setting-button').click();
      await page.getByTestId('workspace-setting:embedding').click();
      await page.getByTestId('workspace-embedding-setting-wrapper').waitFor({
        state: 'visible',
      });
    }
  }

  public static async closeSettingsPanel(page: Page) {
    if (
      await page.getByTestId('workspace-embedding-setting-wrapper').isVisible()
    ) {
      await page.getByTestId('modal-close-button').click();
      await page.getByTestId('workspace-embedding-setting-wrapper').waitFor({
        state: 'hidden',
      });
    }
  }

  public static async isWorkspaceEmbeddingEnabled(page: Page) {
    const input = await page
      .getByTestId(WORKSPACE_EMBEDDING_SWITCH_TEST_ID)
      .locator('input');
    return (await input.getAttribute('value')) === 'on';
  }

  public static async waitForWorkspaceEmbeddingSwitchToBe(
    page: Page,
    enabled: boolean
  ) {
    const input = await page
      .getByTestId(WORKSPACE_EMBEDDING_SWITCH_TEST_ID)
      .locator('input');
    await expect(input).toHaveAttribute('value', enabled ? 'on' : 'off');
  }

  public static async toggleWorkspaceEmbedding(page: Page) {
    const input = await page.getByTestId(WORKSPACE_EMBEDDING_SWITCH_TEST_ID);
    await input.click();
  }

  public static async enableWorkspaceEmbedding(page: Page) {
    const enabled = await this.isWorkspaceEmbeddingEnabled(page);
    if (!enabled) {
      await this.toggleWorkspaceEmbedding(page);
    }
    await this.waitForWorkspaceEmbeddingSwitchToBe(page, true);
  }

  public static async disableWorkspaceEmbedding(page: Page) {
    const enabled = await this.isWorkspaceEmbeddingEnabled(page);
    if (enabled) {
      await this.toggleWorkspaceEmbedding(page);
    }
    await this.waitForWorkspaceEmbeddingSwitchToBe(page, false);
  }

  public static async uploadWorkspaceEmbedding(
    page: Page,
    attachments: { name: string; mimeType: string; buffer: Buffer }[]
  ) {
    await page.evaluate(() => {
      delete window.showOpenFilePicker;
    });

    for (const attachment of attachments) {
      const fileChooserPromise = page.waitForEvent('filechooser');
      await page
        .getByTestId('workspace-embedding-setting-upload-button')
        .click();

      const fileChooser = await fileChooserPromise;
      await fileChooser.setFiles(attachment);
    }
  }

  public static async removeAllAttachments(page: Page) {
    const itemId = 'workspace-embedding-setting-attachment-item';
    let count = await page.getByTestId(itemId).count();

    while (count > 0) {
      const attachmentItem = await page.getByTestId(itemId).first();
      const hasErrorItem = await attachmentItem
        .getByTestId('workspace-embedding-setting-attachment-error-item')
        .isVisible();
      await attachmentItem
        .getByTestId('workspace-embedding-setting-attachment-delete-button')
        .click();

      if (!hasErrorItem) {
        await page.getByTestId('confirm-modal-confirm').click();
      }
      await page.waitForTimeout(1000);
      count = await page.getByTestId(itemId).count();
    }
  }

  public static async removeAttachment(
    page: Page,
    attachment: string,
    shouldConfirm = true
  ) {
    const attachmentItem = await page
      .getByTestId('workspace-embedding-setting-attachment-item')
      .filter({ hasText: attachment });
    await attachmentItem
      .getByTestId('workspace-embedding-setting-attachment-delete-button')
      .click();
    if (shouldConfirm) {
      await page.getByTestId('confirm-modal-confirm').click();
    }
    await page
      .getByTestId('workspace-embedding-setting-attachment-item')
      .filter({ hasText: attachment })
      .waitFor({
        state: 'hidden',
      });
  }

  public static async ignoreDocForEmbedding(page: Page, doc: string) {
    // Open Dos Searcher
    const ignoreDocsButton = await page.getByTestId(
      'workspace-embedding-setting-ignore-docs-button'
    );
    await ignoreDocsButton.click();
    // Search and select the doc
    const searcher = await page.getByTestId('doc-selector-layout');
    const searchInput = await page.getByTestId('doc-selector-search-input');

    await searchInput.focus();
    await page.keyboard.insertText(doc);

    const pageListItem = searcher.getByTestId('page-list-item');
    await expect(pageListItem).toHaveCount(1);
    const pageListItemTitle = pageListItem.getByTestId(
      'page-list-item-title-text'
    );
    await expect(pageListItemTitle).toHaveText(doc);

    await pageListItem.getByTestId('affine-checkbox').check();

    await searcher.getByTestId('doc-selector-confirm-button').click();

    const ignoredDocs = await page.getByTestId(
      'workspace-embedding-setting-ignore-docs-list'
    );
    await expect(
      ignoredDocs
        .getByTestId('workspace-embedding-setting-ignore-docs-list-item')
        .filter({ hasText: doc })
    ).toBeVisible();
  }

  public static async clearAllIgnoredDocs(page: Page) {
    const ignoredDocs = await page.getByTestId('ignore-doc-title').all();
    for (const ignoredDoc of ignoredDocs) {
      const doc = await ignoredDoc.innerText();
      // Open Dos Searcher
      const ignoreDocsButton = await page.getByTestId(
        'workspace-embedding-setting-ignore-docs-button'
      );
      await ignoreDocsButton.click();
      // Search and select the doc
      const searcher = await page.getByTestId('doc-selector-layout');
      const searchInput = await page.getByTestId('doc-selector-search-input');

      await searchInput.focus();
      await page.keyboard.insertText(doc);

      const pageListItem = searcher.getByTestId('page-list-item');
      await expect(pageListItem).toHaveCount(1);

      await pageListItem.getByTestId('affine-checkbox').uncheck();

      await searcher.getByTestId('doc-selector-confirm-button').click();
    }
  }
}
