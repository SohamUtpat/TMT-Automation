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
    id: 'TC_AP_292',
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
    id: 'TC_AP_293',
    description: 'Verify Create Category button opens the create category form',
    preconditions: 'User is on the Categories list page.',
    steps: [
      'Click the "Create Category" button.',
      'Observe the navigation and form fields.',
    ],
    expected: 'Create Category page opens with Category Name, Description, Assigned Groups fields, and Create/Cancel buttons.',
  },
  {
    id: 'TC_AP_294',
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
    id: 'TC_AP_295',
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
    id: 'TC_AP_296',
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
    id: 'TC_AP_297',
    description: 'Verify Cancel discards category creation',
    preconditions: 'User is on the Create Category page with unsaved data entered.',
    steps: [
      'Enter category name and description.',
      'Click the "Cancel" button.',
    ],
    expected: 'User returns to Categories list and the unsaved category is not created.',
  },
  {
    id: 'TC_AP_298',
    description: 'Verify Back link returns to Categories list',
    preconditions: 'User is on the Create Category page.',
    steps: [
      'Click the "Back" link.',
    ],
    expected: 'User is navigated back to the Categories list page.',
  },
  {
    id: 'TC_AP_299',
    description: 'Verify Assigned Groups dropdown displays available groups',
    preconditions: 'User is on the Create Category page and groups exist in the system.',
    steps: [
      'Click the Assigned Groups dropdown.',
      'Search for an existing group name or code.',
    ],
    expected: 'Dropdown lists matching groups in "Code (Name)" format with selectable checkboxes.',
  },
  {
    id: 'TC_AP_300',
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
    id: 'TC_AP_301',
    description: 'Verify created category appears in the categories table',
    preconditions: 'A new category was just created.',
    steps: [
      'Navigate to or remain on the Categories list page.',
      'Locate the newly created category in the table.',
    ],
    expected: 'New category row is visible with correct name, description, and dates.',
  },
  {
    id: 'TC_AP_302',
    description: 'Verify Assigned Groups count is displayed in the list',
    preconditions: 'A category exists with known assigned groups.',
    steps: [
      'Open the Categories list.',
      'Find the category and check the Assigned Groups column.',
    ],
    expected: 'Assigned Groups column shows the correct count matching groups linked to the category.',
  },
  {
    id: 'TC_AP_303',
    description: 'Verify category search by name',
    preconditions: 'At least one category exists in the system.',
    steps: [
      'Enter an existing category name in the Search field.',
      'Press Enter or trigger search.',
    ],
    expected: 'Table filters to show only categories matching the search term.',
  },
  {
    id: 'TC_AP_304',
    description: 'Verify search with non-matching term shows no results',
    preconditions: 'User is on the Categories list page.',
    steps: [
      'Enter a random string that does not match any category name.',
      'Trigger search.',
    ],
    expected: 'No matching categories are displayed in the table.',
  },
  {
    id: 'TC_AP_305',
    description: 'Verify category can be edited',
    preconditions: 'An existing category is available in the list.',
    steps: [
      'Click the Edit icon for a category.',
      'Update the category name and/or description.',
      'Save the changes.',
    ],
    expected: 'Category is updated successfully and the list reflects the new values.',
  },
  {
    id: 'TC_AP_306',
    description: 'Verify assigned groups can be updated on edit category',
    preconditions: 'An existing category is available for editing.',
    steps: [
      'Open Edit for a category.',
      'Add or remove assigned groups.',
      'Save the changes.',
    ],
    expected: 'Assigned groups are updated and Assigned Groups count changes accordingly.',
  },
  {
    id: 'TC_AP_307',
    description: 'Verify delete category shows confirmation modal',
    preconditions: 'An existing category is available in the list.',
    steps: [
      'Click the Delete icon for a category.',
    ],
    expected: 'A confirmation dialog appears asking to confirm category deletion.',
  },
  {
    id: 'TC_AP_308',
    description: 'Verify category can be deleted successfully',
    preconditions: 'A deletable test category exists with no blocking dependencies.',
    steps: [
      'Click Delete for the test category.',
      'Confirm deletion in the modal.',
    ],
    expected: 'Category is deleted and no longer appears in the Categories list.',
  },
  {
    id: 'TC_AP_309',
    description: 'Verify pagination on categories list',
    preconditions: 'More categories exist than fit on one page.',
    steps: [
      'Navigate to Categories list.',
      'Use Next/Previous or page number controls.',
    ],
    expected: 'Pagination navigates between pages and displays correct item range.',
  },
  {
    id: 'TC_AP_310',
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
    id: 'TC_AP_311',
    description: 'Verify sort by Created On column',
    preconditions: 'Multiple categories exist with different created dates.',
    steps: [
      'Sort by Created On ascending.',
      'Sort by Created On descending.',
    ],
    expected: 'Categories are ordered by Created On date correctly in both directions.',
  },
  {
    id: 'TC_AP_312',
    description: 'Verify sort by Updated On column',
    preconditions: 'Multiple categories exist with different updated dates.',
    steps: [
      'Sort by Updated On ascending.',
      'Sort by Updated On descending.',
    ],
    expected: 'Categories are ordered by Updated On date correctly in both directions.',
  },
  {
    id: 'TC_AP_313',
    description: 'Verify categories list data matches the category list API',
    preconditions: 'User is logged in and Categories API is accessible.',
    steps: [
      'Load the Categories page.',
      'Compare visible category names with GET /category?page=0&size=25&search=&sort=createdAt,desc response.',
    ],
    expected: 'UI list data is consistent with the category list API response.',
  },
  {
    id: 'TC_AP_314',
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
    id: 'TC_AP_315',
    description: 'Verify category name trims leading and trailing spaces',
    preconditions: 'User is on the Create Category page.',
    steps: [
      'Enter a category name with leading and trailing spaces.',
      'Click Create.',
      'Check the saved name in the list.',
    ],
    expected: 'Category is saved with trimmed name (no leading/trailing spaces).',
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
