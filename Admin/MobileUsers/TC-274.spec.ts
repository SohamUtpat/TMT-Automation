import { test } from '../fixtures/mobile-users.fixture';

/**
 * Recommended bulk-upload order: 1 — rules baseline before file operations.
 */
test('TC_AP_274 - Verify Bulk Upload Rules Are Given As Expected', async ({ mobileUsersPage }) => {
  await test.step('Open bulk upload page', async () => {
    await mobileUsersPage.openBulkUploadFromListing();
  });

  await test.step('Verify rules section and documented upload rules are visible', async () => {
    await mobileUsersPage.expectBulkUploadRulesVisible();
    await mobileUsersPage.expectBulkUploadRuleVisible(
      'Please follow below rules while uploading the document',
    );
  });
});
