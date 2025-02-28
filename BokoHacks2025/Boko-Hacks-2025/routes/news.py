from flask import Blueprint, render_template, jsonify, request
import requests
import json

news_bp = Blueprint('news', __name__, url_prefix='/apps/news')

# Base URL for the News API
NEWS_API_BASE_URL = "https://saurav.tech/NewsAPI"

# Mapping of our categories to API categories
CATEGORY_MAPPING = {
    'business': 'business',
    'technology': 'technology',
    'world': 'general',  # mapping 'world' to 'general' as that's typically how news APIs handle it
}

DEFAULT_COUNTRY = 'us'  # or whatever default country code you want to use

INTERNAL_NEWS = [
    {
        "title": "CONFIDENTIAL: Security Breach Report Q3",
        "description": "Details of recent security incidents affecting customer data. For internal review only.",
        "url": "#internal-only",
        "publishedAt": "2025-01-15T08:30:00Z",
        "urlToImage": ""
    },
    {
        "title": "CONFIDENTIAL: Upcoming Product Launch",
        "description": "Specifications for our next-gen product launch in Q2. Contains proprietary information.",
        "url": "#internal-only",
        "publishedAt": "2025-02-01T10:15:00Z",
        "urlToImage": ""
    },
    {
        "title": "CONFIDENTIAL: Internal API Credentials",
        "description": "API_KEY: 5x6hdPQmSK2aT9E3bL8nZ7yRfV4wX1  ADMIN_KEY: jKq2P8zX5sW7vT1yR4aB9nL6cE3hG",
        "url": "#internal-only",
        "publishedAt": "2025-01-30T14:45:00Z",
        "urlToImage": ""
    }
]

@news_bp.route('/')
def news_page():
    """Render the news page"""
    return render_template('news.html')

def get_news_items(category='general'):
    """Fetch news items from the API"""
    try:
        # Map the category to API category
        api_category = CATEGORY_MAPPING.get(category, 'general')
        
        # Construct the API URL
        url = f"{NEWS_API_BASE_URL}/top-headlines/category/{api_category}/{DEFAULT_COUNTRY}.json"
        
        # Make the request
        response = requests.get(url, timeout=10)
        response.raise_for_status()  # Raise an exception for bad status codes
        
        # Parse the response
        data = response.json()
        
        # Transform the data into our format
        news_items = []
        for article in data.get('articles', []):
            news_items.append({
                'title': article.get('title', ''),
                'content': article.get('description', ''),
                'imageUrl': article.get('urlToImage', ''),
                'readMoreUrl': article.get('url', ''),
                'date': article.get('publishedAt', '')
            })
        
        # Add internal news if appropriate
        if category == 'internal':
            news_items.extend(INTERNAL_NEWS)
            
        return news_items
        
    except requests.RequestException as e:
        print(f"API Request Error: {str(e)}")  # Log the error
        return []
    except Exception as e:
        print(f"Unexpected Error: {str(e)}")  # Log the error
        return []

@news_bp.route('/fetch')
def fetch_news():
    try:
        category = request.args.get('category', 'business')
        search_term = request.args.get('search', '').lower()
        
        # Get news items for the specified category
        news_items = get_news_items(category)
        
        # Filter by search term if provided
        if search_term:
            filtered_items = []
            for item in news_items:
                title = (item.get('title', '') or '').lower()
                content = (item.get('content', '') or '').lower()
                if search_term in title or search_term in content:
                    filtered_items.append(item)
            news_items = filtered_items
        
        return jsonify({
            'success': True,
            'data': news_items,
            'source': {
                'category': category,
                'search': search_term
            }
        })
        
    except Exception as e:
        print(f"Error in fetch_news: {str(e)}")  # Log the error
        return jsonify({
            'success': False,
            'error': str(e),
            'data': []
        }), 500
