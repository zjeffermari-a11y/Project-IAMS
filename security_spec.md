# Security Specification: IAMS

## 1. Data Invariants
- A user document can only be created with the matching uid. Users cannot modify their own role.
- Engagements can only be created by Directors or Division Chiefs.
- Access to an engagement's subcollections (AWP, MOVs, members) is strictly governed by whether the user is a member of that engagement (via `engagements/{engagementId}/members/{userId}`) AND their assigned role, OR the user's global role is Director/Division Chief.
- AWP Sign-offs are append-only.
- Audit Work Program rows can be added by Auditors, but Auditees have read-only access to AWP.
- MOV Documents can be created/modified by Auditors, but Auditees can ONLY modify `auditeeResponse1`, `auditeeResponse2`, `auditeeResponse3`.

## 2. The "Dirty Dozen" Payloads
1. User creates own profile and sets role to "Director"
2. Non-Director creates an Engagement
3. Non-member Auditor tries to read Engagement MOVs
4. Auditee tries to update AWP Row procedure text
5. Auditee tries to modify auditorLink in MOV Document
6. Auditor creates MOV but sets wrong document name
7. Member tries to add array of random fields to Engagement
8. Auditor modifies signoffs of another user
9. Member updates existing AWP row to an invalid status
10. Unauthenticated user tries to list all Engagements
11. Auditee tries to change MOV status field bypassing auditeeResponse constraints
12. Member deletes an Engagement

## 3. Test Runner
We will construct a firestore.rules.test.ts to verify these constraints.
