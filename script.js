document.addEventListener('DOMContentLoaded', () => {
    // Initialize Lucide icons
    lucide.createIcons();

    // DOM Elements
    const form = document.getElementById('downloadForm');
    const urlInput = document.getElementById('urlInput');
    const pasteButton = document.getElementById('pasteButton');
    const downloadButton = document.getElementById('downloadButton');
    const resultContainer = document.getElementById('resultContainer');
    const notification = document.getElementById('notification');
    const notificationMessage = document.getElementById('notificationMessage');

    // API Configuration - IMPORTANT: Replace these with your actual credentials
    const RAPIDAPI_KEY = '2f5f8f1ed6msha939c8e6949b10ep16c31bjsnb07bb964bbbb'; // Replace with your actual key
    const RAPIDAPI_HOST = 'spotify-downloader9.p.rapidapi.com';

    // Show notification function
    function showNotification(message, type = 'success') {
        notificationMessage.textContent = message;
        notification.classList.remove('translate-x-full');
        notification.classList.add('translate-x-0');
        notification.querySelector('div').className = `px-6 py-4 rounded-lg shadow-lg ${type === 'success' ? 'bg-green-500' : 'bg-red-500'} text-white flex items-center space-x-2`;
        
        // Log error to console for debugging
        if (type === 'error') {
            console.error('Error:', message);
        }
        
        setTimeout(() => {
            notification.classList.remove('translate-x-0');
            notification.classList.add('translate-x-full');
        }, 5000);
    }

    // Validate Spotify URL
    function validateSpotifyUrl(url) {
        const spotifyUrlPattern = /^https:\/\/open\.spotify\.com\/track\/[a-zA-Z0-9]+(\?si=[a-zA-Z0-9]+)?$/;
        return spotifyUrlPattern.test(url);
    }

    // Extract track ID from Spotify URL
    function extractTrackId(url) {
        const match = url.match(/\/track\/([a-zA-Z0-9]+)/);
        return match ? match[1] : null;
    }

    // Handle paste button click
    pasteButton.addEventListener('click', async () => {
        try {
            const text = await navigator.clipboard.readText();
            urlInput.value = text;
            showNotification('URL pasted successfully!');
        } catch (err) {
            showNotification('Failed to paste URL', 'error');
        }
    });

    // Handle form submission
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const url = urlInput.value.trim();

        // Validate URL format
        if (!validateSpotifyUrl(url)) {
            showNotification('Please enter a valid Spotify track URL (e.g., https://open.spotify.com/track/...)', 'error');
            return;
        }

        const trackId = extractTrackId(url);
        if (!trackId) {
            showNotification('Could not extract track ID from URL', 'error');
            return;
        }

        // Show loading state
        downloadButton.disabled = true;
        downloadButton.innerHTML = `
            <i data-lucide="loader-2" class="w-5 h-5 animate-spin"></i>
            Processing...
        `;
        lucide.createIcons();

        try {
            console.log('Making API request for track:', trackId); // Debug log

            const response = await fetch(`https://${RAPIDAPI_HOST}/download/track?id=${trackId}`, {
                method: 'GET',
                headers: {
                    'X-RapidAPI-Key': RAPIDAPI_KEY,
                    'X-RapidAPI-Host': RAPIDAPI_HOST,
                    'Accept': 'application/json'
                }
            });

            // Log response status for debugging
            console.log('API Response Status:', response.status);

            if (response.status === 403) {
                throw new Error('API access forbidden. Please check your API key and subscription.');
            }

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log('API Response Data:', data); // Debug log

            if (data.success) {
                // Update UI with track information
                document.getElementById('trackCover').src = data.metadata.coverUrl || data.metadata.cover;
                document.getElementById('trackTitle').textContent = data.metadata.title;
                document.getElementById('trackArtist').textContent = data.metadata.artists.join(', ');
                document.getElementById('trackAlbum').querySelector('span').textContent = data.metadata.album;
                document.getElementById('trackDate').querySelector('span').textContent = 
                    new Date(data.metadata.releaseDate).toLocaleDateString();
                document.getElementById('downloadLink').href = data.downloadUrl;

                // Show result container
                resultContainer.classList.remove('hidden');
                showNotification('Track found successfully!');
            } else {
                throw new Error(data.message || 'Failed to process track');
            }
        } catch (err) {
            console.error('Error details:', err);
            if (err.message.includes('403')) {
                showNotification('API Authentication Error: Please check your API key and subscription', 'error');
            } else {
                showNotification(`Error: ${err.message}`, 'error');
            }
        } finally {
            // Reset button state
            downloadButton.disabled = false;
            downloadButton.innerHTML = `
                <i data-lucide="download" class="w-5 h-5"></i>
                Download
            `;
            lucide.createIcons();
        }
    });
});
