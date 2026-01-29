// Comment scraper for YouTube
let isProcessing = false;
let processedComments = new Set();

// Function to wait for element
function waitForElement(selector, timeout = 30000) {
    return new Promise((resolve, reject) => {
        const startTime = Date.now();
        
        const checkElement = () => {
            const element = document.querySelector(selector);
            if (element) {
                resolve(element);
                return;
            }
            
            if (Date.now() - startTime >= timeout) {
                reject(new Error(`Timeout waiting for element: ${selector}`));
                return;
            }
            
            requestAnimationFrame(checkElement);
        };
        
        checkElement();
    });
}

// Function to scroll to load more comments
async function scrollToLoadComments() {
    return new Promise((resolve) => {
        const commentsSection = document.querySelector('ytd-comments');
        if (!commentsSection) {
            resolve();
            return;
        }

        let previousHeight = 0;
        let noChangeCount = 0;
        const maxNoChange = 3;
        
        const scrollInterval = setInterval(() => {
            commentsSection.scrollIntoView({ behavior: 'smooth', block: 'end' });
            const currentHeight = commentsSection.scrollHeight;
            
            if (currentHeight === previousHeight) {
                noChangeCount++;
                if (noChangeCount >= maxNoChange) {
                    clearInterval(scrollInterval);
                    resolve();
                }
            } else {
                noChangeCount = 0;
                previousHeight = currentHeight;
            }
        }, 1000);
    });
}

// Function to parse comment data
function parseComment(commentElement) {
    try {
        const authorElement = commentElement.querySelector('#author-text span');
        const textElement = commentElement.querySelector('#content-text');
        const likesElement = commentElement.querySelector('#vote-count-middle');
        const dateElement = commentElement.querySelector('#header-author yt-formatted-string.published-time-text');
        const repliesContainer = commentElement.querySelector('#replies ytd-comment-thread-renderer');

        if (!authorElement || !textElement) return null;

        // Clean up likes count
        let likesCount = 0;
        if (likesElement) {
            const likesText = likesElement.textContent.trim();
            if (likesText.includes('K')) {
                likesCount = parseInt(parseFloat(likesText.replace('K', '')) * 1000);
            } else if (likesText.includes('M')) {
                likesCount = parseInt(parseFloat(likesText.replace('M', '')) * 1000000);
            } else {
                likesCount = parseInt(likesText) || 0;
            }
        }

        return {
            author: authorElement.textContent.trim(),
            text: textElement.textContent.trim(),
            likes: likesCount,
            date: dateElement ? dateElement.textContent.trim() : 'Unknown',
            replies: repliesContainer ? repliesContainer.querySelectorAll('ytd-comment-renderer').length : 0
        };
    } catch (error) {
        console.error('Error parsing comment:', error);
        return null;
    }
}

// Main function to scrape comments
async function scrapeComments() {
    if (isProcessing) return;
    isProcessing = true;
    
    try {
        // First, ensure we're on a video page
        if (!window.location.pathname.includes('/watch')) {
            throw new Error('Not a YouTube video page');
        }

        // Wait for comments section to load
        const commentsSection = await waitForElement('ytd-comments');
        if (!commentsSection) {
            throw new Error('Comments section not found');
        }

        // Ensure comments are expanded
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Scroll to comments section to trigger loading
        commentsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Scroll to load more comments
        await scrollToLoadComments();

        const comments = [];
        const commentElements = document.querySelectorAll('ytd-comment-thread-renderer #comment');
        const totalComments = commentElements.length;

        if (totalComments === 0) {
            throw new Error('No comments found. Try refreshing the page.');
        }

        console.log(`Found ${totalComments} comments to process`);

        for (let i = 0; i < commentElements.length; i++) {
            const element = commentElements[i];
            
            // Skip if already processed
            if (processedComments.has(element)) continue;
            
            const comment = parseComment(element);
            if (comment) {
                comments.push(comment);
                processedComments.add(element);
            }

            // Update progress every 10 comments
            if (i % 10 === 0) {
                chrome.runtime.sendMessage({
                    action: 'UPDATE_PROGRESS',
                    data: {
                        current: i + 1,
                        total: totalComments
                    }
                });
            }
        }

        if (comments.length === 0) {
            throw new Error('Failed to parse any comments. Please refresh and try again.');
        }

        // Send final results
        chrome.runtime.sendMessage({
            action: 'SCRAPING_COMPLETE',
            data: comments
        });

    } catch (error) {
        console.error('Scraping error:', error);
        chrome.runtime.sendMessage({
            action: 'SCRAPING_ERROR',
            error: error.message
        });
    } finally {
        isProcessing = false;
    }
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'START_SCRAPING' && request.platform === 'youtube') {
        scrapeComments();
        sendResponse({ status: 'Started scraping' });
    }
    return true;
}); 