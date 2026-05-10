# Comment Sentiment Analyzer Chrome Extension

This Chrome extension analyzes comments on web pages to identify subjects and their associated sentiments. It provides an easy way to understand the overall tone and topics of discussions across different websites.

## Features

- Automatically detects and analyzes comments on web pages
- Identifies the main subject of each comment
- Categorizes sentiments as positive, negative, or neutral
- Groups comments by subject for easy overview
- Real-time analysis with manual refresh option
- Clean and intuitive user interface

## Installation

1. Clone or download this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right corner
4. Click "Load unpacked" and select the directory containing these files
5. The extension icon should appear in your Chrome toolbar

## Usage

1. Navigate to any webpage with comments
2. Click 'Scrape Comments' to scrape the comments.
<img width="1844" height="965" alt="Screenshot1" src="https://github.com/user-attachments/assets/2700e20d-123e-444c-9cb5-0f53fdc21f35" />


  
4. Once the scraping is finished, click 'Analyze Comments'
<img width="1844" height="965" alt="Screenshot2" src="https://github.com/user-attachments/assets/5cea12f1-9d44-4c15-8f5c-043207163a88" />


   
6. The popup will show:
   - Sentiment distribution for each subject whether positive,   negative or neutral.
   - Total number of analyzed comments
<img width="1844" height="965" alt="Screenshot3" src="https://github.com/user-attachments/assets/9bcc443c-e60e-46c4-9e9b-5a185a2029a8" />


   
7. To download the analysis, click 'Download Analysis' as CSV file.

## Technical Details

The extension uses:
- Sentiment analysis for determining comment tone
- Basic natural language processing for subject extraction
- Chrome Storage API for maintaining analysis results
- Content scripts for DOM interaction
- Background scripts for data processing

## Privacy

This extension:
- Only analyzes visible comments on the current webpage
- Does not collect or transmit any personal data
- Processes all data locally in your browser
- Does not store historical data between sessions

## Support

For issues or feature requests, please open an issue in the repository. # comment-sentiment-analysis
