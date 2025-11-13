# Contributing to Respondent-Driven Sampling (RDS) App

Thank you for your interest in contributing to the RDS App. This project is a secure, accessible, and open-source web application that streamlines data collection for homelessness research using Respondent-Driven Sampling (RDS). Developed in collaboration with the University of Washington iSchool and the King County Regional Homelessness Authority (KCRHA), this application enables volunteers and administrators to collect accurate survey data, track referrals, and generate population estimates more effectively than traditional Point-In-Time (PIT) counts.

Your contributions directly support research-driven methodologies and help build a secure, HIPAA and HUD compliant platform for homelessness research.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Code Standards](#code-standards)
- [Testing](#testing)
- [Submitting Changes](#submitting-changes)
- [Project Architecture](#project-architecture)
- [Getting Help](#getting-help)

## Code of Conduct

This project adheres to the [Contributor Covenant Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code and contribute to an open, welcoming, diverse, inclusive, and healthy community. Instances of abusive, harassing, or otherwise unacceptable behavior may be reported to the maintainers responsible for enforcement anonymously through our [reporting form](https://form.jotform.us/70666109215151).

## Getting Started

### Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v22 or higher)
- **npm** (comes with Node.js)
- **Git**
- **MongoDB** (or access to MongoDB Atlas)
- **Twilio Account** (for SMS verification features)

### Fork and Clone

1. **Fork the repository** on GitHub by clicking the "Fork" button
2. **Clone your fork** locally:

```bash
git clone https://github.com/YOUR_USERNAME/respondent-driven-sampling.git
cd respondent-driven-sampling
```

3. **Add the upstream remote** to stay in sync:

```bash
git remote add upstream https://github.com/uw-ssec/respondent-driven-sampling.git
```

### Environment Setup

1. **Set Environment Variables**

Copy the `.env.example` file as `.env` in the `server` directory:

```bash
cp server/.env.example server/.env
```

2. **Configure your `.env` file** with the following required values:
   - `NODE_ENV`: Set to `development` for local development
   - `MONGO_URI`: Your MongoDB connection string (MongoDB Atlas or local instance)
   - `TWILIO_ACCOUNT_SID`: Your Twilio Account SID from the Twilio Console
   - `TWILIO_AUTH_TOKEN`: Your Twilio Auth Token from the Twilio Console
   - `TWILIO_VERIFY_SID`: Your Twilio Verify service ID (starts with "VA", found in Twilio Console under Verify services)
   - `AUTH_SECRET`: A secure random string for JWT token signing

3. **Install Packages**

From the root directory:

```bash
npm install
```

This will install dependencies for both the client and server.

### Running Locally

You will need two separate terminal windows:

**Terminal 1 - Start Backend Server**:

```bash
npm start
```

The backend server will run on port 1234.

**Terminal 2 - Start Frontend Dev Server**:

```bash
cd client
npm run dev
```

The frontend development server will run on port 3000.

Visit the application at `http://localhost:3000`.

## Development Workflow

### Creating a Branch

Always create a new branch for your work:

```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/bug-description
```

**Branch naming conventions**:
- `feature/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation changes
- `refactor/` - Code refactoring
- `test/` - Adding or updating tests

### Making Changes

1. **Make your changes** in the appropriate directory:
   - `client/` - Frontend React code
   - `server/` - Backend Express API
   - `docs/` - Documentation

2. **Test your changes** locally (see [Testing](#testing))

3. **Commit your changes** with clear, descriptive messages:

```bash
git add .
git commit -m "feat: add survey export functionality"
```

### Commit Message Format

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>: <description>

[optional body]

[optional footer]
```

**Types**:
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `style:` - Code style changes (formatting, no logic change)
- `refactor:` - Code refactoring
- `test:` - Adding or updating tests
- `chore:` - Maintenance tasks

**Examples**:
```
feat: add CSV export for survey data
fix: resolve referral code generation collision
docs: update deployment instructions
test: add unit tests for survey controller
```

### Keeping Your Fork Updated

Regularly sync with the upstream repository:

```bash
git fetch upstream
git checkout main
git merge upstream/main
git push origin main
```

## Code Standards

### TypeScript

- Use TypeScript for all new code
- Avoid `any` types - use proper typing
- Export types from appropriate files in `types/` directories

### Code Style

We use ESLint and Prettier for code formatting:

```bash
# Lint your code
npm run lint

# Auto-fix linting issues
npm run lint:fix
```

### Pre-commit Hooks

Pre-commit hooks will automatically run when you commit:
- Code formatting (Prettier)
- Linting (ESLint)
- TypeScript type checking
- JSON validation

If pre-commit fails, fix the issues and commit again.

### Path Aliases

Use path aliases for cleaner imports:

```typescript
// ✅ Good
import { authenticate } from '@/middleware/auth';

// ❌ Avoid
import { authenticate } from '../../../middleware/auth';
```

### File Structure

Follow the domain-driven structure for backend code:

```
server/src/database/{domain}/
  ├── mongoose/          # Mongoose models + hooks
  ├── zod/               # Zod validation schemas
  ├── {domain}.controller.ts    # Business logic
  └── {domain}.utils.ts         # Domain utilities
```

## Testing

### Running Tests

```bash
# Server tests
cd server
npm test                # Run all tests
npm run test:watch      # Watch mode
npm run test:coverage   # Generate coverage report
```

### Writing Tests

- Place tests in `__tests__/` directories alongside source files
- Use descriptive test names
- Test both success and error cases
- Mock external dependencies (database, Twilio, etc.)

**Example test structure**:

```typescript
import { describe, expect, test } from '@jest/globals';

describe('Survey Controller', () => {
  test('should generate unique child survey codes', async () => {
    // Test implementation
  });

  test('should throw error when survey not found', async () => {
    // Test implementation
  });
});
```

### Test Requirements

Contributions should include appropriate test coverage:

- **Bug fixes**: Must include a test that reproduces the bug and verifies the fix
- **New features**: Should include tests covering the main functionality and edge cases
- **Refactoring**: All existing tests must continue to pass without modification
- **API changes**: Must include integration tests for new or modified endpoints

## Submitting Changes

### Before Submitting a Pull Request

Ensure your contribution meets the following requirements:

- [ ] Code follows the project's style guidelines and conventions
- [ ] All tests pass locally (`npm test` in server directory)
- [ ] Pre-commit hooks pass without errors
- [ ] Documentation is updated if applicable
- [ ] Commit messages follow the conventional commits format
- [ ] Changes do not introduce security vulnerabilities
- [ ] Sensitive data is not logged or exposed

### Creating a Pull Request

1. **Push your branch** to your fork:

```bash
git push origin feature/your-feature-name
```

2. **Open a Pull Request** on GitHub from your fork to the `main` branch of `uw-ssec/respondent-driven-sampling`

3. **Complete the PR template** with the following information:
   - **Description**: Provide a clear, concise description of what changed and why it is needed
   - **Related Issues**: Link any related issues using "Resolves #<issue-number>"
   - **Type of change**: Check the appropriate box (bug fix, feature, documentation, refactor, build/CI, or other)
   - **Testing instructions**: Provide steps reviewers can follow to verify functionality
   - **Checklist**: Confirm tests are added/updated and documentation is current
   - **Notes to reviewers**: Include any specific information reviewers should know

4. **Respond to review feedback** promptly and professionally

### Pull Request Review Process

- Project maintainers will review your pull request
- Reviewers may request changes or ask clarifying questions
- Address all feedback and update your PR as needed
- Once approved by maintainers, your PR will be merged
- Your contribution will be recognized in the project README

## Project Architecture

### Repository Structure

This is a monolithic React + Node.js application with the following structure:

- **`client/`**: React frontend application (Vite + TypeScript + Material-UI)
- **`server/`**: Express backend API (TypeScript + MongoDB + Mongoose)
- **`docs/`**: Project documentation (deployment, database migration)
- **`terraform/`**: Infrastructure as code for Azure deployment
- **`.github/`**: GitHub workflows, issue templates, and PR templates

### Key Concepts

#### Domain-Driven Controllers

The backend uses a layered domain structure where controllers contain business logic and are invoked from routes:

```typescript
// ✅ Controller (business logic)
// server/src/database/survey/survey.controller.ts
export async function createSurvey(data: SurveyData) {
  // Business logic here
}

// ✅ Route (HTTP handling)
// server/src/routes/v2/surveys.ts
router.post('/', validate(createSurveySchema), async (req, res) => {
  const survey = await createSurvey(req.body);
  res.status(201).json(survey);
});
```

#### Authentication & Authorization

- JWT tokens are stored in localStorage on the client side
- Authentication middleware verifies JWT tokens and checks user approval status
- CASL (Capability-based Access Control Library) provides role-based and attribute-based permissions
- Users must have `APPROVED` status to access protected routes
- Volunteers can only access surveys they created at their assigned location

#### Survey Referral Chain System

The application implements Respondent-Driven Sampling through a referral chain mechanism:

- Each survey has a unique `surveyCode` identifier
- Surveys may have a `parentSurveyCode` linking to the referring survey
- Upon completion, each survey generates 3 unique `childSurveyCodes` for participant referrals
- This creates a social network sampling structure for population estimation

#### API Versioning

- **v1 routes** (`/api/auth`, `/api/surveys`): Legacy routes, currently being deprecated
- **v2 routes** (`/api/v2/*`): Current API version, use these for all new features
- All v2 routes implement Zod validation middleware for request validation

### Security Considerations

This application handles sensitive homelessness research data and is built with HIPAA and HUD compliance in mind:

- Never log personally identifiable information (PII) or sensitive survey data
- Follow HIPAA and HUD compliance guidelines in all contributions
- Do not modify security headers without maintainer review and approval
- Validate and sanitize all user inputs
- Use parameterized queries (Mongoose provides this by default)
- Report security vulnerabilities responsibly through private channels

## Getting Help

### Resources

- **README**: [README.md](README.md) - Project overview, tech stack, and setup instructions
- **Documentation**: [docs/](docs/) - Deployment guides and database migration instructions
- **Issues**: [GitHub Issues](https://github.com/uw-ssec/respondent-driven-sampling/issues) - Bug reports, feature requests, and discussions

### Asking Questions

Before opening a new issue:

1. Search existing issues to avoid duplicates
2. Review the README and documentation
3. Use the appropriate issue template for your question
4. Provide sufficient context, examples, and environment details
5. Be respectful and patient while awaiting responses

### Issue Templates

The project provides the following issue templates:

- **Bug Report** (`🐞`): For reporting reproducible problems with the software
- **Feature Request** (`✨`): For suggesting new ideas or enhancements
- **Documentation Gap** (`📚`): For reporting missing or unclear documentation
- **Performance Issue**: For reporting performance-related concerns

Select the template that best matches your needs when creating an issue.

## Future Directions

The project maintainers have identified several high-priority features and improvements that are currently out of scope but recommended for future development:

**App Features**:
- Auto-populate location using GPS location coordinates
- Widget for staff to comment on survey responses
- Integration with Homeless Management Information System (HMIS) database system
- Volunteer scheduling dashboard for administrators
- Automated SMS gift card distribution
- Resume unfinished survey feature
- Admin ability to edit survey questions
- Volunteer ability to edit survey responses
- Survey analytics dashboard

**Testing**:
- Dynamic Application Security Testing (DAST)

**User Experience**:
- Step-by-step user training guide
- Setup wizard

These items represent excellent opportunities for meaningful contributions to the project.

## Recognition

Contributors are recognized in the project README. Your contributions help advance homelessness research and support vulnerable populations.

---

**Questions?** Open an issue using the appropriate template or reach out to the maintainers.

**Ready to contribute?** Review open issues and look for those labeled `good first issue` to get started.
