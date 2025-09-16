# API Documentation 

## Introduction 



## Survey Endpoints

### `POST 'api/surveys/save'`

**Description:** Saves a survey to a database. This saves an instance of the database exactly as given in the body of the request. The responses object does not have to contain a full survey, and this endpoint can be used for either submitting "completed" surveys are "in progress" surveys. If no object id is provided
obe ht ni

**Example Request:** 

*URL:* /api/surveys/save

*Headers:* 
```typescript
{
  "Authorization": `Bearer ${token}`
}
```

*Body:*
```typescript
{
  "responses": {
    "location": "Bellevue Library", 
    "interpreter": "No",
    "consent_give": "Yes"
  },
  "referredByCode:" : "7Z34G96G", 
  "coords" : {0, 0}, 
  "objectId" "68c0c83d2217fd19876a549d"
  "inProgress": true
}
```

**Example Response:**
```json
{
  "message": "Survey saved successfully!",
  "objectId": "68c0c83d2217fd19876a549d",
  "referralCodes": ["L4DNMDWK", "GVPZDXSQ", "O1E9EB4G"]
}
```

**Error Handling:**

- `400` "Missing required fields"
  - This means that there were missing parameters. The required parameter for this endpoint is "responses".


- `500` "Server error: Could not save survey"
  - This error occurs when there is an error in the server. 

### `GET 'api/surveys/validate-ref/:code'`

**Description:** Describe endpoint 

**Example Request:** /review/BonesUk

**Headers:** 

```typescript
{
  "emp-name" : "Kristen",
  "emp-id" : "EMP1234",
  "Authorization": `Bearer ${token}`
}
```

**Example Response:**
```json
{
  
}
```

**Error Handling:**
Write error handling

### `GET 'api/surveys/all'`

**Description:** Describe endpoint 

**Example Request:** /review/BonesUk

**Headers:** 

```typescript
{
  "Authorization": `Bearer ${token}`
}
```

**Example Response:**
```json
{
  
}
```

**Error Handling:**
Write error handling

### `GET 'api/surveys/:id'`

**Description:** Describe endpoint 

**Example Request:** /review/BonesUk

**Headers:** 

```typescript
{
  "emp-name" : "Kristen",
  "emp-id" : "EMP1234",
  "Authorization": `Bearer ${token}`
}
```

**Example Response:**
```json
{
  
}
```

**Error Handling:**
Write error handling

### `GET 'api/surveys/all'`

**Description:** Describe endpoint 

**Example Request:** 

*URL:*

*Headers:* 
```typescript
{
  "Authorization": `Bearer ${token}`
}
```

*Body:*

```typescript
{
  "Authorization": `Bearer ${token}`
}
```

**Example Response:**
```json
{
  
}
```

**Error Handling:**
Write error handling

## Auth Endpoints

### `POST 'api/auth/send-otp-signup'`

**Description:** Sends otp to given phone number for first step in process to create a new user on signup. Requires `phone` and `email` field in body. Does not require auth token.

**Required Permissions:** None

**Example Request:** 

*URL:* 'api/auth/send-otp-signup'

*Headers:* None

*Body:*

```typescript
{
  "phone": `16062134521`
  "email": `rdsapp@uw.edu`
}
```

**Example Response:**
```json
{
  "message": "OTP sent!"
}
```

**Error Handling:**

- `400` "Bad Request. Missing required fields"
  - This means that there were missing parameters. The required parameters for this endpoint are `phone` and `email`.

- `400` "User already exists – please log in."
  - This means that the user already exist in the database. The user should instead log in.

- `500` "Failed to send OTP"
  - This error occurs when there is an error in the server.

### `POST 'api/auth/send-otp-login'`

**Description:** Sends otp to given phone number to for first step in process to log in. Requires `phone` and `email` field in body. Does not require auth token.

**Example Request:** 

*URL:* 'api/auth/send-otp-login'

*Headers:* None

*Body:*

```typescript
{
  "phone": `16062134521`
  "email": `rdsapp@uw.edu`
}
```

**Example Response:**
```json
{
  
}
```

**Error Handling:**

- `400` "Bad Request. Missing required fields"
  - This means that there were missing parameters. The required parameters for this endpoint are `phone` and `email`.

