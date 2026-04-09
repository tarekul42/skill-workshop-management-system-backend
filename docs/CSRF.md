# CSRF (Cross-Site Request Forgery) Protection

## What is CSRF?
**CSRF** is an attack that tricks a user's browser into making unwanted requests to a website where they are already logged in. 
Imagine you are logged into your bank account. Then you visit a malicious website that has a hidden form. When you visit it, the malicious site sends a request to your bank telling it to "transfer $1000 to the attacker's account". Since you are already logged in, the bank's server will think the request is legitimate and process it.

## How we protect against it
We use the **Double CSRF** pattern. This requires the client to send a unique "secret token" with every state-changing request (`POST`, `PUT`, `PATCH`, `DELETE`). 
Unless the attacker knows this secret token (which they shouldn't, as it's not stored in a cookie that they can access), the server will reject the request.

---

## How to use CSRF tokens in this API

### 1. Fetch the Token
Before making any state-changing requests, you must fetch a fresh CSRF token from the server.

- **Endpoint**: `GET /api/v1/csrf-token`
- **Response**:
  ```json
  {
    "csrfToken": "YOUR_SECRET_TOKEN_HERE"
  }
  ```
- **Side Effect**: The server will also set a `__csrf` cookie in your browser. This cookie is required for the token to be valid.

### 2. Include the Token in your Requests
For all `POST`, `PUT`, `PATCH`, and `DELETE` requests, you must:
1. Include the `x-csrf-token` header with the value you fetched.
   - Example header: `x-csrf-token: YOUR_SECRET_TOKEN_HERE`
2. Ensure you are sending cookies with the request.
   - **Axios**: Set `withCredentials: true`.
   - **Fetch**: Set `credentials: 'include'`.

### 3. Handling Errors
If you get a `403 Forbidden` response with the message `"Invalid CSRF token"`, it usually means:
- The token has expired.
- The token was not included in the headers.
- The `__csrf` cookie was missing from the request.

In this case, you should fetch a new token and retry the request.
