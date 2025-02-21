## Overview
This project is a NoSQL-based e-commerce backend built with Node.js, Express, and MongoDB. It allows admins to manage boots and users to place orders.

## Features
- User Authentication (JWT-based login/register)
- Role-based Access Control (Admin/User)
- CRUD Operations on Boots (Admin only)
- Order Placement by Users
- MongoDB Integration with relationships
- Secure REST API with authentication

---

## Setup Instructions
### 1. Clone the Repository
git clone 

### 2. Install Dependencies
npm install

### 3. Configure Environment Variables
Create a .env file in the root directory:
MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/<database>
JWT_SECRET=your_secret_key
PORT=5000

### 4. Start the Server
npm start
The API will run at http://localhost:5000.

---

## API Endpoints

### 1. Authentication
#### Register User
POST /register
{
  "username": "user123",
  "password": "mypassword",
  "role": "user"
}
Response: { "message": "User registered successfully" }

#### Login
POST /login
{
  "username": "user123",
  "password": "mypassword"
}
Response: { "token": "your-jwt-token" }

### 2. Boots Management (Admin Only)
#### Add a Boot
POST /boots
{
  "name": "Winter Boot",
  "price": "100",
  "color": "Black",
  "material": "Leather"
}
Requires Admin Token in Headers: { Authorization: Bearer your-jwt-token }

#### Get All Boots
GET /boots
Response: List of available boots

#### Update a Boot (Admin Only)
PUT /boots/:id
{
  "price": "120"
}

#### Delete a Boot (Admin Only)
DELETE /boots/:id

### 3. Orders (User Only)
#### Place an Order
POST /orders
{
  "boots": ["65a8f15b9a3e6c001b0d5e45", "65a8f16b9a3e6c001b0d5e99"]
}
Requires User Token

#### Get Order History
GET /orders
Response: List of past orders

---

## Database Structure

### Collections
1. Users Collection
{
  "_id": "ObjectId",
  "username": "user123",
  "password": "hashed-password",
  "role": "user",
  "orders": ["OrderId"]
}

2. Boots Collection
{
  "_id": "ObjectId",
  "name": "Winter Boot",
  "price": "100",
  "color": "Black",
  "material": "Leather"
}

3. Orders Collection
{
  "_id": "ObjectId",
  "user": "UserId",
  "boots": ["BootId"],
  "totalPrice": "200"
}
