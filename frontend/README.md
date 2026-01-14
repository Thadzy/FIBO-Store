# FIBO STORE - Inventory Management System

**FIBO STORE** is a full-stack inventory requisition system designed for the Institute of Field Robotics (FIBO) at KMUTT. It allows students to browse equipment, add items to a cart, and submit requisition requests. Administrators can manage inventory, approve/reject requests, and track stock levels.

<!-- ![Project Screenshot](https://placehold.co/1200x600?text=FIBO+STORE+Screenshot)
*(Replace the link above with a real screenshot of your app if you have one)* -->

---

## Tech Stack

### Frontend
* **Framework:** [Next.js 15](https://nextjs.org/) (App Router)
* **Language:** TypeScript
* **Styling:** Tailwind CSS
* **Authentication:** NextAuth.js (Google OAuth)
* **State/Feedback:** React Hooks, React Hot Toast
* **Deployment:** Vercel

### Backend
* **Framework:** [FastAPI](https://fastapi.tiangolo.com/) (Python)
* **Database:** PostgreSQL (hosted on Neon.tech)
* **ORM:** SQLModel / SQLAlchemy
* **Image Storage:** Cloudinary
* **Deployment:** Render / Railway

---

## Project Structure

Here is an overview of the key files and directories in this project:

```bash
FIBO-STORE/
├── backend/                 # Python FastAPI Backend
│   ├── uploads/             # Temp folder for uploads (if needed)
│   ├── main.py              # Entry point of the API server
│   ├── requirements.txt     # Python dependencies list
│   └── .env                 # Backend secrets (DO NOT COMMIT)
│
├── frontend/                # Next.js Frontend
│   ├── public/              # Static assets (images, logos)
│   ├── src/
│   │   ├── app/             # App Router Pages
│   │   │   ├── admin/       # Admin Dashboard Page
│   │   │   ├── api/auth/    # NextAuth Route Handlers
│   │   │   ├── history/     # User Booking History Page
│   │   │   ├── login/       # Custom Login Page
│   │   │   ├── layout.tsx   # Root layout (Metadata, Providers)
│   │   │   └── page.tsx     # Homepage (Catalog)
│   │   │
│   │   ├── components/      # Reusable UI Components
│   │   │   ├── Navbar.tsx
│   │   │   ├── ItemCard.tsx
│   │   │   ├── CartSidebar.tsx
│   │   │   └── ... (Modals for Add/Edit/Checkout)
│   │   │
│   │   ├── services/        # API fetch functions (adminService.ts)
│   │   └── types/           # TypeScript Interfaces (Item, Booking, etc.)
│   │
│   ├── next.config.ts       # Next.js configuration
│   ├── tailwind.config.ts   # Tailwind configuration
│   └── .env.local           # Frontend secrets (DO NOT COMMIT)
│
└── README.md                # Project Documentation

```

---

## Getting Started (Local Development)

Follow these steps to run the project on your machine.

### Prerequisites

* **Node.js** (v18 or higher)
* **Python** (v3.10 or higher)
* **Git**

### 1. Clone the Repository

```bash
git clone [https://github.com/Thadzy/FIBO-Store.git](https://github.com/Thadzy/FIBO-Store.git)
cd FIBO-Store

```

### 2. Setup Backend (FastAPI)

Open a terminal in the root folder:

```bash
cd backend

# Create a virtual environment
python -m venv venv

# Activate it
# On Mac/Linux:
source venv/bin/activate
# On Windows:
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run the server
uvicorn main:app --reload

```

*The backend will start at `http://127.0.0.1:8000*`
*API Docs (Swagger UI): `http://127.0.0.1:8000/docs*`

### 3. Setup Frontend (Next.js)

Open a **new** terminal window:

```bash
cd frontend

# Install dependencies
npm install

# Run the development server
npm run dev

```

*The frontend will start at `http://localhost:3000*`

---

## Environment Variables (.env)

**IMPORTANT:** This project uses sensitive keys. You must create `.env` files locally. **Never commit these files to GitHub.**

### Frontend (`frontend/.env.local`)

Create this file inside the `frontend` folder.

```env
# URL of your Backend API (Use [http://127.0.0.1:8000](http://127.0.0.1:8000) for local)
NEXT_PUBLIC_API_URL=[http://127.0.0.1:8000](http://127.0.0.1:8000)

# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_random_secret_string_here

# Google OAuth (Get these from Google Cloud Console)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Admin Access Control (Comma-separated emails)
ADMIN_EMAILS=thadchai.suks@mail.kmutt.ac.th,admin@mail.kmutt.ac.th

```

### Backend (`backend/.env`)

Create this file inside the `backend` folder.

```env
# Database Connection String (Get from Neon.tech)
DATABASE_URL=postgresql://user:password@ep-xyz.aws.neon.tech/neondb?sslmode=require

# Cloudinary (For Image Uploads)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

```

> **Note:** If you need the real API keys to run the project, please contact the Lead Developer (Thadzy) directly.

---

## Deployment Guide

### Frontend (Vercel)

The frontend is deployed on **Vercel**.

* **Updates:** Pushing to the `main` branch on GitHub automatically triggers a redeploy.
* **Environment Variables:** If you add a new variable in `.env.local`, you MUST add it to the **Vercel Project Settings > Environment Variables** as well.
* **Production URL:** `https://fibo-store-six.vercel.app`

### Backend (Render)

The backend is deployed on **Render** (as a Web Service).

* **Updates:** Pushing changes to the `backend` folder triggers a redeploy.
* **Environment Variables:** Managed in the Render Dashboard under "Environment".

---

## Troubleshooting

**1. "Redirect URI mismatch" Error:**
This happens if the Google OAuth redirect URL is not whitelisted.

* Go to Google Cloud Console.
* Ensure both `http://localhost:3000/api/auth/callback/google` (for local) and `https://your-vercel-app.vercel.app/api/auth/callback/google` (for production) are added to **Authorized redirect URIs**.

**2. Images not loading:**
Ensure your `NEXT_PUBLIC_API_URL` points to the correct backend. Old items created on localhost might have broken image links when viewed in production. Delete and re-upload them.

---

## Contact & Support

This project was originally developed by **Thadchai Suksaran (Thadzy) FRAB11**.

If you are the next developer taking over this project:

1. **Read the code comments:** Key logic in `src/app/admin/page.tsx` and `src/app/page.tsx` is documented.
2. **Check the Database:** We use Neon (PostgreSQL). Use a tool like DBeaver or the Neon Console to inspect tables.
3. **Contact me:**
* **Email:** `thadzy025@gmail.com`
* **GitHub:** [Thadzy](https://github.com/Thadzy)



*Good luck building the future of FIBO!*

```

```