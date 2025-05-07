# Scratch Tutorial Maker

A Next.js application that helps teachers and educators create tutorials from Scratch projects. The application can:

1. Import Scratch projects (.sb3 files)
2. Analyze projects using AI to identify key concepts and complexity
3. Generate step-by-step tutorials based on the project analysis

## Features

- **Project Import**: Upload Scratch (.sb3) files
- **Project Analysis**: Use OpenAI to analyze projects and understand their structure
- **Tutorial Generation**: Create step-by-step tutorials based on project analysis
- **Combined View**: View analysis and tutorial steps in a single unified interface

## Getting Started

1. **Prerequisites**
   - Node.js 18.18.0+ or 20+
   - npm or yarn
   - OpenAI API Key

2. **Installation**
   ```bash
   # Clone the repository
   git clone [repository-url]
   
   # Navigate to the project directory
   cd ScratchTutorialMaker
   
   # Install dependencies
   npm install
   ```

3. **Set Up Environment Variables**
   Create a `.env.local` file in the project root:
   ```
   # OpenAI API Key - Get one at https://platform.openai.com/api-keys
   OPENAI_API_KEY=your_openai_api_key_here
   ```

4. **Development**
   ```bash
   # Start the development server
   npm run dev
   ```
   Open http://localhost:9002 in your browser to see the application.

## OpenAI Integration

This project uses OpenAI's GPT models to analyze Scratch projects and generate tutorials. To use this feature:

1. Create an account at [OpenAI](https://platform.openai.com/)
2. Generate an API key in your account dashboard
3. Add the API key to your `.env.local` file

The application uses:
- GPT-4o by default (you can change the model in `src/services/llm-provider.ts`)
- Context optimization to reduce token usage
- Fallback mechanisms for error handling

For detailed information about the LLM integration and how to extend it, see [docs/llm-integration.md](./docs/llm-integration.md).

## Tech Stack

- Next.js 15
- React 18
- TailwindCSS
- shadcn/ui components
- JSZip (for .sb3 file handling)
- OpenAI API
- Firebase (authentication and storage)

## Troubleshooting

### OpenAI API Key Issues

If you're encountering errors related to the OpenAI API key:

1. Make sure your `.env.local` file contains the API key with the `NEXT_PUBLIC_` prefix:
   ```
   NEXT_PUBLIC_OPENAI_API_KEY=your_openai_api_key_here
   ```

2. After updating the `.env.local` file, restart your development server:
   ```bash
   npm run dev
   ```

3. Since the API calls are made from the browser, the environment variable must be prefixed with `NEXT_PUBLIC_` for Next.js to expose it to client-side code.

> **Security Note**: In a production environment, you should not make API calls directly from the browser. Instead, create a server API route to handle OpenAI requests, which would use a non-public environment variable.
