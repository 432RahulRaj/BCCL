# BCCL Quarters Complaint Management Portal

A comprehensive complaint management system for BCCL (Bharat Coking Coal Limited) quarters, built with React, TypeScript, and Supabase.

## 🚀 Features

### Multi-Role System
- **Employee Portal**: Submit and track complaints
- **Admin Portal**: Manage complaints, users, and view analytics
- **Department Portal**: Handle assigned tasks and update progress

### Core Functionality
- **Complaint Management**: Submit, assign, track, and resolve complaints
- **Real-time Updates**: Live status updates and notifications
- **Analytics Dashboard**: Comprehensive reporting and insights
- **Responsive Design**: Works seamlessly on desktop and mobile
- **Offline Support**: Demo mode when database is unavailable

### Security & Authentication
- Email-based OTP authentication
- Role-based access control
- Row-level security with Supabase

## 🚀 Live Demo

**Deployed Application**: [https://bccl-managment.netlify.app/login](https://bccl-managment.netlify.app/)

## 🛠️ Technology Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **Charts**: Chart.js with react-chartjs-2
- **Icons**: Lucide React
- **Routing**: React Router DOM
- **Notifications**: React Hot Toast
- **Build Tool**: Vite

## 📋 Prerequisites

- Node.js 18+ and npm
- Supabase CLI (for local development)

## 🚀 Quick Start

### 1. Clone and Install
```bash
git clone <repository-url>
cd bccl-complaint-portal
npm install
```

### 2. Environment Setup
```bash
cp .env.example .env
```

### 3. Local Development (Recommended)
```bash
# Install Supabase CLI if not already installed
npm install -g supabase

# Start local Supabase
npm run supabase:start

# Start development server
npm run dev
```

### 4. Online/Production Setup
1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Update `.env` with your project credentials:
```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

## 🎭 Demo Accounts

| Role | Email | OTP |
|------|-------|-----|
| Admin | admin@coalindia.in | 123456 |
| Employee | employee@coalindia.in | 123456 |
| Water Dept | water@coalindia.in | 123456 |
| Electrical Dept | electrical@coalindia.in | 123456 |
| Plumbing Dept | plumbing@coalindia.in | 123456 |

## 📁 Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── auth/           # Authentication components
│   └── ui/             # UI components
├── contexts/           # React contexts (Auth, Complaints)
├── layouts/            # Layout components
├── lib/                # Utility libraries
├── pages/              # Page components
│   ├── admin/          # Admin pages
│   ├── department/     # Department pages
│   └── employee/       # Employee pages
├── utils/              # Utility functions
└── types/              # TypeScript type definitions
```

## 🗄️ Database Schema

### Core Tables
- **users**: User management and roles
- **employees**: Employee information
- **departments**: Department information
- **complaints**: Complaint records
- **complaint_comments**: Comments on complaints
- **complaint_status_history**: Status change history
- **profiles**: User profiles (for auth.users)

## 🎯 Features by Role

### 👤 Employee
- Submit new complaints
- Track complaint status and history
- View complaint details and comments
- Escalate complaints when needed
- Update profile information

### 👨‍💼 Admin
- View comprehensive dashboard with analytics
- Manage all complaints system-wide
- Assign complaints to departments
- Manage users and departments
- View detailed analytics and reports
- System administration

### 🏢 Department
- View department-specific dashboard
- Manage assigned complaints
- Update complaint status and progress
- Add comments and progress updates
- Track department performance metrics

## 🔧 Development Commands

```bash
# Development
npm run dev              # Start development server
npm run build           # Build for production
npm run preview         # Preview production build
npm run lint            # Run ESLint

# Supabase
npm run supabase:start  # Start local Supabase
npm run supabase:stop   # Stop local Supabase
npm run supabase:reset  # Reset local database
npm run supabase:types  # Generate TypeScript types
```

## 🚀 Deployment

### Frontend Deployment
```bash
npm run build
# Deploy the dist/ folder to your hosting service
```

### Database Deployment
For production, use Supabase hosted service:
1. Create a Supabase project
2. Link your local project: `supabase link --project-ref your-project-id`
3. Push migrations: `supabase db push`
4. Update environment variables with production URLs

## 🎨 Design System

### Colors
- **Primary**: Blue (#0066cc) - BCCL brand color
- **Secondary**: Orange (#ff6600) - Accent color
- **Success**: Green (#10b981)
- **Warning**: Yellow (#f59e0b)
- **Error**: Red (#ef4444)

### Typography
- **Font**: Inter (Google Fonts)
- **Weights**: 300, 400, 500, 600, 700

### Components
- Consistent 8px spacing system
- Rounded corners (8px, 12px, 16px)
- Subtle shadows and borders
- Smooth transitions and hover states

## 🔒 Security Features

- Email-based OTP authentication
- Role-based access control (RBAC)
- Row-level security (RLS) policies
- Input validation and sanitization
- Secure API endpoints
- CORS protection

## 📱 Responsive Design

- Mobile-first approach
- Breakpoints: sm (640px), md (768px), lg (1024px), xl (1280px)
- Touch-friendly interface
- Optimized for all screen sizes

## 🌐 Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## 📄 License

This project is licensed under the MIT License.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📞 Support

For support and questions:
- Email: support@coalindia.in
- Create an issue in the repository

---

**Built with ❤️ for BCCL by the Development Team**
