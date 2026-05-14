# E-Commerce Backend API
A powerful and scalable E-Commerce Backend built using Node.js, Express.js, and MongoDB.
This backend provides secure REST APIs for authentication, product management, cart handling, order processing, image uploads, email services, and automated scheduled tasks.

---

# 🚀 Features
- User Authentication & Authorization
- JWT Based Secure Login/Register
- Admin & User Role Management
- Product CRUD Operations
- Category Management
- Shopping Cart APIs
- Order Management System
- Image Upload Support
- Email Services using Nodemailer
- Scheduled Tasks using Cron Jobs
- MongoDB Database Integration
- RESTful API Architecture
- Middleware Based Security
- Error Handling & Validation
- Environment Variable Support

---

# 🛠 Tech Stack
| Technology     | Purpose             |
| -------------- | ------------------- |
| Node.js        | Backend Runtime     |
| Express.js     | Server Framework    |
| MongoDB        | Database            |
| Mongoose       | Database ODM        |
| Nodemailer     | Email Sending       |
| node-cron      | Scheduled Tasks     |
| JSON Web Token | Authentication      |
| Bcrypt         | Password Encryption |
| Multer         | Image Upload        |

---

# 📁 Project Structure

```bash
project-root/
│
├── .vscode/
├── config/
├── controllers/
├── middlewares/
├── models/
├── routes/
├── uploads/
├── utils/
├── validations/
│
├── .env.example
├── .gitignore
├── app.js
├── server.js
├── package.json
├── package-lock.json
│
├── mangojuice.jpg
├── mazza.png
└── milk.png
```

---

# 📂 Folder Explanation

| Folder         | Description                           |
| -------------- | ------------------------------------- |
| `config/`      | Database & application configurations |
| `controllers/` | Business logic for APIs               |
| `middlewares/` | Authentication & custom middleware    |
| `models/`      | MongoDB models/schemas                |
| `routes/`      | API route definitions                 |
| `uploads/`     | Uploaded product images/files         |
| `utils/`       | Helper & utility functions            |
| `validations/` | Request validation logic              |

---

# ⚙️ Installation
## 1️⃣ Clone Repository
```bash
git clone https://github.com/your-username/ecommerce-backend.git
```

## 2️⃣ Move Into Project Directory
```bash
cd ecommerce-backend
```

## 3️⃣ Install Dependencies
```bash
npm install
```

---

# 🔐 Environment Variables
Create a `.env` file in the root directory.
```env
PORT=5000
MONGODB_URL=your_mongodb_connection_string
JWT_SECRET=your_secret_key
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_email_password
```

---

# ▶️ Run Application

## Development Mode

```bash
npm run dev
```

## Production Mode

```bash
npm start
```

---

# 📧 Email Service (Nodemailer)
This project uses Nodemailer to send:
- Welcome Emails
- Order Confirmation Emails
- OTP Verification
- Password Reset Emails
- Shipping Notifications

---

# ⏰ Cron Jobs

This project uses node-cron for background scheduled tasks.

## Example Use Cases
- Delete Expired OTPs
- Auto Cancel Pending Orders
- Daily Report Generation
- Cleanup Tasks
- Inventory Management

---

# 📤 Image Uploads
Image uploads are handled using Multer.
Uploaded images are stored inside the `uploads/` folder.

---

# 🛡 Security Features
- JWT Authentication
- Password Hashing
- Protected Routes
- Environment Variables
- Input Validation
- Middleware Security
- Error Handling

---

# 🧪 API Testing
You can test APIs using:
- Postman

---

# 📌 Future Improvements
- Payment Gateway Integration
- Wishlist System
- Product Reviews & Ratings
- Admin Dashboard
- Real-Time Notifications
- Docker Support
- Redis Caching

---

# 📄 License
This project is licensed under the MIT License.

---

# 👨‍💻 Author
Developed by **Avi Italiya**