- `404` "User not found."
  - This means that the user was not found. Suggesting bad inputs or the user needs to sign up.

- `500` "Failed to send OTP"
  - This error occurs when there is an error in the server.

### `POST 'api/auth/verify-otp-signup'`

**Description:** Describe endpoint \

**Example Request:** 

*URL:*

*Headers:* 
```typescript
{
  "Authorization": `Bearer ${token}`
}
```

*Body:*

```typescript
{
  "Authorization": `Bearer ${token}`
}
```

**Example Response:**
```json
{
  
}
```

**Error Handling:**
Write error handling

### `POST 'api/auth/verify-otp-login'`

**Description:** Describe endpoint \

**Example Request:** 

*URL:*

*Headers:* 
```typescript
{
  "Authorization": `Bearer ${token}`
}
```

*Body:*

```typescript
{
  "Authorization": `Bearer ${token}`
}
```

**Example Response:**
```json
{
  
}
```

**Error Handling:**
Write error handling

### `GET 'api/auth/users'`

**Description:** Describe endpoint \

**Example Request:** 

*URL:*

*Headers:* 
```typescript
{
  "Authorization": `Bearer ${token}`
}
```

*Body:*

```typescript
{
  "Authorization": `Bearer ${token}`
}
```

**Example Response:**
```json
{
  
}
```

**Error Handling:**
Write error handling

### `PUT 'api/auth/users/:id/approve'`

**Description:** Describe endpoint \

**Example Request:** 

*URL:*

*Headers:* 
```typescript
{
  "Authorization": `Bearer ${token}`
}
```

*Body:*

```typescript
{
  "Authorization": `Bearer ${token}`
}
```

**Example Response:**
```json
{
  
}
```

**Error Handling:**
Write error handling

### `POST 'api/auth/preapprove'`

**Description:** Describe endpoint \

**Example Request:** 

*URL:*

*Headers:* 
```typescript
{
  "Authorization": `Bearer ${token}`
}
```

*Body:*

```typescript
{
  "Authorization": `Bearer ${token}`
}
```

**Example Response:**
```json
{
  
}
```

**Error Handling:**
Write error handling

### `GET 'api/auth/users/:employeeId'`

**Description:** Describe endpoint \

**Example Request:** 

*URL:*

*Headers:* 
```typescript
{
  "Authorization": `Bearer ${token}`
}
```

*Body:*

```typescript
{
  "Authorization": `Bearer ${token}`
}
```

**Example Response:**
```json
{
  
}
```

**Error Handling:**
Write error handling

### `PUT 'api/auth/users/:employeeId'`

**Description:** Describe endpoint \

**Example Request:** 

*URL:*

*Headers:* 
```typescript
{
  "Authorization": `Bearer ${token}`
}
```

*Body:*

```typescript
{
  "Authorization": `Bearer ${token}`
}
```

**Example Response:**
```json
{
  
}
```

**Error Handling:**
Write error handling

### `GET 'api/auth/users/by-id/:id'`

**Description:** Describe endpoint \

**Example Request:** 

*URL:*

*Headers:* 
```typescript
{
  "Authorization": `Bearer ${token}`
}
```

*Body:*

```typescript
{
  "Authorization": `Bearer ${token}`
}
```

**Example Response:**
```json
{
  
}
```

**Error Handling:**
Write error handling

### `PUT 'api/auth/users/by-id/:id'`

**Description:** Describe endpoint \

**Example Request:** 

*URL:*

*Headers:* 
```typescript
{
  "Authorization": `Bearer ${token}`
}
```

*Body:*

```typescript
{
  "Authorization": `Bearer ${token}`
}
```

**Example Response:**
```json
{
  
}
```

**Error Handling:**
Write error handling

### `GET 'api/auth/:id'`

**Description:** Describe endpoint 

**Example Request:** 

*URL:*

*Headers:* 
```typescript
{
  "Authorization": `Bearer ${token}`
}
```

*Body:*

```typescript
{
  "Authorization": `Bearer ${token}`
}
```

**Example Response:**
```json
{
  
}
```

**Error Handling:**
Write error handling



## For later

**Required Permissions:**
  - Type: `view_survey`  
  - Limiter: `All` or `Self`

  **Required Permissions:**
  - Type: `edit_profile` and `change_perms` (if changing perms) 
  - Limiter: `All` to edit