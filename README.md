# Pilot Command Cluster

A centralized suite of tools for Eve Online players, providing unified access to various community tools and utilities across Web, Desktop, and Mobile platforms.

## Current Features

- Eve Online SSO Authentication with secure token management
- Character Profile Dashboard
- Planetary Industry Management
  - Visual colony layout and management
  - Resource flow visualization
  - Real-time colony status monitoring

## Technology Stack

### Frontend
- React.js with TypeScript
- TailwindCSS for styling
- React Router v6 for navigation
- Shadcn/UI components
- Debug.js for development logging

### Backend
- Node.js with Express
- TypeScript
- JWT for session management
- EVE ESI API integration
- Winston for logging

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- EVE Online Developer Application credentials

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/pilot-command-cluster.git
cd pilot-command-cluster
```

2. Install dependencies for both frontend and backend:
```bash
# Install API dependencies
cd api
npm install

# Install Web dependencies
cd ../web
npm install
```

3. Set up environment variables:
   - Copy `.env.development` to `.env` in the web directory
   - Create `.env` in the api directory with your EVE Online application credentials:
     ```
     EVE_CLIENT_ID=your_client_id
     EVE_CLIENT_SECRET=your_client_secret
     EVE_CALLBACK_URL=http://localhost:3001/auth/callback
     JWT_SECRET=your_jwt_secret
     ```

4. Start the development servers:
```bash
# Start API (from api directory)
npm run dev

# Start Web (from web directory)
npm start
```

The web application will be available at `http://localhost:3000` and the API at `http://localhost:3001`.

## Deployment

The project is configured for deployment on Vercel:
- Frontend: Deployed as a React application
- Backend: Deployed as a Node.js serverless function

Environment variables must be configured in the Vercel dashboard for both frontend and backend deployments.

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
