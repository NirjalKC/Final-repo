let refreshInterval = null;

function initializeApp() {
    console.log("News app initialized");
    initializeSearch();
    setupEventListeners();
    
    // Load settings and apply them
    const settings = loadSettings();
    applySettings(settings);
    
    // Set active category based on saved default
    setActiveCategory(settings.defaultCategory);
    
    // Fetch news for the default category
    fetchNews(settings.defaultCategory);
}

function setupEventListeners() {
    const filterButtons = document.querySelectorAll('.filter-btn');
    filterButtons.forEach(button => {
        button.addEventListener('click', function() {
            const category = this.getAttribute('data-category');
            setActiveCategory(category);
            fetchNews(category);
            
            // Save this as the new default category
            const settings = loadSettings();
            settings.defaultCategory = category;
            saveSettings(settings);
        });
    });

    // Add settings button event listener
    const settingsBtn = document.getElementById('settings-button');
    if (settingsBtn) {
        settingsBtn.addEventListener('click', openSettings);
    }

    // Add overlay click listener
    const overlay = document.getElementById('settings-overlay');
    if (overlay) {
        overlay.addEventListener('click', closeSettings);
    }
}

function setActiveCategory(category) {
    const filterButtons = document.querySelectorAll('.filter-btn');
    filterButtons.forEach(btn => {
        if (btn.getAttribute('data-category') === category) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
}

function initializeSearch() {
    const searchButton = document.getElementById('search-button');
    const searchInput = document.getElementById('search-news');

    if (!searchButton || !searchInput) {
        console.error('Search elements not found');
        return;
    }

    searchButton.onclick = function() {
        const searchTerm = searchInput.value.trim();
        const activeCategory = document.querySelector('.filter-btn.active').getAttribute('data-category');
        
        // If search is empty, just fetch the current category's news
        if (!searchTerm) {
            fetchNews(activeCategory);
            return;
        }

        const newsContainer = document.getElementById('news-root');
        const newsList = newsContainer.querySelector('.news-list');
        
        // Show loading state
        newsList.innerHTML = '<div class="loading">Searching news...</div>';
        
        // Include both search term and category in the API call
        const apiUrl = `/apps/news/fetch?category=${activeCategory}&search=${encodeURIComponent(searchTerm)}`;
        
        console.log(`Searching news with term: ${searchTerm} in category: ${activeCategory}`);
        
        fetch(apiUrl)
            .then(response => {
                if (!response.ok) {
                    return response.json().then(err => {
                        throw new Error(err.error || `HTTP error! Status: ${response.status}`);
                    });
                }
                return response.json();
            })
            .then(data => {
                if (!data.success) {
                    throw new Error(data.error || 'Failed to search news');
                }
                // Make sure we're passing the correct data structure to renderNews
                renderNews(data.data || []);
            })
            .catch(error => {
                console.error('Error searching news:', error);
                newsList.innerHTML = `
                    <div class="error-message">
                        Failed to search news. Please try again later.
                        <br><small>${error.message}</small>
                    </div>
                `;
            });
    };

    // Add Enter key support
    searchInput.onkeypress = function(e) {
        if (e.key === 'Enter') {
            searchButton.click();
        }
    };

    // Handle empty search
    searchInput.addEventListener('input', function() {
        if (this.value.trim() === '') {
            const activeCategory = document.querySelector('.filter-btn.active').getAttribute('data-category');
            fetchNews(activeCategory);
        }
    });
}

function fetchNews(category, customUrl = null) {
    console.log('Fetching news for category:', category);
    const newsContainer = document.getElementById('news-root');
    const newsList = newsContainer.querySelector('.news-list');
    
    // Show loading state
    if (newsList) {
        newsList.innerHTML = '<div class="loading">Loading news...</div>';
    }

    // Update the last refresh time
    updateRefreshTime();
    
    // Build the API URL
    let apiUrl = `/apps/news/fetch?category=${category}`;
    if (customUrl) {
        apiUrl += `&api_url=${encodeURIComponent(customUrl)}`;
    }
    
    console.log(`Fetching news from: ${apiUrl}`);
    
    fetch(apiUrl)
        .then(response => {
            if (!response.ok) {
                return response.json().then(err => {
                    throw new Error(err.error || `HTTP error! Status: ${response.status}`);
                });
            }
            return response.json();
        })
        .then(data => {
            if (!data.success) {
                throw new Error(data.error || 'Failed to fetch news');
            }
            // Make sure we're passing the correct data structure
            renderNews(data.data || []);
        })
        .catch(error => {
            console.error('Error fetching news:', error);
            newsList.innerHTML = `
                <div class="error-message">
                    Failed to load news. Please try again later.
                    <br><small>${error.message}</small>
                </div>
            `;
        });
}

function renderNews(articles) {
    console.log('Rendering news with data:', articles); // Add this for debugging
    const newsList = document.querySelector('.news-list');
    
    if (!Array.isArray(articles) || articles.length === 0) {
        newsList.innerHTML = '<div class="no-results">No news items found.</div>';
        return;
    }

    newsList.innerHTML = articles.map(item => `
        <div class="news-item">
            <div class="news-title">${item.title || 'Untitled'}</div>
            ${item.urlToImage || item.imageUrl ? `
                <div class="news-image">
                    <img src="${item.urlToImage || item.imageUrl}" alt="${item.title}" onerror="this.style.display='none'">
                </div>
            ` : ''}
            <div class="news-content">${item.description || item.content || 'No content available'}</div>
            <div class="news-meta">
                <span>${new Date(item.publishedAt || item.date).toLocaleDateString()}</span>
                ${item.url || item.readMoreUrl ? `
                    <a href="${item.url || item.readMoreUrl}" target="_blank" class="read-more">Read More</a>
                ` : ''}
            </div>
        </div>
    `).join('');
}

function cleanupApp() {
    console.log('News app cleanup');
}

window.initializeApp = initializeApp;
window.cleanupApp = cleanupApp;

document.addEventListener('DOMContentLoaded', function() {
    if (document.getElementById('news-root')) {
        initializeApp();
    }
});

function openSettings() {
    const modal = document.getElementById('settings-modal');
    const overlay = document.getElementById('settings-overlay');
    if (modal && overlay) {
        // Load current settings into form
        const settings = loadSettings();
        
        const refreshSelect = document.getElementById('refresh-interval');
        const categorySelect = document.getElementById('default-category');
        
        if (refreshSelect) refreshSelect.value = settings.refreshInterval;
        if (categorySelect) categorySelect.value = settings.defaultCategory;

        modal.style.display = 'block';
        overlay.style.display = 'block';
    }
}

function closeSettings() {
    const modal = document.getElementById('settings-modal');
    const overlay = document.getElementById('settings-overlay');
    if (modal && overlay) {
        modal.style.display = 'none';
        overlay.style.display = 'none';
    }
}

function saveSettings() {
    const refreshIntervalSelect = document.getElementById('refresh-interval');
    const defaultCategorySelect = document.getElementById('default-category');

    const settings = {
        refreshInterval: refreshIntervalSelect ? refreshIntervalSelect.value : '0',
        defaultCategory: defaultCategorySelect ? defaultCategorySelect.value : 'business'
    };

    localStorage.setItem('newsSettings', JSON.stringify(settings));
    
    // Apply the new settings
    applySettings(settings);
    
    // Close modal
    closeSettings();
    
    // Refresh news with new settings
    fetchNews(settings.defaultCategory);
}

function loadSettings() {
    const defaultSettings = {
        refreshInterval: '0',
        defaultCategory: 'business'
    };

    try {
        const savedSettings = localStorage.getItem('newsSettings');
        return savedSettings ? JSON.parse(savedSettings) : defaultSettings;
    } catch (error) {
        console.error('Error loading settings:', error);
        return defaultSettings;
    }
}

function applySettings(settings) {
    // Clear existing interval if any
    if (refreshInterval) {
        clearInterval(refreshInterval);
        refreshInterval = null;
    }

    // Set up new refresh interval if needed
    const interval = parseInt(settings.refreshInterval);
    if (interval > 0) {
        refreshInterval = setInterval(() => {
            const activeCategory = document.querySelector('.filter-btn.active').getAttribute('data-category');
            console.log(`Auto-refreshing news for category: ${activeCategory}`);
            fetchNews(activeCategory);
        }, interval);
        
        console.log(`Auto-refresh set to ${interval/1000} seconds`);
    }

    // Set the active category
    setActiveCategory(settings.defaultCategory);
}

function updateRefreshTime() {
    const timeElement = document.getElementById('update-time');
    if (timeElement) {
        const now = new Date();
        timeElement.textContent = now.toLocaleTimeString();
    }
}

window.openSettings = openSettings;
window.closeSettings = closeSettings;
window.saveSettings = saveSettings;
