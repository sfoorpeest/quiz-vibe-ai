# Frontend - Quiz Vibe AI

## 📁 Folder Structure

```
src/
├── api/
│   └── axiosClient.js          # Axios instance with base URL and interceptors
├── components/
│   ├── AnimatedBackground.jsx   # 3D interactive dark blue/purple background
│   └── ProtectedRoute.jsx       # Route wrapper for authentication
├── context/
│   └── AuthContext.jsx          # Authentication context (login, logout, user state)
├── pages/
│   ├── Login.jsx                # Login page
│   ├── Register.jsx             # Registration page
│   └── Home.jsx                 # Dashboard/Home page (protected)
├── services/
│   └── authService.js           # Auth API service functions
├── App.jsx                      # Main router setup
├── main.jsx                     # React entrypoint
├── index.css                    # Global styles + Tailwind directives
├── App.css                      # Component styles (optional, use Tailwind)
└── assets/                      # Images, icons, etc.

.env.local                       # Environment variables (frontend only)
tailwind.config.js              # Tailwind CSS configuration
postcss.config.js               # PostCSS configuration
```

## 🚀 Technologies Used

- **React Router DOM** - Page navigation
- **Axios** - API calls
- **Context API** - Global state (user, token, auth)
- **TailwindCSS** - Styling
- **Vite** - Build tool

## 📝 How to Use

### 1. Start the Frontend

```bash
npm run dev
# Opens at http://localhost:5173
```

### 2. API Connection

- Backend API: `http://localhost:5000`
- Configure in `.env.local`: `VITE_API_URL=http://localhost:5000`

### 3. Authentication Flow

1. Register: `/register` → Create account (Requires unique `name`, `email`, and `password`)
2. Login: `/login` → Get JWT token (Uses `name` as the primary identifier instead of `email`)
3. Advanced forms: Fully optimized for browser native password managers with standard `autoComplete` attributes.
4. Token stored in `localStorage`
5. Protected routes use `ProtectedRoute` component
6. Logout: Clear token & redirect to login

### 4. Making API Calls

```jsx
import api from "../api/axiosClient";

// Token automatically attached via interceptors
const response = await api.post("/api/quiz/generate", { topic: "Math" });
```

## 🎨 Styling

The application features a **Dark Mode Blue-Purple Theme** designed for modern, student-friendly aesthetics. Built entirely with **TailwindCSS**:

- Dark slate backgrounds (`bg-slate-900`, `bg-slate-950`)
- Glassmorphism effects (`backdrop-blur-xl`, `bg-slate-900/80`)
- Vibrant primary gradients (`from-cyan-600 via-blue-600 to-violet-600`)
- Deep shadowing for depth (`shadow-blue-500/10`)
- `framer-motion` integrated for 3D interactions and animations.

Example:

```jsx
<div className="flex items-center justify-center min-h-screen bg-slate-950">
  <button className="px-6 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-500/30">
    Bắt đầu học ngay
  </button>
</div>
```

## 📋 Next Steps

1. Create Quiz page (to generate quizzes via AI)
2. Quiz Result page (show score)
3. User Profile page
4. Add validation (form inputs)
5. Error handling & toast notifications
6. Loading states

## 🛠️ Adding New Pages

1. Create page in `src/pages/NewPage.jsx`
2. Add route in `App.jsx`:
   ```jsx
   <Route
     path="/new"
     element={
       <ProtectedRoute>
         <NewPage />
       </ProtectedRoute>
     }
   />
   ```
3. Use `useAuth()` to access user/token if needed
4. Use Tailwind for styling

---

**Ready to build!** 🚀
