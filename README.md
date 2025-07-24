# FinanzIA Backend

A Node.js/TypeScript backend for the FinanzIA financial management application, powered by AI insights.

## Features

- 🚀 **RESTful API** with Express.js
- 🔐 **Authentication** using JWT
- 🗄 **Database** with Prisma ORM (PostgreSQL)
- 🤖 **AI Integration** for financial insights
- 📊 **Transaction Management**
- 📈 **Budget Tracking**
- 📱 **CORS** enabled for frontend integration
- 📝 **Logging** with Winston
- ✅ **Input Validation** with express-validator
- 🛡 **Security** best practices (helmet, rate limiting, etc.)
- 🔄 **TypeScript** for type safety

## Prerequisites

- Node.js (v18 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn

## Getting Started

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/finanzia-backend.git
   cd finanzia-backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn
   ```

3. **Set up environment variables**
   - Copy `.env.example` to `.env`
   - Update the environment variables in `.env` with your configuration

4. **Set up the database**
   - Make sure PostgreSQL is running
   - Update the `DATABASE_URL` in `.env` with your database connection string
   - Run database migrations:
     ```bash
     npx prisma migrate dev --name init
     ```
   - (Optional) Seed the database with initial data:
     ```bash
     npx prisma db seed
     ```

5. **Start the development server**
   ```bash
   npm run dev
   # or
   yarn dev
   ```

   The server will be available at `http://localhost:3000`

## Project Structure

```
├── src/
│   ├── config/          # Configuration files
│   ├── controllers/     # Route controllers
│   ├── middlewares/     # Custom express middlewares
│   ├── models/          # Database models (Prisma)
│   ├── routes/          # API routes
│   ├── services/        # Business logic
│   ├── utils/           # Utility classes and functions
│   └── index.ts         # App entry point
├── prisma/             # Prisma schema and migrations
├── .env                # Environment variables
├── package.json        # Project metadata and dependencies
└── tsconfig.json      # TypeScript configuration
```

## Available Scripts

- `npm run dev` - Start the development server with hot-reload
- `npm run build` - Build the application for production
- `npm start` - Start the production server
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier
- `npm test` - Run tests
- `npx prisma studio` - Open Prisma Studio to view and edit the database

## Environment Variables

See `.env.example` for all available environment variables.

## API Documentation

API documentation is available at `/api-docs` when running in development mode.

## Testing

```bash
# Run tests
npm test

# Run tests in watch mode
npm test:watch

# Run tests with coverage
npm run test:coverage
```

## Deployment

1. Build the application:
   ```bash
   npm run build
   ```

2. Start the production server:
   ```bash
   npm start
   ```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [Prisma](https://www.prisma.io/)
- [Express](https://expressjs.com/)
- [TypeScript](https://www.typescriptlang.org/)
- [Winston](https://github.com/winstonjs/winston)
- And all other amazing open-source projects used in this project.
