#!/bin/zsh

cd "$(dirname "$0")/webapp" || exit 1

if ! command -v npm >/dev/null 2>&1; then
  echo "Node.js and npm are required. Install Node.js 24 LTS, then try again."
  read -r "?Press Return to close."
  exit 1
fi

if [ ! -d node_modules ]; then
  echo "Preparing the local prototype for its first run…"
  npm install || exit 1
fi

echo "Starting How Risky Is Today? — local prototype"
echo "Open http://localhost:3000 in your browser when the app is ready."
echo "Without Supabase credentials, the application uses its local prototype data."
npm run dev
