# Image Quality Assessment

A modern web application for subjective image quality assessment, built with Next.js and TypeScript. This tool allows users to compare and score image quality using an interactive slider interface.

## Features

- **Interactive Image Comparison**
  - Side-by-side image comparison with a draggable slider
  - Touch-friendly interface for mobile devices
  - Real-time visual feedback

- **Progress Tracking**
  - Batch-based image assessment
  - Overall progress visualization
  - Current batch and total progress indicators

- **User Management**
  - JWT-based authentication
  - Session management
  - Admin dashboard for monitoring

- **Admin Dashboard**
  - Real-time progress monitoring
  - User session tracking
  - S3 synchronization status
  - Recent results view

- **Performance Optimizations**
  - Image prefetching for faster transitions
  - Efficient batch processing
  - Optimized mobile experience

## Tech Stack

- **Frontend**
  - Next.js 14
  - TypeScript
  - Tailwind CSS
  - Shadcn UI Components

- **Backend**
  - Next.js API Routes
  - PostgreSQL with Drizzle ORM
  - AWS S3 for image storage
  - JWT for authentication

## Getting Started

1. **Prerequisites**
   ```bash
   Node.js 18+ 
   PostgreSQL
   AWS Account with S3 access
   ```

2. **Environment Setup**
   Create a `.env` file in the root directory:
   ```env
   DATABASE_URL=your_postgres_connection_string
   AWS_ACCESS_KEY_ID=your_aws_access_key
   AWS_SECRET_ACCESS_KEY=your_aws_secret_key
   AWS_REGION=ap-south-1
   JWT_SECRET=your_jwt_secret
   ```

3. **Installation**
   ```bash
   # Install dependencies
   npm install

   # Run database migrations
   npm run db:migrate

   # Start development server
   npm run dev
   ```

4. **Build for Production**
   ```bash
   npm run build
   npm start
   ```

## Project Structure

```
├── app/
│   ├── admin/           # Admin dashboard
│   ├── api/            # API routes
│   ├── components/     # Shared components
│   └── page.tsx        # Main scoring interface
├── db/
│   ├── migrations/     # Database migrations
│   └── schema.ts       # Database schema
└── public/            # Static assets
```

## Usage

1. **User Flow**
   - Users receive a unique link or token
   - Access the scoring interface
   - Compare images using the slider
   - Submit scores for each image
   - Progress through image batches

2. **Admin Flow**
   - Access admin dashboard
   - Monitor user progress
   - Sync images from S3
   - View scoring results

## Security

- JWT-based authentication
- Secure API endpoints
- AWS credentials protection
- XSS prevention
- CORS configuration

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
