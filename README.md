# 🏗️ ConstraX - Construction Daily Tracker

A production-ready construction tracking web app with Google Apps Script backend and Google Sheets database.

## 📋 Features

- ✅ **Login System** - Admin & User roles with active/inactive control
- ✅ **Dashboard** - Stats cards + recent entries table
- ✅ **Add Entry** - Daily construction data entry form
- ✅ **Admin Control** - Edit, delete entries; manage users
- ✅ **Reports** - Date range filtering with summary
- ✅ **Share Report** - Export report as PNG image
- ✅ **API Status** - Live LED indicator for API health
- ✅ **Auto Refresh** - Data reloads after add/update/delete
- ✅ **Mobile Responsive** - Bottom nav on mobile, sidebar on desktop
- ✅ **Security** - Backend filters data by role

## 📂 File Structure

```
constrax/
├── index.html      # Main HTML with inline Tailwind CSS
├── style.css       # Additional custom styles
├── app.js          # Frontend JavaScript application
├── Code.gs         # Google Apps Script backend
└── README.md       # This file
```

## 🚀 Deployment Guide

### Step 1: Google Sheets Setup

Create a Google Sheet with **exactly** these sheets and columns:

#### Sheet: `Users`
| A  | B        | C        | D    | E      | F        |
|----|----------|----------|------|--------|----------|
| id | username | password | role | active | photoURL |

- `role` = "Admin" or "User" (case-sensitive)
- `active` = TRUE or FALSE (boolean)
- Add at least one admin user manually

#### Sheet: `DailyData`
| A    | B        | C      | D      | E      | F     | G       |
|------|----------|--------|--------|--------|-------|---------|
| date | building | labour | mistri | cement | notes | entryBy |

**⚠️ CRITICAL: Do NOT change column names, order, or add/remove columns.**

### Step 2: Google Apps Script Setup

1. Open your Google Sheet
2. Click **Extensions → Apps Script**
3. Delete any existing code
4. Copy the entire contents of `Code.gs` into the editor
5. Click **Save** (💾 icon)
6. Click **Deploy → New Deployment**
7. Choose **Web app**
8. Set:
   - **Execute as:** `Me`
   - **Who has access:** `Anyone` (or your org)
9. Click **Deploy**
10. **Copy the Web App URL** (looks like `https://script.google.com/macros/s/.../exec`)

### Step 3: Configure Frontend

1. Open `app.js`
2. Find the `CONFIG` object at the top
3. Replace `YOUR_DEPLOYMENT_ID` with your actual Web App URL:

```js
const CONFIG = {
  API_URL: "https://script.google.com/macros/s/YOUR_ACTUAL_ID/exec",
  USE_MOCK: false
};
```

Set `USE_MOCK: true` if you want to test the frontend without the backend.

### Step 4: Host the Frontend

You can host the files on any static hosting:
- **GitHub Pages**
- **Netlify** (drag & drop the folder)
- **Vercel**
- **Any web server**

Simply upload `index.html`, `style.css`, and `app.js` together.

## 🔧 API Reference

### POST Endpoints (doPost)

| Action | Description |
|--------|-------------|
| `login` | Authenticate user |
| `submitData` | Add new daily entry |
| `updateEntry` | Update existing entry |
| `deleteEntry` | Delete entry by rowIndex |
| `toggleUser` | Toggle user active status |

### GET Endpoints (doGet)

| Action | Description |
|--------|-------------|
| `getData` | Get entries (filtered by role) |
| `getUsers` | Get all users (Admin only) |
| `status` | API health check |

## 🔒 Security Notes

- Backend filters data by role - Admin sees all, User sees own entries
- Passwords are NOT returned in API responses
- Frontend cannot override role-based restrictions
- User active/inactive status is enforced server-side

## 📱 Usage

1. **Login** with your credentials
2. **Dashboard** shows stats and recent entries
3. **Add Entry** to submit daily construction data
4. **Reports** filter by date range and export as image
5. **Users** (Admin) manage user accounts
