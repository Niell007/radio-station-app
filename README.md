# Radio Station App

A modern web application for managing a radio station, built with Astro and deployed on Cloudflare Pages.

## Project Name and Purpose

**Project Name**: Radio Station App

**Purpose**: The Radio Station App is designed to provide a comprehensive solution for managing a radio station. It includes features for music library management, karaoke system, show scheduling, user authentication, admin dashboard, and playlist management.

## Features

- 🎵 Music Library Management
- 🎤 Karaoke System
- 📝 Show Scheduling
- 👥 User Authentication
- 📊 Admin Dashboard
- 🎶 Playlist Management

## Tech Stack

- **Framework**: [Astro](https://astro.build)
- **UI**: [React](https://reactjs.org) + [Tailwind CSS](://tailwindcss.com) + [Flowbite](https://flowbite.com)
- **Database**: [Cloudflare D1](https://developers.cloudflare.com/d1)
- **Storage**: [Cloudflare R2](https://developers.cloudflare.com/r2)
- **AI Features**: [Cloudflare AI](https://developers.cloudflare.com/ai)
- **Authentication**: JWT + Argon2
- **Deployment**: [Cloudflare Pages](https://pages.cloudflare.com)

## Prerequisites

- Node.js 20.11.1 or higher
- npm 10 or higher
- Cloudflare account with Pages, D1, and R2 enabled
- Git

## Local Development

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/radio-station-app.git
   cd radio-station-app
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Copy environment variables:
   ```bash
   cp .env.example .env
   ```

4. Update environment variables in `.env` with your values

5. Initialize the database:
   ```bash
   npm run init-db
   ```

6. Start the development server:
   ```bash
   npm run dev
   ```

## Deployment

### Automatic Deployment (GitHub Actions)

1. Fork this repository
2. Add the following secrets to your GitHub repository:
   - `CLOUDFLARE_API_TOKEN`
   - `CLOUDFLRE_ACCOUNT_ID`

3. Push to the main branch to trigger deployment

### Manual Deployment

1. Build the project:
   ```bash
   npm run build
   ```

2. Deploy to Cloudflare Pages:
   ```bash
   npm run deploy:production
   ```

### Preview Deployments

For preview deployments:
```bash
npm run deploy:preview
```

## Environment Variables

Required environment variables:

- `CLOUDFLARE_ACCOUNT_ID`: Your Cloudflare account ID
- `CLOUDFLARE_API_TOKEN`: API token with Pages deployment permissions
- `DATABASE_URL`: D1 database connection string
- `R2_ACCOUNT_ID`: R2 storage account ID
- `R2_ACCESS_KEY_ID`: R2 access key
- `R2_SECRET_ACCESS_KEY`: R2 secret key
- `AI_API_TOKEN`: Cloudflare AI API token
- `SESSION_SECRET`: Random string for session encryption

See `.env.example` for all required variables.

## Database Migrations

Run database migrations:
```bash
npm run prisma:migrate
```

## Security Considerations

- **Authentication**: Implemented using JWT and Argon2 for secure password hashing.
- **Authorization**: Role-based access control to ensure users have appropriate permissions.
- **Data Encryption**: Sensitive data such as passwords and session tokens are encrypted.
- **Security Best Practices**: Regular security audits and updates to dependencies.
- **Environment-specific Configurations**: Separate configurations for development, staging, and production environments.

## Performance Requirements

- **Expected Load Capacity**: The application is designed to handle up to 10,000 concurrent users.
- **Response Time Targets**: Average response time should be under 200ms.
- **Scalability Considerations**: The application is built to scale horizontally with the use of Cloudflare's serverless infrastructure.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

MIT License - see LICENSE file for details

## Project Status Report

### Summary

The Radio Station App is currently in active development. Below is a summary of the current status of the project.

### Detailed Project Status Report

For a detailed project status report, please visit the [Project Status Report](src/pages/admin/status-report.astro).

## Generating and Updating the Project Status Report

To generate and update the project status report, follow these steps:

1. Navigate to the `src/pages/admin/status-report.astro` file.
2. Update the executive summary section to provide an overview of current project health, major achievements, and critical concerns.
3. Add a component status dashboard section for each major component, including component details, status indicators, and technical assessment.
4. Add a performance metrics section to display system health and quality metrics.
5. Add an infrastructure status section to display the status of critical systems.
6. Add an action items section to list high priority tasks and risk mitigation strategies.
7. Add an additional notes section to list blockers, resource constraints, external dependencies, and upcoming significant changes.
8. Save the changes and commit them to the repository.
9. Push the changes to the main branch to update the project status report.

## Implementation Plan

### Step 1: Comprehensive Review

Conduct a comprehensive review of the project requirements, existing codebase, system architecture, and known issues.

### Step 2: Identify and Document

Identify and document critical functionality gaps, high-priority bugs, technical improvements, dependencies, and potential bottlenecks.

### Step 3: Prioritized Action Plan

Create a prioritized action plan with specific tasks, estimated effort, dependencies, and success criteria.

### Step 4: Execute the Plan

Execute the implementation plan by addressing critical issues first, following best practices, writing automated tests, and documenting changes.

### Step 5: Validate Work

Validate the work by running comprehensive test suites, performing code reviews, measuring performance metrics, and ensuring all success criteria are met.

### Step 6: Document Blockers and Decisions

Document any blockers or technical decisions made during the implementation.
