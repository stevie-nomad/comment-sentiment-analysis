const { containerBootstrap } = require('@nlpjs/core');
const { SentimentAnalyzer } = require('@nlpjs/sentiment');

class CommentSentimentAnalyzer {
    constructor() {
        this.container = containerBootstrap();
        this.analyzer = new SentimentAnalyzer({ container: this.container });
        this.analyzer.load();
    }

    analyzeSentiment(text) {
        const result = this.analyzer.getSentiment(text);
        // Convert score to percentage (-100% to 100%)
        const percentageScore = result.score * 100;
        return {
            score: percentageScore,
            // Categorize sentiment based on percentage score
            category: percentageScore > 10 ? 'positive' : 
                     percentageScore < -10 ? 'negative' : 'neutral'
        };
    }

    analyzeComments(comments) {
        let positive = 0;
        let negative = 0;
        let neutral = 0;
        let totalScore = 0;

        const analyzedComments = comments.map(comment => {
            const sentiment = this.analyzeSentiment(comment.text);
            
            // Update counters
            if (sentiment.category === 'positive') positive++;
            else if (sentiment.category === 'negative') negative++;
            else neutral++;

            totalScore += sentiment.score;

            return {
                ...comment,
                sentiment
            };
        });

        const total = comments.length;
        return {
            comments: analyzedComments,
            summary: {
                positive,
                negative,
                neutral,
                total,
                averageScore: totalScore / total,
                percentages: {
                    positive: ((positive / total) * 100).toFixed(1),
                    negative: ((negative / total) * 100).toFixed(1),
                    neutral: ((neutral / total) * 100).toFixed(1)
                }
            }
        };
    }
}

module.exports = CommentSentimentAnalyzer; 