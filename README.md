# The Tiebreaker

A simple decision support app that helps you compare options using AI-style support for pros and cons, comparison tables, or SWOT analysis.

## How to use

1. Open `index.html` in your browser.
2. Type your decision and add at least two options.
3. Choose an analysis format.
4. Click **Generate analysis**.
5. Optionally click **Save decision** to store the current decision locally.

## Saved decisions

- Saved decisions are stored in your browser's local storage.
- Use the **Load** button to restore a saved decision and options.
- Use **Delete** to remove saved items.

## Local preview

You can also run the app with a local preview server.

```bash
cd d:\Satya-Projects\AI-Tirebreaker
npm install
npm start
```

Then open `http://127.0.0.1:8080` in your browser.

## Notes

- This is a self-contained local app. No server or installation is required if you just open `index.html`.
- It uses an AI-inspired decision helper to generate structured guidance and comparison insights.
