import { loginUser } from '@affine-test/kit/utils/cloud';
import { expect } from '@playwright/test';

import { test } from '../base/base-test';

test.describe('AIAction/GenerateHeadings', () => {
  test.beforeEach(async ({ page, utils }) => {
    const user = await utils.testUtils.getUser();
    await loginUser(page, user);
    await utils.testUtils.setupTestEnvironment(page);
    await utils.chatPanel.openChatPanel(page);
  });

  test('should generate headings for selected content', async ({
    page,
    utils,
  }) => {
    const { generateHeadings } = await utils.editor.askAIWithText(
      page,
      'AFFiNE is a workspace with fully merged docs'
    );
    const { answer, responses } = await generateHeadings();
    await Promise.race([
      answer.locator('h1').isVisible(),
      answer.locator('h2').isVisible(),
      answer.locator('h3').isVisible(),
    ]);
    await expect(answer).toHaveText(/AFFiNE/, { timeout: 10000 });
    expect(responses).toEqual(new Set(['insert-above', 'replace-selection']));
  });

  test.fixme(
    'should generate headings for selected text block in edgeless',
    async ({ page, utils }) => {
      const { generateHeadings } = await utils.editor.askAIWithEdgeless(
        page,
        async () => {
          await utils.editor.createEdgelessText(
            page,
            'AFFiNE is a workspace with fully merged docs'
          );
        }
      );

      const { answer, responses } = await generateHeadings();
      await Promise.race([
        answer.locator('h1').isVisible(),
        answer.locator('h2').isVisible(),
        answer.locator('h3').isVisible(),
      ]);
      await expect(answer).toHaveText(/AFFiNE/, { timeout: 10000 });
      expect(responses).toEqual(new Set(['insert-above']));
    }
  );

  test.fixme(
    'should generate headings for selected note block in edgeless',
    async ({ page, utils }) => {
      const { generateHeadings } = await utils.editor.askAIWithEdgeless(
        page,
        async () => {
          await utils.editor.createEdgelessNote(
            page,
            'AFFiNE is a workspace with fully merged docs'
          );
        }
      );

      const { answer, responses } = await generateHeadings();
      await Promise.race([
        answer.locator('h1').isVisible(),
        answer.locator('h2').isVisible(),
        answer.locator('h3').isVisible(),
      ]);
      await expect(answer).toHaveText(/AFFiNE/, { timeout: 10000 });
      expect(responses).toEqual(new Set(['insert-above']));
    }
  );

  test('should show chat history in chat panel', async ({ page, utils }) => {
    const { generateHeadings } = await utils.editor.askAIWithText(
      page,
      'AFFiNE is a workspace with fully merged docs'
    );
    const { answer } = await generateHeadings();
    await expect(answer).toHaveText(/AFFiNE/, { timeout: 10000 });
    const replace = answer.getByTestId('answer-replace');
    await replace.click();
    await utils.chatPanel.waitForHistory(page, [
      {
        role: 'action',
      },
    ]);
    const {
      answer: panelAnswer,
      prompt,
      actionName,
    } = await utils.chatPanel.getLatestAIActionMessage(page);
    await expect(panelAnswer).toHaveText(/AFFiNE/);
    await Promise.race([
      panelAnswer.locator('h1').isVisible(),
      panelAnswer.locator('h2').isVisible(),
      panelAnswer.locator('h3').isVisible(),
    ]);
    await expect(prompt).toHaveText(/Create headings of the follow text/);
    await expect(actionName).toHaveText(/Create headings/);
  });
});
