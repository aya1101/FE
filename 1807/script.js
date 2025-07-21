document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const searchView = document.getElementById('search-view');
    const articleView = document.getElementById('article-view');
    const searchForm = document.getElementById('search-form');
    const searchInput = document.getElementById('search-input');
    const suggestionsBox = document.getElementById('suggestions-box');
    const resultsGrid = document.getElementById('search-results-grid');
    const articleContent = document.getElementById('article-content');
    const backButton = document.getElementById('back-to-results-btn');
    const loader = document.getElementById('loader');
    const errorMessage = document.getElementById('error-message');

    let debounceTimer;

    // --- API Logic ---
    const API_BASE_URL = 'https://en.wikipedia.org/w/api.php';

    /**
     * Fetches data from the Wikipedia API.
     * @param {URLSearchParams} params - The parameters for the API call.
     * @returns {Promise<Object>} The JSON data from the API.
     */
    const fetchApi = async (params) => {
        const url = `${API_BASE_URL}?${params.toString()}`;
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Lỗi mạng: ${response.statusText}`);
            }
            const data = await response.json();
            if (data.error) {
                throw new Error(`Lỗi API Wikipedia: ${data.error.info}`);
            }
            return data;
        } catch (error) {
            console.error("API Fetch Error:", error);
            showError(error.message);
            throw error;
        }
    };

    /**
     * Searches for articles.
     * @param {string} query - The search term.
     * @returns {Promise<Array>} An array of article results.
     */
    const searchArticles = async (query) => {
        const params = new URLSearchParams({
            action: 'query',
            generator: 'search',
            gsrsearch: query,
            gsrlimit: 20,
            prop: 'pageimages|extracts',
            exintro: true,
            explaintext: true,
            exlimit: 'max',
            format: 'json',
            origin: '*'
        });
        const data = await fetchApi(params);
        return data.query ? Object.values(data.query.pages) : [];
    };

    /**
     * Gets the full content of a single article.
     * @param {string} title - The title of the article.
     * @returns {Promise<Object>} The article details.
     */
    const getArticle = async (title) => {
        const params = new URLSearchParams({
            action: 'query',
            titles: title,
            prop: 'extracts|pageimages|info',
            pithumbsize: 500,
            inprop: 'url',
            redirects: true,
            format: 'json',
            origin: '*'
        });
        const data = await fetchApi(params);
        return Object.values(data.query.pages)[0];
    };

    // --- UI Logic ---
    const showLoader = () => loader.classList.remove('hidden');
    const hideLoader = () => loader.classList.add('hidden');
    const showError = (message) => {
        errorMessage.textContent = message;
        errorMessage.classList.remove('hidden');
    };
    const hideError = () => errorMessage.classList.add('hidden');
    const clearResults = () => {
        resultsGrid.innerHTML = '';
        suggestionsBox.innerHTML = '';
        suggestionsBox.classList.add('hidden');
    };

    /**
     * Truncates a string if it's longer than a given length.
     * @param {string} text - The text to truncate.
     * @param {number} maxLength - The maximum length.
     * @returns {string} The truncated text.
     */
    const truncateText = (text, maxLength) => {
        if (!text) return 'Không có mô tả.';
        if (text.length <= maxLength) {
            return text;
        }
        return text.slice(0, maxLength) + '...';
    };

    /**
     * Displays search results in a grid.
     * @param {Array} results - An array of article objects.
     */
    const displaySearchResults = (results) => {
        clearResults();
        if (results.length === 0) {
            showError("Không tìm thấy kết quả nào.");
            return;
        }
        results.forEach(result => {
            const card = document.createElement('div');
            card.className = 'result-card';
            card.dataset.title = result.title;
            card.innerHTML = `
                <img src="${result.thumbnail?.source || 'https://placehold.co/600x400/E0E0E0/7F7F7F?text=No+Image'}" alt="${result.title}" onerror="this.onerror=null;this.src='https://placehold.co/600x400/E0E0E0/7F7F7F?text=No+Image';">
                <div class="result-card-content">
                    <h3>${result.title}</h3>
                    <p>${truncateText(result.extract, 150)}</p>
                </div>
            `;
            card.addEventListener('click', () => handleArticleClick(result.title));
            resultsGrid.appendChild(card);
        });
    };

    /**
     * Displays search suggestions.
     * @param {Array} results - An array of article objects.
     */
    const displaySuggestions = (results) => {
        suggestionsBox.innerHTML = '';
        if (results.length === 0) {
            suggestionsBox.classList.add('hidden');
            return;
        }
        results.slice(0, 3).forEach(result => {
            const item = document.createElement('div');
            item.className = 'suggestion-item';
            item.textContent = result.title;
            item.addEventListener('click', () => {
                searchInput.value = result.title;
                suggestionsBox.classList.add('hidden');
                searchForm.requestSubmit();
            });
            suggestionsBox.appendChild(item);
        });
        suggestionsBox.classList.remove('hidden');
    };

    /**
     * Displays the full article content.
     * @param {Object} article - The article object.
     */
    const displayArticle = (article) => {
        articleContent.innerHTML = `
            <h1>${article.title}</h1>
            <a href="${article.fullurl}" target="_blank" rel="noopener noreferrer">Xem trên Wikipedia</a>
            ${article.thumbnail ? `<img src="${article.thumbnail.source}" alt="${article.title}">` : ''}
            <div>${article.extract}</div>
        `;
        searchView.classList.add('hidden');
        articleView.classList.remove('hidden');
        window.scrollTo(0, 0);
    };

    // --- Event Handlers & Main Logic ---
    const handleSearchSubmit = async (event) => {
        event.preventDefault();
        const query = searchInput.value.trim();
        suggestionsBox.classList.add('hidden');

        if (query.length < 3) {
            showError("Vui lòng nhập ít nhất 3 ký tự để tìm kiếm.");
            return;
        }

        hideError();
        clearResults();
        showLoader();

        try {
            const results = await searchArticles(query);
            displaySearchResults(results);
        } catch (error) {
            // Error is already shown by fetchApi
        } finally {
            hideLoader();
        }
    };


    const handleSearchInput = (event) => {
        const query = event.target.value.trim();
        clearTimeout(debounceTimer);
        if (query.length < 3) {
            suggestionsBox.classList.add('hidden');
            return;
        }
        debounceTimer = setTimeout(async () => {
            try {
                const results = await searchArticles(query);
                displaySuggestions(results);
            } catch (error) {
                console.error("Lỗi khi lấy gợi ý:", error);
                suggestionsBox.classList.add('hidden');
            }
        }, 500);
    };

    const handleArticleClick = async (title) => {
        showLoader();
        hideError();
        resultsGrid.innerHTML = ''; // Clear results to show loader centrally

        try {
            const article = await getArticle(title);
            displayArticle(article);
        } catch (error) {
            showError("Không thể tải bài viết. Vui lòng thử lại.");
        } finally {
            hideLoader();
        }
    };

    const handleBackToResults = () => {
        articleView.classList.add('hidden');
        searchView.classList.remove('hidden');
    };

    // --- Event Listeners ---
    searchForm.addEventListener('submit', handleSearchSubmit);
    searchInput.addEventListener('input', handleSearchInput);
    backButton.addEventListener('click', handleBackToResults);

    document.addEventListener('click', (event) => {
        if (!searchForm.contains(event.target)) {
            suggestionsBox.classList.add('hidden');
        }
    });
});
