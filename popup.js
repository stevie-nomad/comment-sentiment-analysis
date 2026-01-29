document.addEventListener('DOMContentLoaded', function() {
    const scrapeBtn = document.getElementById('scrapeBtn');
    const analyzeBtn = document.getElementById('analyzeBtn');
    const downloadBtn = document.getElementById('downloadBtn');
    const platformSelect = document.getElementById('platformSelect');
    const status = document.getElementById('status');
    const progressBar = document.querySelector('.progress');
    const progressBarFill = document.querySelector('.progress-bar-fill');
    const commentCount = document.getElementById('commentCount');
    const sentimentStats = document.querySelector('.sentiment-stats');
    let scrapedComments = [];

    function updateStatus(message, isError = false) {
        status.style.display = 'block';
        status.style.backgroundColor = isError ? '#ffebee' : '#e8f5e9';
        status.style.color = isError ? '#c62828' : '#2e7d32';
        status.textContent = message;
    }

    function updateProgress(count, total) {
        progressBar.style.display = 'block';
        const percentage = (count / total) * 100;
        progressBarFill.style.width = `${percentage}%`;
        commentCount.textContent = count;
        document.querySelector('.stats').style.display = 'block';
    }

    function analyzeSentiment(text) {
        // Simple sentiment analysis based on word matching
        const positiveWords = new Set([
            'good', 'great', 'awesome', 'excellent', 'happy', 'love', 'wonderful', 'fantastic',
            'amazing', 'beautiful', 'best', 'perfect', 'brilliant', 'outstanding', 'helpful',
            'impressive', 'nice', 'thank', 'thanks', 'positive', 'recommend', 'recommended',
            'well', 'super', 'cool', 'interesting', 'enjoyed', 'enjoy', 'likes', 'like'
        ]);

        const negativeWords = new Set([
            'bad', 'terrible', 'awful', 'horrible', 'hate', 'worst', 'poor', 'disappointing',
            'disappointed', 'waste', 'boring', 'useless', 'stupid', 'annoying', 'dislike',
            'unfortunately', 'negative', 'wrong', 'difficult', 'hard', 'problem', 'issue',
            'issues', 'problems', 'fail', 'failed', 'fails', 'failing', 'not good'
        ]);

        const words = text.toLowerCase().match(/\b\w+\b/g) || [];
        let positiveCount = 0;
        let negativeCount = 0;

        words.forEach(word => {
            if (positiveWords.has(word)) positiveCount++;
            if (negativeWords.has(word)) negativeCount++;
        });

        const score = ((positiveCount - negativeCount) / (words.length || 1)) * 100;
        return {
            score: score,
            category: score > 10 ? 'positive' : score < -10 ? 'negative' : 'neutral'
        };
    }

    function updateSentimentDisplay(results) {
        sentimentStats.style.display = 'block';
        
        // Update percentage bars
        document.querySelector('.positive-fill').style.width = `${results.percentages.positive}%`;
        document.querySelector('.neutral-fill').style.width = `${results.percentages.neutral}%`;
        document.querySelector('.negative-fill').style.width = `${results.percentages.negative}%`;

        // Update count labels
        document.querySelector('.positive-count').textContent = 
            `${results.positive} (${results.percentages.positive}%)`;
        document.querySelector('.neutral-count').textContent = 
            `${results.neutral} (${results.percentages.neutral}%)`;
        document.querySelector('.negative-count').textContent = 
            `${results.negative} (${results.percentages.negative}%)`;

        // Update average score
        document.getElementById('averageScore').textContent = results.averageScore.toFixed(1);
    }

    function analyzeComments(comments) {
        let positive = 0;
        let negative = 0;
        let neutral = 0;
        let totalScore = 0;
        
        // Add sentiment analysis to each comment
        const analyzedComments = comments.map(comment => {
            const sentiment = analyzeSentiment(comment.text);
            if (sentiment.category === 'positive') positive++;
            else if (sentiment.category === 'negative') negative++;
            else neutral++;
            totalScore += sentiment.score;
            return { ...comment, sentiment: sentiment.category, sentimentScore: sentiment.score };
        });

        const total = comments.length;
        return {
            positive,
            negative,
            neutral,
            averageScore: totalScore / total,
            percentages: {
                positive: ((positive / total) * 100).toFixed(1),
                negative: ((negative / total) * 100).toFixed(1),
                neutral: ((neutral / total) * 100).toFixed(1)
            },
            analyzedComments
        };
    }

    function downloadAnalysis(results) {
        const headers = ['Author', 'Comment', 'Likes', 'Date', 'Replies', 'Sentiment', 'Sentiment Score'];
        const rows = results.analyzedComments.map(comment => [
            comment.author,
            `"${comment.text.replace(/"/g, '""')}"`,
            comment.likes,
            comment.date,
            comment.replies,
            comment.sentiment,
            comment.sentimentScore.toFixed(2)
        ]);

        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', getFileName());
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    function validateUrl(url, platform) {
        switch (platform) {
            case 'youtube':
                if (!url.includes('youtube.com/watch?v=')) {
                    throw new Error('Please navigate to a YouTube video page');
                }
                break;
            default:
                throw new Error('Unsupported platform');
        }
    }

    function getFileName() {
        const platform = platformSelect.value;
        return `${platform}_comments_analysis.csv`;
    }

    scrapeBtn.addEventListener('click', async () => {
        // Reset UI
        scrapeBtn.disabled = true;
        analyzeBtn.disabled = true;
        progressBar.style.display = 'block';
        progressBarFill.style.width = '0%';
        commentCount.textContent = '0';
        sentimentStats.style.display = 'none';
        scrapedComments = [];
        
        const selectedPlatform = platformSelect.value;
        updateStatus(`Starting to scrape ${selectedPlatform} comments...`);

        try {
            // Get the active tab
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            
            // Validate URL for selected platform
            validateUrl(tab.url, selectedPlatform);

            // Send message to content script
            chrome.tabs.sendMessage(tab.id, { 
                action: 'START_SCRAPING',
                platform: selectedPlatform
            }, response => {
                if (chrome.runtime.lastError) {
                    console.error('Message sending error:', chrome.runtime.lastError);
                    updateStatus('Error: Content script not responding. Please refresh the page and try again', true);
                    scrapeBtn.disabled = false;
                    return;
                }
                if (response && response.status === 'ok') {
                    updateStatus('Connected to content script, starting to scrape...');
                }
            });
        } catch (error) {
            console.error('Scraping error:', error);
            updateStatus(error.message, true);
            scrapeBtn.disabled = false;
        }
    });

    analyzeBtn.addEventListener('click', () => {
        if (scrapedComments.length === 0) {
            updateStatus('No comments to analyze', true);
            return;
        }

        analyzeBtn.disabled = true;
        downloadBtn.disabled = true;
        updateStatus('Analyzing comments...');

        try {
            const results = analyzeComments(scrapedComments);
            updateSentimentDisplay(results);
            updateStatus(`Successfully analyzed ${scrapedComments.length} comments!`);
            analyzeBtn.disabled = false;
            downloadBtn.disabled = false;
            
            // Store results for download
            window.lastAnalysisResults = results;
        } catch (error) {
            updateStatus('Error analyzing comments: ' + error.message, true);
            analyzeBtn.disabled = false;
            downloadBtn.disabled = true;
        }
    });

    downloadBtn.addEventListener('click', () => {
        if (!window.lastAnalysisResults) {
            updateStatus('No analysis results available', true);
            return;
        }

        try {
            downloadAnalysis(window.lastAnalysisResults);
            updateStatus('Analysis results downloaded successfully!');
        } catch (error) {
            updateStatus('Error downloading results: ' + error.message, true);
        }
    });

    // Listen for messages from content script
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (message.action === 'UPDATE_PROGRESS') {
            updateProgress(message.data.current, message.data.total);
        } else if (message.action === 'SCRAPING_COMPLETE') {
            scrapedComments = message.data;
            const platform = platformSelect.value;
            updateStatus(`Successfully scraped ${scrapedComments.length} ${platform} comments! Click 'Analyze Comments' to proceed.`);
            scrapeBtn.disabled = false;
            analyzeBtn.disabled = false;
        } else if (message.action === 'SCRAPING_ERROR') {
            updateStatus(message.error, true);
            scrapeBtn.disabled = false;
        }
    });
}); 