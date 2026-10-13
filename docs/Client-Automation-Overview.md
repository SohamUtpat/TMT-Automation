# Gulf TMT Admin Portal
## Automated Testing Suite – Overview Document

**Project:** TMT-Automation  
**Application under test:** Gulf TMT Admin Portal  
**Automation tool:** Playwright (Desktop Chrome)  
**Document purpose:** Explain how the automation suite works and what it covers, for stakeholders and clients.

---

## 1. Executive Summary

TMT-Automation is an **end-to-end (E2E) UI automation suite** for the Gulf TMT Admin Portal.

It opens a real browser, logs in as an Admin user, and automatically verifies that critical business workflows work correctly—such as login, user management, groups, categories, forms, settings, and language change.

**Business value:** Faster, repeatable quality checks before release, with clear pass/fail evidence.

---

## 2. How the Automation Works

| Step | What happens |
|------|----------------|
| 1. Login | Suite logs in once as Admin and saves the session |
| 2. Open module | Navigates to the feature under test (e.g. Groups, Categories) |
| 3. Perform actions | Mimics real user actions (create, edit, search, delete, validate) |
| 4. Verify result | Confirms expected outcome on screen |
| 5. Report | Generates pass/fail results; captures screenshot/video on failure |

**Simple flow:**

```text
Start → Admin Login → Open Module → Perform Action → Verify Result → Pass / Fail Report
```

Tests can run against:

- **Local environment** – for development and debugging
- **Dev / shared environment** – for team validation

---

## 3. Modules Covered

| Module | Coverage focus |
|--------|----------------|
| Login | Valid/invalid login, empty fields, access rules |
| Dashboard | Post-login landing experience |
| Groups | Create, edit, delete, search, sort, members |
| Categories | Create, edit, delete, assign groups |
| Mobile Users | User creation, roles, groups, validations |
| Admin Users | Admin account management and validations |
| Forms / Form Builder | Form listing, building, submissions |
| Settings | Portal configuration |
| Change Password | Password update flow |
| Change Language | Language selection and UI language switch |

Each automated scenario is linked to a test case ID (example: `TC_AP_65`) for traceability to the test catalogue / requirements.

---

## 4. Types of Test Cases

### 4.1 Functional / Happy-path tests

Confirm core business actions succeed with valid data.

**Examples**

- Admin can log in successfully
- Create group / category / user
- Edit and save changes
- Delete when allowed

**Client benefit:** Confidence that daily operations work.

---

### 4.2 Validation / Negative tests

Confirm the system rejects invalid data and shows proper errors.

**Examples**

- Empty username or password
- Duplicate names
- Special characters where not allowed
- Field length beyond maximum
- Invalid profile photo format

**Client benefit:** Better data quality and fewer support issues.

---

### 4.3 Edge / Boundary tests

Confirm behaviour in uncommon but realistic situations.

**Examples**

- Minimum and maximum character limits
- Cancel without saving
- Delete blocked when related records exist
- Search with no matching results
- Leading/trailing spaces trimmed correctly

**Client benefit:** Fewer surprises in production.

---

### 4.4 UI / Usability checks

Confirm screens display and behave correctly.

**Examples**

- Labels and placeholders present
- Language options displayed
- Correct navigation after Back / Cancel
- Password show/hide control works

**Client benefit:** Consistent user experience.

---

### 4.5 Access / Security-related checks

Confirm only authorised actions are allowed.

**Examples**

- Mobile users cannot access Admin login
- Delete blocked when dependencies exist
- Protected records (e.g. HQ group) cannot be removed incorrectly

**Client benefit:** Reduced operational and security risk.

---

## 5. How the Suite Is Structured

The suite is organised for maintainability and clarity:

| Layer | Purpose |
|-------|---------|
| Test scripts | Define scenarios (what to do and what to assert) |
| Page helpers | Reusable user actions (open form, search, save, delete) |
| Test data | Sample inputs, expected messages, labels |
| Setup / fixtures | Login once and prepare each module before tests |

This design keeps tests stable, readable, and easier to extend as new features are added.

---

## 6. Reporting & Evidence

When tests run, the suite provides:

- Pass / fail status per test case
- HTML report for review
- Screenshot on failure
- Video on failure (for debugging)

This gives stakeholders clear evidence of what was verified and what failed.

---

## 7. Benefits for the Client

- Repeatable regression checks before each release
- Coverage of critical Admin Portal workflows
- Early detection of broken create / edit / delete / search flows
- Clear audit trail via test IDs (`TC_AP_xxx`)
- Reduced manual testing effort for repetitive scenarios
- Faster feedback to development and QA teams

---

## 8. One-Line Summary

> **TMT-Automation is an automated browser testing suite that continuously validates the Gulf TMT Admin Portal’s key features—login, users, groups, categories, forms, settings, and language—so defects are found early and releases are more reliable.**

---

## 9. Document Control

| Field | Value |
|-------|--------|
| Prepared for | Gulf TMT stakeholders |
| Prepared by | QA / Automation team |
| Suite name | TMT-Automation |
| Tool | Playwright |
| Browser | Chromium (Desktop Chrome) |
| Location | `TMT-Automation/docs/Client-Automation-Overview.md` |
| Version / date | 1.0 – 30 Jul 2026 |
