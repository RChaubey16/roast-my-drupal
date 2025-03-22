# Roast my Drupal 🔥

A fun web application that generates hilarious roasts for Drupal.org user profiles using AI. Simply enter your Drupal.org username or profile URL and get ready to be roasted!

## Tech Stack

- [Next.js](https://nextjs.org/) - React framework for web applications
- [Google Gemini API](https://ai.google.dev/) - AI model for generating roasts
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework

## Getting Started

### Prerequisites

- Node.js 18+ installed
- A Google Gemini API key

### Setup

1. Clone the repository

```sh
git clone https://github.com/yourusername/roast-my-drupal.git
cd roast-my-drupal
```

2. Install dependencies 

```sh
npm install
```

3. Create a `.env` file in the root directory and add your Google Gemini API key:

```env
GOOGLE_API_KEY=your_api_key_here
```

4. Run the development server

```sh
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) with your browser

### Production Build

To create a production build:

```sh
npm run build
npm start
```

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
