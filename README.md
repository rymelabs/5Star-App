# ⚽ 5Star - Premier Soccer App

A modern, feature-rich soccer application built with React and Vite, featuring live scores, fixtures, news, and comprehensive admin management.

![5Star App](https://img.shields.io/badge/React-19-61DAFB?logo=react)
![Vite](https://img.shields.io/badge/Vite-7-646CFF?logo=vite)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-06B6D4?logo=tailwindcss)

## 🎯 Features

### ⚽ **Core Sports Features**
- **Live Fixtures** - Real-time match updates and scores
- **League Tables** - Dynamic team rankings and statistics
- **Sports News** - Latest articles with engagement features
- **Team Management** - Comprehensive team profiles and data
- **Live Commentary** - Minute-by-minute match updates

### 👥 **User System**
- **Authentication** - Secure login/register system
- **User Profiles** - Personal settings and preferences
- **Role Management** - User and admin access levels
- **Comments System** - Interactive discussions on news and fixtures

### 🛠️ **Admin Dashboard**
- **Team Management** - Add/edit teams with bulk upload (CSV/JSON)
- **Fixture Management** - Schedule matches and update live scores
- **News Management** - Create and publish articles
- **Analytics** - Dashboard with key statistics
- **Content Moderation** - Manage user comments and interactions

### 🎨 **Design & UX**
- **Modern UI** - Black, orange, and green color scheme
- **Glassmorphism** - Beautiful translucent elements
- **Mobile-First** - Responsive design for all devices
- **Floating Navigation** - Modern bottom navigation bar
- **Poppins Typography** - Clean, professional font with tight tracking

## 🚀 Tech Stack

- **Frontend**: React 19 + Vite 7
- **Styling**: Tailwind CSS with custom color system
- **State Management**: React Context API
- **Routing**: React Router v6
- **Icons**: Lucide React
- **Data Storage**: LocalStorage (with future database integration ready)

## 🎨 Color Palette

```css
/* Primary Colors */
Orange: #f97316 (Primary actions, branding)
Green: #22c55e (Accent, positive indicators)
Black: #000000 (Backgrounds)

/* Dark Variants */
dark-700: #374151 (Elevated surfaces)
dark-800: #000000 (Card surfaces)
dark-900: #000000 (Main background)
```

## 📦 Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd 5star-soccer-app
```

2. **Install dependencies**
```bash
npm install
```

3. **Start development server**
```bash
npm run dev
```

4. **Build for production**
```bash
npm run build
```

## 🔑 Demo Accounts

### User Account
- **Email**: demo@example.com
- **Password**: demo123

### Admin Account
- **Email**: admin@example.com
- **Password**: admin123

## 📱 App Structure

```
src/
├── components/          # Reusable UI components
│   ├── Header.jsx      # App header with search and profile
│   ├── BottomNavigation.jsx  # Floating bottom nav
│   ├── Layout.jsx      # Main app layout
│   └── BulkTeamUpload.jsx    # Bulk upload functionality
├── pages/              # Main application pages
│   ├── Latest.jsx      # Home page with news and fixtures
│   ├── Fixtures.jsx    # Fixtures list and details
│   ├── News.jsx        # News articles and reading
│   └── admin/          # Admin management pages
├── context/            # React Context providers
│   ├── AuthContext.jsx # User authentication
│   ├── FootballContext.jsx   # Teams, fixtures, tables
│   └── NewsContext.jsx # Articles and comments
└── utils/              # Helper functions and utilities
```

## 🌟 Key Features Deep Dive

### 📊 **Live Match System**
- Real-time score updates
- Live commentary and events
- Team lineups and formations
- User comments and discussions

### 📰 **News Platform**
- Rich article creation and editing
- Image support and formatting
- User engagement (likes, comments, shares)
- Category-based filtering

### 🛡️ **Admin Panel**
- **Bulk Team Upload**: CSV/JSON support with validation
- **Match Management**: Schedule and update live fixtures
- **Content Creation**: Rich news article editor
- **Analytics Dashboard**: User engagement and content metrics

### 🔍 **Search & Filter**
- Global search across teams, fixtures, and news
- Advanced filtering options
- Real-time search suggestions

## 🚀 Deployment

### Vercel (Recommended)
```bash
npm install -g vercel
vercel --prod
```

### Netlify
```bash
npm run build
# Deploy dist/ folder to Netlify
```

### GitHub Pages
```bash
npm install --save-dev gh-pages
npm run build
npm run deploy
```

## 📁 Environment Variables

Create a `.env` file in the root directory:

```env
VITE_APP_NAME=5Star
VITE_API_URL=your_api_url_here
VITE_STORAGE_KEY=5star_app_data
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🎯 Roadmap

- [ ] Real-time WebSocket integration for live matches
- [ ] Push notifications for match updates
- [ ] Player statistics and profiles
- [ ] Fantasy league integration
- [ ] Mobile app (React Native)
- [ ] Backend API integration
- [ ] Advanced analytics and reporting

## 📞 Support

For support, email support@5starapp.com or join our Discord community.

---

Made with ⚽ by the 5Star Team
