# Nyxcipher API Postman Collection

This repository contains Postman collection and environment files for testing the Nyxcipher Express backend API.

## Contents

- `nyxcipher-api.postman_collection.json` - Postman collection with API endpoints
- `nyxcipher-api.postman_environment.json` - Postman environment variables
- `backend/scripts/seed-users.js` - Seeder script to create test users

## Setup Instructions

1. Install [Postman](https://www.postman.com/downloads/) if you haven't already.
2. Import the collection and environment files:
   - Open Postman
   - Click on "Import" button in the top left
   - Select both JSON files or drag and drop them into the import dialog
   - Click "Import" to confirm

3. Select the "Nyxcipher API Environment" from the environment dropdown in the top right corner.

## Authentication Flow

The collection is set up to automatically extract and store the JWT token from successful login responses. Here's how to use it:

1. First, use the "Register" request to create a new user account.
2. After registration, you'll need to verify your email (check the verification link in your email or console logs during development).
3. Use the "Login" request with your credentials.
4. Upon successful login, the JWT token will be automatically extracted and stored in the `authToken` environment variable.
5. All subsequent requests that require authentication will use this token.

## Available Endpoints

### Authentication

- **Register**: Create a new user account
- **Login**: Authenticate and get JWT token
- **Verify Email**: Verify user email with token
- **Resend Verification Email**: Request a new verification email
- **Forgot Password**: Request password reset email

### User

- **Get User Profile**: Retrieve current user's profile information
- **Update User Profile**: Update user profile details
- **Delete User Profile**: Delete the current user account
- **Get User Nyxciphers**: List all nyxciphers for the current user
- **Get Specific Nyxcipher**: Get details of a specific nyxcipher
- **Get Active Nyxciphers**: List active nyxciphers for the current user
- **Get Closed Nyxciphers**: List closed nyxciphers for the current user
- **Add to Cart**: Add an item to the user's cart
- **Delete from Cart**: Remove an item from the user's cart

## Variables

The collection uses the following environment variables:

- `baseUrl`: The base URL of the API (default: http://localhost:5000)
- `authToken`: JWT token for authenticated requests (automatically set after login)

## Testing Tips

1. Make sure your backend server is running before testing the endpoints.
2. Check the response body, status code, and headers to verify the API behavior.
3. Use the "Tests" tab in requests to write custom test scripts if needed.
4. The collection includes a test script that automatically extracts the JWT token from login responses.

## Seeder Script

A seeder script is included to create test users in the database. This makes it easy to get started with testing the API without manually creating users.

### How to Use the Seeder Script

1. Make sure your MongoDB server is running and properly configured in `backend/config/key.js`.
2. Run the seeder script:

```bash
cd backend
node scripts/seed-users.js
```

3. The script will create two users:
   - Regular user: `test@example.com` / `password123` (role: Customer)
   - Admin user: `admin@example.com` / `admin123` (role: Owner)

4. These users are already verified, so you can immediately use them to test the login endpoint and other authenticated routes.

## Troubleshooting

- If authentication fails, try logging in again to refresh the token.
- Check that your server is running on the correct port (default: 5000).
- Verify that the API endpoints match the routes defined in your backend.
- If you're getting CORS errors, make sure your backend has proper CORS configuration.
