# Academic Text Processing Application

## Project Overview
This is a full-stack academic text processing application that helps scholars with writing, document analysis, and mathematical content processing. The application features multiple AI LLM integrations for text processing, math formula handling, and document transformation.

## Tech Stack
- **Frontend**: React with TypeScript, Vite, Tailwind CSS, shadcn/ui components
- **Backend**: Express.js with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **AI Integration**: Multiple LLM providers (OpenAI, DeepSeek, Anthropic, Perplexity)
- **Additional Services**: PDF processing, document analysis, email sending

## Project Architecture

### Frontend Structure
- Built with React and Vite
- Uses Wouter for routing
- Tailwind CSS for styling with shadcn/ui components
- TanStack Query for API state management

### Backend Structure
- Express.js server with TypeScript
- RESTful API endpoints in `server/routes.ts`
- Multiple AI service integrations in `server/llm/` directory
- Document processing services in `server/services/` directory
- Database integration with Drizzle ORM

### Key Features
1. **Text Processing**: Multiple LLM providers for academic writing assistance
2. **Document Analysis**: PDF processing and mathematical content extraction
3. **Homework Solving**: Dedicated endpoints for educational content
4. **Chat Interface**: Conversational AI with context document support
5. **File Upload**: Support for various document formats
6. **Email Integration**: Document sharing via SendGrid

## Environment Configuration

### Required API Keys
The application requires several API keys for full functionality:

- `OPENAI_API_KEY`: For OpenAI LLM services
- `DEEPSEEK_API_KEY`: For DeepSeek LLM services (Chinese AI provider)
- `ANTHROPIC_API_KEY`: For Claude AI services
- `PERPLEXITY_API_KEY`: For Perplexity AI services
- `AZURE_OPENAI_KEY` + `AZURE_OPENAI_ENDPOINT`: For Azure OpenAI services
- `SENDGRID_API_KEY`: For email functionality
- `GPTZERO_API_KEY`: For AI content detection
- `MATHPIX_API_KEY`: For mathematical content extraction
- `GOOGLE_API_KEY`: For web search functionality
- `GLADIA_API_KEY`: For transcription services

### Database
- PostgreSQL database is automatically configured via Replit
- Uses Drizzle ORM for database operations
- Schema defined in `shared/schema.ts`

## Security & Migration Notes

### Migration Completed
- ✅ Fixed lazy initialization for all AI service clients to prevent startup failures
- ✅ Implemented proper error handling for missing API keys
- ✅ Database provisioned and configured
- ✅ Project structure follows Replit best practices
- ✅ Client/server separation maintained

### Security Features
- Proper API key validation and error handling
- No hardcoded credentials
- Environment variable configuration for all external services
- Input validation using Zod schemas

## Development Workflow

### Running the Application
The application runs on port 5000 and serves both the API and frontend:
```bash
npm run dev
```

### Available Scripts
- `npm run dev`: Start development server
- `npm run build`: Build for production
- `npm run start`: Start production server
- `npm run check`: TypeScript type checking
- `npm run db:push`: Push database schema changes

## API Endpoints

### Core Processing
- `POST /api/process-text`: Process text with specified LLM
- `POST /api/solve-homework`: Educational content solving
- `POST /api/detect-ai`: AI content detection
- `POST /api/chat`: Conversational AI interface

### File Processing
- `POST /api/upload-file`: Handle document uploads
- Various document processing endpoints for PDFs, images, etc.

### Utilities
- `POST /api/send-email`: Email document sharing
- `GET /api/health`: Health check endpoint

## User Preferences
*To be updated based on user interactions and preferences*

## Recent Changes
- **2025-09-13**: **AI DETECTION FIX**: Verified GPTZero integration working correctly with proper confidence scoring format clarification
- **2025-09-13**: Confirmed all AI detection scores are accurate - decimal format (0.85) corresponds to percentage format (85%) on GPTZero website
- **2025-09-11**: **CRITICAL FIX**: Perplexity (ZHI 4) GPT Bypass functionality fully restored and working
- **2025-09-11**: Enhanced Perplexity integration with improved error handling and proper sonar-pro model configuration
- **2025-09-11**: Added comprehensive debugging infrastructure for all AI provider requests/responses
- **2025-09-11**: Fixed provider routing issues and deprecated API model references across all system components
- **2025-01-15**: LLM provider names updated to ZHI branding: Anthropic→ZHI 1, OpenAI→ZHI 2, DeepSeek→ZHI 3, Perplexity→ZHI 4
- **2025-01-15**: Set Anthropic (ZHI 1) as default provider across all interfaces
- **2025-01-15**: Added discrete "contact us" link at top of page linking to contact@zhisystems.ai
- **2025-01-15**: Fixed dropdown ordering to display ZHI 1, ZHI 2, ZHI 3, ZHI 4 in correct sequence
- **2025-01-15**: Added copy and delete buttons to all three main text boxes in GPT Bypass interface (Input, Writing Style, Humanized Output)
- **2025-01-14**: Project successfully migrated from Replit Agent to standard Replit environment
- **2025-01-14**: Fixed API key initialization issues for production deployment
- **2025-01-14**: Implemented lazy loading for all AI service clients to prevent startup failures
- **2025-01-14**: Database configured and application successfully running on port 5000
- **2025-01-14**: All API keys activated (OpenAI, DeepSeek, Anthropic, Perplexity, Azure, SendGrid, GPTZero, Mathpix, Google, Gladia)
- **2025-01-14**: Database schema successfully pushed and synchronized
- **2025-01-14**: Mathpix OCR functionality fully activated and tested - successfully extracting text and mathematical content from images with 99%+ confidence
- **2025-01-14**: All core application features verified working: text processing, image OCR, AI detection, homework solving, document analysis