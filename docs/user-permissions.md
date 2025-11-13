# User Permissions Documentation

## Overview

The RDS App implements a role-based access control (RBAC) system with attribute-based conditions using [CASL (Capability-based Access Control Library)](https://casl.js.org/). This document describes the user roles, their permissions, and the conditions that govern access to resources.

## User Roles

The application defines four hierarchical user roles:

1. **Volunteer** - Field workers who conduct surveys
2. **Manager** - Supervisors who oversee volunteers at specific locations
3. **Admin** - Administrators with broad system access
4. **Super Admin** - System administrators with unrestricted access

## User Lifecycle

### Approval Status

All users (except Super Admins) go through an approval process:

- **PENDING** - Initial status when a user account is created
- **APPROVED** - User has been approved and can access the system
- **REJECTED** - User account has been rejected

Only users with `APPROVED` status can authenticate and access protected routes.

### User Creation and Approval

- **Volunteers**: Can be created and approved by Managers (at the same location), Admins, or Super Admins
- **Managers**: Can be created and approved by Admins or Super Admins
- **Admins**: Can be created and approved by Admins or Super Admins
- **Super Admins**: Can only be created by other Super Admins

## Resources (Subjects)

The system currently implements access control for the following resources:

- **User** - User accounts and profiles
- **Survey** - Survey data collected in the field

### Future Resources

The following resources are defined in the system but do not yet have role-based permissions implemented:

- **Seed** - Initial survey seeds for starting referral chains (permissions planned but not yet implemented)
- **Location** - Geographic locations where surveys are conducted (permissions planned but not yet implemented)

These resources are managed by Super Admins until specific role-based permissions are implemented.

## Actions

### Standard CRUD Actions

- **create** - Create new resources
- **read** - View existing resources
- **update** - Modify existing resources
- **delete** - Remove resources (generally restricted)
- **manage** - Special action that includes all other actions

### Custom Actions

- **createWithoutReferral** - Create a survey without a parent referral code (seed surveys)

## Permission Conditions

Permissions can be restricted by the following conditions:

- **IS_SELF** - User is accessing their own account
- **IS_CREATED_BY_SELF** - Resource was created by the current user
- **HAS_SAME_LOCATION** - Resource belongs to the user's assigned location
- **WAS_CREATED_TODAY** - Resource was created today (UTC timezone)
- **HAS_VOLUNTEER_ROLE** - Target user has the Volunteer role
- **HAS_MANAGER_ROLE** - Target user has the Manager role
- **HAS_ADMIN_ROLE** - Target user has the Admin role

## Detailed Role Permissions

### Volunteer

Volunteers have the most restricted access, limited to their own data and surveys they create.

#### User Permissions

| Action | Subject | Conditions | Description |
|--------|---------|------------|-------------|
| read | User | IS_SELF | Can view their own profile only |
| update | User (profile fields only) | IS_SELF | Can update their own profile information (firstName, lastName, email, phone) |

#### Survey Permissions

| Action | Subject | Conditions | Description |
|--------|---------|------------|-------------|
| create | Survey | None | Can create new surveys |
| createWithoutReferral | Survey | None | Can create seed surveys without a referral code |
| read | Survey | IS_CREATED_BY_SELF, HAS_SAME_LOCATION, WAS_CREATED_TODAY | Can only view surveys they created today at their assigned location |
| update | Survey | IS_CREATED_BY_SELF, HAS_SAME_LOCATION, WAS_CREATED_TODAY | Can only edit surveys they created today at their assigned location |

**Restrictions:**
- Cannot delete any surveys
- Cannot view or modify other users' data
- Cannot approve users
- Cannot change their own role or location

### Manager

Managers supervise volunteers at a specific location and have additional permissions for user management within their location.

#### User Permissions

| Action | Subject | Conditions | Description |
|--------|---------|------------|-------------|
| read | User | None | Can view all user profiles |
| create | User | HAS_VOLUNTEER_ROLE, HAS_SAME_LOCATION | Can create volunteer accounts at their assigned location (no time restriction) |
| update | User (approval fields) | HAS_VOLUNTEER_ROLE, HAS_SAME_LOCATION, WAS_CREATED_TODAY | Can approve volunteers at their location who were created today |
| update | User (profile fields only) | IS_SELF | Can update their own profile information |

#### Survey Permissions

| Action | Subject | Conditions | Description |
|--------|---------|------------|-------------|
| create | Survey | None | Can create new surveys |
| createWithoutReferral | Survey | None | Can create seed surveys without a referral code |
| read | Survey | IS_CREATED_BY_SELF, HAS_SAME_LOCATION, WAS_CREATED_TODAY | Can view surveys they created today at their assigned location |
| update | Survey | IS_CREATED_BY_SELF, HAS_SAME_LOCATION, WAS_CREATED_TODAY | Can edit surveys they created today at their assigned location |

**Restrictions:**
- Cannot delete any surveys or users
- Cannot approve Managers or Admins
- Cannot change user roles or locations
- Cannot access surveys from other locations or previous days

### Admin

Admins have broad system access and can manage users and surveys across all locations.

#### User Permissions

| Action | Subject | Conditions | Description |
|--------|---------|------------|-------------|
| read | User | None | Can view all user profiles |
| create | User | HAS_VOLUNTEER_ROLE, HAS_MANAGER_ROLE, or HAS_ADMIN_ROLE | Can create Volunteer, Manager, and Admin accounts |
| update | User (approval fields) | HAS_VOLUNTEER_ROLE, HAS_MANAGER_ROLE, or HAS_ADMIN_ROLE | Can approve Volunteers, Managers, and Admins |
| update | User (role and location fields) | HAS_VOLUNTEER_ROLE or HAS_MANAGER_ROLE | Can change roles and locations for Volunteers and Managers |
| update | User (profile and location fields) | IS_SELF | Can update their own profile and location |

#### Survey Permissions

| Action | Subject | Conditions | Description |
|--------|---------|------------|-------------|
| create | Survey | None | Can create new surveys |
| createWithoutReferral | Survey | None | Can create seed surveys without a referral code |
| read | Survey | None | Can view all surveys |
| update | Survey | WAS_CREATED_TODAY | Can edit any survey created today |

**Restrictions:**
- Cannot delete any surveys or users
- Cannot create or approve Super Admin accounts
- Cannot modify Super Admin accounts

### Super Admin

Super Admins have unrestricted access to all system resources and actions.

#### Permissions

| Action | Subject | Conditions | Description |
|--------|---------|------------|-------------|
| manage | all | None | Full access to all resources and actions |

**Capabilities:**
- Create, read, update, and delete any resource
- Manage all user roles including other Super Admins
- No restrictions on surveys, locations, or any other resources
- Full system administration capabilities

## Field-Level Permissions

Certain actions are restricted to specific fields within resources:

### User Fields

- **Profile fields**: `firstName`, `lastName`, `email`, `phone`
- **Role field**: `role`
- **Approval fields**: `approvalStatus`, `approvedByUserObjectId`
- **Location field**: `locationObjectId`

Different roles have different permissions on these field groups as described in the role-specific sections above.

## Custom Permissions

In addition to role-based permissions, individual users can be assigned custom permissions that override or supplement their default role permissions. Custom permissions are stored in the user's `permissions` array and consist of:

- **action** - The action being granted (e.g., `read`, `update`)
- **subject** - The resource type (e.g., `Survey`, `User`)
- **conditions** - Array of conditions that must be met (e.g., `IS_SELF`, `HAS_SAME_LOCATION`)

Custom permissions are evaluated after role-based permissions and can be used to grant additional access on a case-by-case basis.

## Location-Based Access Control

Many permissions are scoped to a user's assigned location (`locationObjectId`). This ensures:

- Managers only supervise volunteers at their location
- Volunteers only access surveys from their location
- Data is compartmentalized by geographic area

The user's location is determined by their most recent survey's location, not their profile location field.

## Time-Based Access Control

Survey access is often restricted to the current day (UTC timezone). This means:

- Users can only view and edit surveys created today
- Historical surveys become read-only after the day they were created
- This prevents accidental modification of completed survey data

## Security Considerations

### Authentication Requirements

- All users must have `APPROVED` status to access protected routes
- JWT tokens are used for authentication
- Tokens are verified on every request

### Data Protection

- Users cannot delete surveys to maintain data integrity
- Survey modifications are time-limited to prevent tampering
- Location-based restrictions prevent unauthorized cross-location access
- Field-level permissions prevent unauthorized role or approval changes

### Audit Trail

- All resources include `createdAt` and `updatedAt` timestamps
- Survey records include `createdByUserObjectId` for accountability
- User approvals track `approvedByUserObjectId`

## Permission Evaluation Flow

1. **Authentication**: Verify JWT token and check approval status
2. **Role-Based Permissions**: Apply default permissions based on user role
3. **Custom Permissions**: Apply any user-specific permission overrides
4. **Condition Evaluation**: Check if all required conditions are met
5. **Action Authorization**: Allow or deny the requested action

## Examples

### Example 1: Volunteer Creating a Survey

A volunteer wants to create a new survey:
- **Action**: `create`
- **Subject**: `Survey`
- **Conditions**: None
- **Result**: ✅ Allowed - Volunteers can create surveys

### Example 2: Volunteer Viewing Another User's Survey

A volunteer wants to view a survey created by another volunteer:
- **Action**: `read`
- **Subject**: `Survey`
- **Conditions Required**: `IS_CREATED_BY_SELF`, `HAS_SAME_LOCATION`, `WAS_CREATED_TODAY`
- **Condition Check**: `IS_CREATED_BY_SELF` fails
- **Result**: ❌ Denied - Survey was not created by this volunteer

### Example 3: Manager Approving a Volunteer

A manager wants to approve a volunteer at their location who registered today:
- **Action**: `update` (approval fields)
- **Subject**: `User`
- **Conditions Required**: `HAS_VOLUNTEER_ROLE`, `HAS_SAME_LOCATION`, `WAS_CREATED_TODAY`
- **Condition Check**: All conditions pass
- **Result**: ✅ Allowed - Manager can approve this volunteer

### Example 4: Admin Changing a Manager's Location

An admin wants to change a manager's assigned location:
- **Action**: `update` (location field)
- **Subject**: `User`
- **Conditions Required**: `HAS_VOLUNTEER_ROLE` or `HAS_MANAGER_ROLE`
- **Condition Check**: `HAS_MANAGER_ROLE` passes
- **Result**: ✅ Allowed - Admins can change manager locations

## Technical Implementation

The permission system is implemented using:

- **CASL Library**: Provides the core authorization framework
- **MongoDB Query Conditions**: Permissions are translated to MongoDB queries for efficient filtering
- **Middleware**: Authentication middleware injects user abilities into requests
- **Ability Builder**: Constructs permission sets based on roles and custom permissions

For implementation details, see:
- `server/src/permissions/constants.ts` - Permission definitions
- `server/src/permissions/abilityBuilder.ts` - Permission assignment logic
- `server/src/middleware/auth.ts` - Authentication and authorization middleware

## Future Development

### Planned Permission Enhancements

The following permission features are planned for future implementation:

#### Seed Permissions

Seed resources will have role-specific CRUD permissions to manage initial survey seeds for referral chains. Planned permissions include:

- **Super Admin & Admin**: Full CRUD access to seeds
- **Manager**: Create, read, update, and delete seeds at their assigned location
- **Volunteer**: Read-only access to seeds at their location

#### Location Permissions

Location resources will have permissions to manage geographic locations where surveys are conducted:

- **Super Admin & Admin**: Full CRUD access to all locations
- **Manager**: Read access to all locations, update access to their assigned location
- **Volunteer**: Read-only access to their assigned location

These permissions are documented in the project's [permissions planning spreadsheet](https://docs.google.com/spreadsheets/d/134uRSlIAUwz1lsuSYB7IsAdIvexrOUfc5pgB6303GVY/edit) and will be implemented in future releases.

## Related Documentation

- [CASL Documentation](https://casl.js.org/v6/en/guide/intro)
- [CONTRIBUTING.md](../CONTRIBUTING.md) - Development guidelines
- [README.md](../README.md) - Project overview
- [Permissions Planning Spreadsheet](https://docs.google.com/spreadsheets/d/134uRSlIAUwz1lsuSYB7IsAdIvexrOUfc5pgB6303GVY/edit) - Detailed permission specifications
