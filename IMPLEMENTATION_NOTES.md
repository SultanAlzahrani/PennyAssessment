# Implementation Notes

> Fill this in as part of your submission. 1–2 pages, bullet points are fine. Delete these
> instructions before submitting.

## 1. What I changed

<!-- Grouped by task: bugs fixed and features implemented (component + template). -->

- Fixed the diff calculation so quantity and price changes are correctly classified as `changed`.
- Updated approval/rejection permission logic to respect the CR status and the current user's approval authority.
- Implemented status filtering for the Change Request list.
- Updated the approval timeline to display entries chronologically.
- Added tests for diff changes, permissions, timeline ordering, and status filtering.

## 2. Component & state model

<!-- The screens, the view-state each component exposes, and how data flows from the mock API into the
template. -->

- The Change Request list displays loading, loaded, empty, and error states and exposes `visibleRows` based on the selected status filter.
- The Change Request detail displays the CR information, proposed changes, totals, approval timeline, and available actions.
- Data is loaded through the mock API and stored in the component state. The templates render the appropriate UI based on the current state.
- Derived values such as the diff, timeline, and filtered rows are calculated from the loaded state rather than modifying the source data.

## 3. Invariants I keep

<!-- Which properties the UI guarantees, and where in the component/template each is enforced. -->

| Invariant | How / where |
| --------- | ----------- |

## 4. Testing strategy

<!-- What you tested (component/DOM vs pure) and why; what you deliberately skipped given the budget. -->

-

## 5. Assumptions

<!-- Where the requirements left room for interpretation, the calls you made and why. -->

Task 1 - Assumptions:

- diff calculations are based on unitPrice and quantity only
- Read-only cannot approve, & cannot reject (this may not be expliceitly stated in the tasks given, but I implemented it.)
- Approve/Reject as the same approval authority in terms of policies given the table.

Task 4 - Assumptions:

- Loading, loaded, error states already implemented and working
- For testing, i introduced fake timeouts and it loading screen is already working. Also introducing a fake error seems to make the error message to appear to let the user know that if falied to load the CR.
- from task 1, readonly users cannot intract with the approve/reject operations but can view data safely

## 6. Where I used AI

- help with automatic commit messages (I always make sure it's comprehensive)
- research and general explanations about Angular's compontent (no code generation)
- review some of the test cases i wrote

## 7. What I'd improve with more time

I focused only/mainly on the files and tasks I were asked to fix/add to, but if I had given more time / open tasks, I would improve the following

- More validation craiteria (min & max length of rejection message)
- Clean the UI and make it responsive
- Make the transition between the users (approver, viewer, otherOrg) smooth, and load the respective CR automatically
- Add more DOM tests
