# Harts Digital Hub

A modern React application for Harts Company Limited with AI-powered chatbot integration.

## Features

- ⚛️ React 18 with Vite
- 🤖 AI Chatbot powered by OpenAI
- 🎨 Modern UI with responsive design
- 🚀 Ready for Vercel deployment

## Getting Started

### Prerequisites

- Node.js 16+ installed
- OpenAI API key ([Get one here](https://platform.openai.com/api-keys))

### Installation

1. Clone the repository
```bash
git clone <your-repo-url>
cd hartsdigitalhub
```

2. Install dependencies
```bash
npm install
```

3. Set up environment variables
- Copy `.env.example` to `.env`
- Add your OpenAI API key to `.env`:
```
OPENAI_API_KEY=sk-your-key-here
```

4. Run the development server
```bash
npm run dev
```

Visit `http://localhost:5173` to see your app!

## AI Chatbot Setup

The chatbot is integrated and ready to use. To activate it:

1. **Get an OpenAI API Key:**
   - Go to [https://platform.openai.com/api-keys](https://platform.openai.com/api-keys)
   - Create a new API key
   - Copy the key

2. **Add the key to your environment:**
   - Open `.env` file
   - Replace `your_openai_api_key_here` with your actual key

3. **For Vercel deployment:**
   - Go to your Vercel project settings
   - Navigate to "Environment Variables"
   - Add `OPENAI_API_KEY` with your key value

## Deployment to Vercel

### Option 1: Using Vercel CLI
```bash
npm install -g vercel
vercel
```

### Option 2: Using GitHub
1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Import your repository
4. Add environment variables in project settings
5. Deploy!

**Important:** Don't forget to add your `OPENAI_API_KEY` environment variable in Vercel's dashboard.

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

## Technologies Used

- **React 18** - UI library
- **Vite** - Build tool
- **OpenAI API** - AI chatbot intelligence
- **Vercel** - Hosting platform

## Support

For questions or issues, contact Harts Company Limited.

## License

Copyright © 2026 Harts Company Limited
