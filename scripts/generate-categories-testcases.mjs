/**
 * Generates Admin/test-cases/Categories_Test_Cases.xlsx
 * Format matches the Gulf TMT manual test-case sheet (TC_AP_##, Scenario, Description, etc.)
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import XLSX from 'xlsx';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, '../Admin/test-cases');
const outFile = path.join(outDir, 'Categories_Test_Cases.xlsx');

const scenario = 'Categories';

const testCases = [
  {
    id: 'TC_AP_678',
    description: 'Verify Categories page loads and displays the categories table',
    preconditions: 'User is logged in as Admin and navigates to the Categories module.',
    steps: [
      'Navigate to the Categories page from the sidebar.',
      'Observe the page title and table columns.',
      'Verify the categories list is populated from the API.',
    ],
    expected: 'Categories page loads with title "Categories". Table shows Name, Description, Created On, Updated On, Assigned Groups, and Actions columns with data.',
  },
  {
    id: 'TC_AP_679',
    description: 'Verify Create Category button opens the create category form',
    preconditions: 'User is on the Categories list page.',
    steps: [
      'Click the "Create Category" button.',
      'Observe the navigation and form fields.',
    ],
    expected: 'Create Category page opens with Category Name, Description, Assigned Groups fields, and Create/Cancel buttons.',
  },
  {
    id: 'TC_AP_680',
    description: 'Verify category can be created with valid name and description only',
    preconditions: 'User is on the Create Category page.',
    steps: [
      'Enter a valid category name (e.g. Sports).',
      'Enter a description (e.g. Sports related groups).',
      'Click the "Create" button.',
    ],
    expected: 'Category is created successfully and appears in the Categories list with the entered name and description.',
  },
  {
    id: 'TC_AP_681',
    description: 'Verify category can be created with assigned groups',
    preconditions: 'User is on the Create Category page and groups exist in the system (e.g. Cricket, Football).',
    steps: [
      'Enter category name (e.g. Sports).',
      'Enter description.',
      'Open Assigned Groups dropdown and search for a group (e.g. Cricket).',
      'Select the group checkbox and click Add.',
      'Repeat for another group (e.g. Football).',
      'Click the "Create" button.',
    ],
    expected: 'Category is created with assigned groups. Assigned Groups count in the list reflects the number of groups linked.',
  },
  {
    id: 'TC_AP_682',
    description: 'Verify Category Name field is required',
    preconditions: 'User is on the Create Category page.',
    steps: [
      'Leave Category Name empty.',
      'Optionally enter description.',
      'Click the "Create" button.',
    ],
    expected: 'Validation error is shown for Category Name and category is not created.',
  },
  {
    id: 'TC_AP_683',
    description: 'Verify Cancel discards category creation',
    preconditions: 'User is on the Create Category page with unsaved data entered.',
    steps: [
      'Enter category name and description.',
      'Click the "Cancel" button.',
    ],
    expected: 'User returns to Categories list and the unsaved category is not created.',
  },
  {
    id: 'TC_AP_684',
    description: 'Verify Back link returns to Categories list',
    preconditions: 'User is on the Create Category page.',
    steps: [
      'Click the "Back" link.',
    ],
    expected: 'User is navigated back to the Categories list page.',
  },
  {
    id: 'TC_AP_685',
    description: 'Verify Assigned Groups dropdown displays available groups',
    preconditions: 'User is on the Create Category page and groups exist in the system.',
    steps: [
      'Click the Assigned Groups dropdown.',
      'Search for an existing group name or code.',
    ],
    expected: 'Dropdown lists matching groups in "Code (Name)" format with selectable checkboxes.',
  },
  {
    id: 'TC_AP_686',
    description: 'Verify multiple groups can be assigned to one category',
    preconditions: 'User is on the Create Category page.',
    steps: [
      'Enter a valid category name.',
      'Assign at least two different groups using the dropdown and Add button.',
      'Click Create.',
    ],
    expected: 'Category is created with all selected groups assigned. Assigned Groups count shows the correct number.',
  },
  {
    id: 'TC_AP_687',
    description: 'Verify created category appears in the categories table',
    preconditions: 'A new category was just created.',
    steps: [
      'Navigate to or remain on the Categories list page.',
      'Locate the newly created category in the table.',
    ],
    expected: 'New category row is visible with correct name, description, and dates.',
  },
  {
    id: 'TC_AP_688',
    description: 'Verify Assigned Groups count is displayed in the list',
    preconditions: 'A category exists with known assigned groups.',
    steps: [
      'Open the Categories list.',
      'Find the category and check the Assigned Groups column.',
    ],
    expected: 'Assigned Groups column shows the correct count matching groups linked to the category.',
  },
  {
    id: 'TC_AP_689',
    description: 'Verify category search by name',
    preconditions: 'At least one category exists in the system.',
    steps: [
      'Enter an existing category name in the Search field.',
      'Press Enter or trigger search.',
    ],
    expected: 'Table filters to show only categories matching the search term.',
  },
  {
    id: 'TC_AP_690',
    description: 'Verify search with non-matching term shows no results',
    preconditions: 'User is on the Categories list page.',
    steps: [
      'Enter a random string that does not match any category name.',
      'Trigger search.',
    ],
    expected: 'No matching categories are displayed in the table.',
  },
  {
    id: 'TC_AP_691',
    description: 'Verify category name and description can be edited from the edit form',
    preconditions: 'A category exists in the list with no assigned groups.',
    steps: [
      'Click the Edit (pencil) icon for the category row.',
      'Verify the edit form shows Category Name, Assigned Groups, Description, Update, Cancel, and Back.',
      'Update the category name and description.',
      'Click the "Update" button.',
    ],
    expected:
      'Category is updated successfully. The Categories list shows the new name and description.',
  },
  {
    id: 'TC_AP_692',
    description: 'Verify assigned groups can be added on the edit category form',
    preconditions: 'A category with zero assigned groups exists and groups are available in the system.',
    steps: [
      'Click Edit for the category.',
      'Open Assigned Groups, search for a group, select it, and click Add.',
      'Click the "Update" button.',
    ],
    expected: 'Assigned groups are saved and the Assigned Groups count increases in the list.',
  },
  {
    id: 'TC_AP_693',
    description: 'Verify delete category shows confirmation modal with Yes and Cancel',
    preconditions: 'A deletable category (no assigned groups) exists in the list.',
    steps: [
      'Click the Delete (trash) icon for the category row.',
      'Observe the confirmation dialog.',
      'Click "Cancel".',
    ],
    expected:
      'Modal displays "Are you sure you want to delete this category?" with Yes and Cancel. Category remains after Cancel.',
  },
  {
    id: 'TC_AP_694',
    description: 'Verify category with no assigned groups can be deleted successfully',
    preconditions: 'A test category exists with zero assigned groups.',
    steps: [
      'Click Delete for the category.',
      'Click "Yes" on the confirmation modal.',
    ],
    expected: 'Category is deleted and no longer appears in the Categories list.',
  },
  {
    id: 'TC_AP_702',
    description: 'Verify delete is blocked when category has assigned groups',
    preconditions: 'A category with one or more assigned groups exists in the list.',
    steps: [
      'Click Delete for a category that has assigned groups.',
      'Read the warning message.',
      'Click "OK" to dismiss the modal.',
    ],
    expected:
      'Delete Group modal appears: "Category cannot be deleted while groups are assigned. Please remove all assigned groups first." Category is not deleted.',
  },
  {
    id: 'TC_AP_695',
    description: 'Verify pagination on categories list',
    preconditions: 'More categories exist than fit on one page.',
    steps: [
      'Navigate to Categories list.',
      'Use Next/Previous or page number controls.',
    ],
    expected: 'Pagination navigates between pages and displays correct item range.',
  },
  {
    id: 'TC_AP_696',
    description: 'Verify sort by Name ascending and descending',
    preconditions: 'Multiple categories exist in the list.',
    steps: [
      'Click Sort Ascending on the Name column.',
      'Observe the order.',
      'Click Sort Descending on the Name column.',
    ],
    expected: 'Categories are sorted alphabetically by name in ascending and descending order.',
  },
  {
    id: 'TC_AP_697',
    description: 'Verify sort by Created On column',
    preconditions: 'Multiple categories exist with different created dates.',
    steps: [
      'Sort by Created On ascending.',
      'Sort by Created On descending.',
    ],
    expected: 'Categories are ordered by Created On date correctly in both directions.',
  },
  {
    id: 'TC_AP_698',
    description: 'Verify sort by Updated On column',
    preconditions: 'Multiple categories exist with different updated dates.',
    steps: [
      'Sort by Updated On ascending.',
      'Sort by Updated On descending.',
    ],
    expected: 'Categories are ordered by Updated On date correctly in both directions.',
  },
  {
    id: 'TC_AP_699',
    description: 'Verify categories list data matches the category list API',
    preconditions: 'User is logged in and Categories API is accessible.',
    steps: [
      'Load the Categories page.',
      'Compare visible category names with GET /category?page=0&size=25&search=&sort=createdAt,desc response.',
    ],
    expected: 'UI list data is consistent with the category list API response.',
  },
  {
    id: 'TC_AP_700',
    description: 'Verify Description field is optional on create category',
    preconditions: 'User is on the Create Category page.',
    steps: [
      'Enter only a valid Category Name.',
      'Leave Description empty.',
      'Click Create.',
    ],
    expected: 'Category is created successfully without a description.',
  },
  {
    id: 'TC_AP_701',
    description: 'Verify category name trims leading and trailing spaces',
    preconditions: 'User is on the Create Category page.',
    steps: [
      'Enter a category name with leading and trailing spaces.',
      'Click Create.',
      'Check the saved name in the list.',
    ],
    expected: 'Category is saved with trimmed name (no leading/trailing spaces).',
  },
  // ── Negative test cases ─────────────────────────────────────────────────────
  {
    id: 'TC_AP_703',
    description: 'Negative - Verify duplicate category name is not allowed on create',
    preconditions: 'A category with a known name already exists in the system.',
    steps: [
      'Click Create Category.',
      'Enter the same category name as an existing category.',
      'Enter description and click Create.',
    ],
    expected: 'Category is not created. An error message indicates the name must be unique.',
  },
  {
    id: 'TC_AP_704',
    description: 'Negative - Verify category cannot be created with blank or whitespace-only name',
    preconditions: 'User is on the Create Category page.',
    steps: [
      'Enter only spaces in the Category Name field.',
      'Click Create.',
    ],
    expected: 'Validation error is shown and category is not created.',
  },
  {
    id: 'TC_AP_705',
    description: 'Negative - Verify category name rejects special characters on create',
    preconditions: 'User is on the Create Category page.',
    steps: [
      'Enter a category name containing special characters (e.g. Test@#$Category).',
      'Click Create.',
    ],
    expected: 'Validation error is shown and category is not created.',
  },
  {
    id: 'TC_AP_706',
    description: 'Negative - Verify category cannot be updated with an empty name',
    preconditions: 'An existing category is available for editing.',
    steps: [
      'Click Edit for the category.',
      'Clear the Category Name field completely.',
      'Click Update.',
    ],
    expected: 'Validation error is shown for Category Name and changes are not saved.',
  },
  {
    id: 'TC_AP_707',
    description: 'Negative - Verify duplicate category name is not allowed on edit',
    preconditions: 'Two distinct categories exist in the list (Category A and Category B).',
    steps: [
      'Click Edit for Category B.',
      'Change the name to match Category A exactly.',
      'Click Update.',
    ],
    expected: 'Update is rejected with a duplicate-name error. Category B retains its original name.',
  },
  {
    id: 'TC_AP_708',
    description: 'Negative - Verify delete is not performed when confirmation modal is cancelled',
    preconditions: 'A deletable category (zero assigned groups) exists.',
    steps: [
      'Click Delete for the category.',
      'On the confirmation modal, click Cancel.',
      'Search for the category in the list.',
    ],
    expected: 'Modal closes and the category still exists in the Categories list.',
  },
  {
    id: 'TC_AP_709',
    description: 'Negative - Verify search with only spaces does not break the list',
    preconditions: 'User is on the Categories list page with data loaded.',
    steps: [
      'Enter only spaces in the Search field.',
      'Press Enter or trigger search.',
    ],
    expected: 'No error occurs. List either shows all categories or treats input as empty search.',
  },
  {
    id: 'TC_AP_710',
    description: 'Edge - Verify closing Assigned Groups dropdown without Add does not assign groups',
    preconditions: 'User is on the Create Category page.',
    steps: [
      'Open Assigned Groups dropdown and search for a group.',
      'Select a checkbox but do not click Add, or close the dropdown without adding.',
      'Enter a valid category name and click Create.',
    ],
    expected: 'Category is created only with groups explicitly added via Add. Unconfirmed selections are not saved.',
  },
  // ── Edge test cases ───────────────────────────────────────────────────────
  {
    id: 'TC_AP_711',
    description: 'Edge - Verify Cancel on edit discards unsaved changes',
    preconditions: 'An existing category is open on the edit form.',
    steps: [
      'Change the category name and description.',
      'Click Cancel without clicking Update.',
      'Locate the original category in the list.',
    ],
    expected: 'User returns to the list. Original name and description are unchanged.',
  },
  {
    id: 'TC_AP_712',
    description: 'Edge - Verify Back link on edit returns to list without saving changes',
    preconditions: 'An existing category is open on the edit form.',
    steps: [
      'Modify the category name.',
      'Click the Back link.',
      'Verify the category in the list.',
    ],
    expected: 'User is navigated to Categories list. Unsaved edits are not applied.',
  },
  {
    id: 'TC_AP_713',
    description: 'Edge - Verify edit form is pre-populated with existing category data',
    preconditions: 'A category with name, description, and assigned groups exists.',
    steps: [
      'Click Edit for the category.',
      'Observe Category Name, Description, and Assigned Groups fields.',
    ],
    expected:
      'Form shows the current category name, description, and already-assigned group tags.',
  },
  {
    id: 'TC_AP_714',
    description: 'Edge - Verify assigned group can be removed from edit form using tag remove icon',
    preconditions: 'A category with at least one assigned group exists.',
    steps: [
      'Click Edit for the category.',
      'Click the remove (x) icon on an assigned group tag.',
      'Click Update.',
    ],
    expected: 'Group is removed from the category. Assigned Groups count decreases in the list.',
  },
  {
    id: 'TC_AP_715',
    description: 'Edge - Verify category name with maximum allowed length',
    preconditions: 'User is on the Create Category page.',
    steps: [
      'Enter a category name at the maximum permitted character length.',
      'Click Create.',
    ],
    expected: 'Category is created successfully when name is within the allowed limit.',
  },
  {
    id: 'TC_AP_716',
    description: 'Edge - Verify category name exceeding maximum length is rejected',
    preconditions: 'User is on the Create Category page.',
    steps: [
      'Enter a category name longer than the maximum permitted length.',
      'Click Create.',
    ],
    expected: 'Validation error is shown or input is truncated. Category is not saved with invalid length.',
  },
  {
    id: 'TC_AP_717',
    description: 'Edge - Verify very long description is accepted or validated on create',
    preconditions: 'User is on the Create Category page.',
    steps: [
      'Enter a valid category name.',
      'Paste a very long description (multi-paragraph text).',
      'Click Create.',
    ],
    expected: 'System either accepts the description within limits or shows a validation message.',
  },
  {
    id: 'TC_AP_718',
    description: 'Edge - Verify Assigned Groups search with no matching group shows empty state',
    preconditions: 'User is on Create or Edit Category form.',
    steps: [
      'Open Assigned Groups dropdown.',
      'Search for a random string that matches no group.',
    ],
    expected: 'Dropdown shows no matching groups or an empty-state message.',
  },
  {
    id: 'TC_AP_719',
    description: 'Edge - Verify pagination controls are disabled on a single-page list',
    preconditions: 'Total categories fit on one page (e.g. fewer than page size).',
    steps: [
      'Open the Categories list.',
      'Observe Previous, Next, and page number controls.',
    ],
    expected: 'Pagination shows "1-N of N items". Previous and Next controls are disabled.',
  },
  {
    id: 'TC_AP_720',
    description: 'Edge - Verify rapid double-click on Create does not create duplicate categories',
    preconditions: 'User is on the Create Category page with valid data entered.',
    steps: [
      'Enter a unique category name and description.',
      'Double-click the Create button quickly.',
      'Search for the category name.',
    ],
    expected: 'Only one category with that name is created.',
  },
  {
    id: 'TC_AP_721',
    description: 'Edge - Verify rapid double-click on Update does not cause duplicate updates or errors',
    preconditions: 'User is on the edit form for an existing category.',
    steps: [
      'Change the description.',
      'Double-click the Update button quickly.',
    ],
    expected: 'Category is updated once without duplicate API errors or inconsistent list data.',
  },
  {
    id: 'TC_AP_722',
    description: 'Edge - Verify delete blocked modal dismisses with OK and category remains',
    preconditions: 'A category with assigned groups exists.',
    steps: [
      'Click Delete for the category.',
      'On the blocked-delete modal, click OK.',
      'Verify the category is still in the list.',
    ],
    expected:
      'Modal closes. Category is not deleted and Assigned Groups count is unchanged.',
  },
];

const header = ['-', 'Test Scenario', 'Test Case Description', 'Preconditions', 'Test Steps', 'Expected Output', 'Actual Result'];

const rows = testCases.map((tc) => [
  tc.id,
  scenario,
  tc.description,
  tc.preconditions,
  tc.steps.map((s) => `• ${s}`).join('\n'),
  tc.expected,
  '',
]);

const sheetData = [header, ...rows];
const workbook = XLSX.utils.book_new();
const worksheet = XLSX.utils.aoa_to_sheet(sheetData);

worksheet['!cols'] = [
  { wch: 12 },
  { wch: 14 },
  { wch: 48 },
  { wch: 40 },
  { wch: 55 },
  { wch: 55 },
  { wch: 30 },
];

XLSX.utils.book_append_sheet(workbook, worksheet, 'Categories');
fs.mkdirSync(outDir, { recursive: true });
XLSX.writeFile(workbook, outFile);

console.log(`Written ${testCases.length} test cases to ${outFile}`);
