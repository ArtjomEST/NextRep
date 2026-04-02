# NextRep Features

## Core Features

### 1. **Workout Tracking**
- Create and log workout sessions
- Record exercises with sets, reps, and weight
- Track workout date, duration, and notes
- Active workout view with live tracking
- Workout summary after completion
- Browse workout history

### 2. **Exercise Library**
- Browse exercises with filters
- Categorized by muscle groups and equipment
- Detailed exercise instructions from WGER database
- Search exercises
- View exercise details and form guides

### 3. **Workout Presets/Templates**
- Save favorite workout templates
- Create custom presets for quick workout setup
- Load and reuse presets
- Organize and manage preset collection

### 4. **AI Coach**
- Chat with AI-powered fitness coach powered by OpenAI
- Get personalized coaching and form advice
- AI-generated workout reports and analysis
- Performance insights and recommendations
- Context-aware responses based on workout history

### 5. **Community & Social Features**
- Global and personalized feed
- Create and share workout posts
- Like and comment on posts
- Follow/unfollow other users
- View public user profiles
- User reputation through activity and engagement
- Community interaction and networking

### 6. **User Profiles**
- Public profile page with profile information
- Workout statistics and history display
- User bio and avatar
- Follow/unfollow functionality
- Privacy and customization settings

### 7. **Account & Settings**
- User account management
- Measurement unit preference (kg/lbs)
- Experience level settings
- Profile customization
- Account preferences

### 8. **Photo Upload & Sharing**
- Upload workout photos using Vercel Blob
- Attach photos to workout posts
- Share progress and form checks with community
- Image storage and retrieval

### 9. **Authentication**
- Telegram Web App authentication
- Secure login via Telegram
- Session management
- User onboarding flow

### 10. **Workout History**
- View past workouts
- Filter by date, exercise type
- Review workout details and performance
- Track progress over time

### 11. **User Onboarding**
- Initial setup flow for new users
- Profile creation
- Experience level and measurement unit selection
- Introduction to main features

## Technical Features

- **Mobile-First Design** - Optimized for mobile devices within Telegram
- **Real-Time Updates** - Live workout tracking and community feed
- **Dark Theme** - Professional dark theme interface
- **Drag & Drop** - Reorder exercises and workouts (using @dnd-kit)
- **Responsive UI** - Works across different screen sizes
- **Database Persistence** - PostgreSQL with Drizzle ORM
- **API-First Architecture** - RESTful API endpoints for all features
- **File Storage** - Vercel Blob integration for photos

## Integration Features

- **Telegram Bot Integration** - Webhook support for Telegram notifications
- **OpenAI API** - AI-powered coaching and analysis
- **WGER API** - Exercise database with comprehensive exercise data
- **Vercel Blob** - Cloud photo storage and CDN

## Data Models Supported

- User profiles and preferences
- Exercises with muscle groups and equipment classification
- Workout sessions with exercises and sets
- Workout presets/templates
- Community posts, comments, and likes
- User follow relationships
- AI chat history and coaching context
