#!/usr/bin/env python3
"""
Fetch popular posts from Google Analytics 4 and save to JSON file.
This script is designed to run in GitHub Actions.
"""

import json
import os
from datetime import datetime, timedelta
from google.analytics.data_v1beta import BetaAnalyticsDataClient
from google.analytics.data_v1beta.types import (
    DateRange,
    Dimension,
    Metric,
    RunReportRequest,
)
from google.oauth2.service_account import Credentials


def get_credentials():
    """Get credentials from environment variable."""
    creds_json = os.environ.get('GA_CREDENTIALS')
    if not creds_json:
        raise ValueError("GA_CREDENTIALS environment variable not set")
    
    creds_dict = json.loads(creds_json)
    return Credentials.from_service_account_info(creds_dict)


def fetch_popular_posts(property_id, days=None, limit=None):
    """
    Fetch popular posts from Google Analytics.
    
    Args:
        property_id: GA4 property ID
        days: Number of days to look back (None for all-time)
        limit: Number of posts to return (None for all posts)
    
    Returns:
        List of popular posts with metadata
    """
    credentials = get_credentials()
    client = BetaAnalyticsDataClient(credentials=credentials)
    
    # Calculate date range
    end_date = datetime.now()
    if days:
        start_date = end_date - timedelta(days=days)
    else:
        # All-time data (GA4 typically retains data from 2020 onwards)
        start_date = datetime(2020, 1, 1)
    
    request = RunReportRequest(
        property=f"properties/{property_id}",
        date_ranges=[DateRange(
            start_date=start_date.strftime("%Y-%m-%d"),
            end_date=end_date.strftime("%Y-%m-%d"),
        )],
        dimensions=[
            Dimension(name="pagePath"),
            Dimension(name="pageTitle"),
        ],
        metrics=[
            Metric(name="screenPageViews"),
            Metric(name="averageSessionDuration"),
            Metric(name="engagementRate"),
        ],
        limit=1000,  # Fetch all blog posts (increased limit)
        order_bys=[{
            "metric": {
                "metric_name": "screenPageViews"
            },
            "desc": True
        }],
    )
    
    try:
        response = client.run_report(request)
        
        popular_posts = []
        for row in response.rows:
            page_path = row.dimension_values[0].value
            page_title = row.dimension_values[1].value
            page_views = int(row.metric_values[0].value)
            avg_duration = float(row.metric_values[1].value)
            engagement_rate = float(row.metric_values[2].value) * 100  # Convert to percentage
            
            # Filter for blog posts (adjust pattern based on your URL structure)
            # Assuming blog posts are in /YYYY/MM/DD/ format
            if is_blog_post(page_path):
                popular_posts.append({
                    "url": page_path,
                    "title": page_title,
                    "views": page_views,
                    "avg_duration_seconds": round(avg_duration, 1),
                    "engagement_rate": round(engagement_rate, 2),
                })
                
                # Stop when we have enough posts (if limit is set)
                if limit and len(popular_posts) >= limit:
                    break
        
        return popular_posts
    
    except Exception as e:
        print(f"Error fetching analytics data: {e}")
        # Return empty list on error so site still builds
        return []


def is_blog_post(path):
    """
    Check if the path is a blog post.
    Adjust this function based on your URL structure.
    """
    # Example: /2025/12/07/post-title/
    import re
    pattern = r'^/\d{4}/\d{2}/\d{2}/'
    return bool(re.match(pattern, path))


def save_to_json(data, output_file):
    """Save data to JSON file."""
    output_data = {
        "last_updated": datetime.now().isoformat(),
        "posts": data
    }
    
    # Ensure directory exists
    os.makedirs(os.path.dirname(output_file), exist_ok=True)
    
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(output_data, f, indent=2, ensure_ascii=False)
    
    print(f"Saved {len(data)} popular posts to {output_file}")


def main():
    """Main function."""
    property_id = os.environ.get('GA_PROPERTY_ID')
    if not property_id:
        raise ValueError("GA_PROPERTY_ID environment variable not set")
    
    print("Fetching all-time popular posts from Google Analytics...")
    # Get all-time data (days=None) for all posts (limit=None)
    popular_posts = fetch_popular_posts(property_id, days=None, limit=None)
    
    output_file = '_data/popular_posts.json'
    save_to_json(popular_posts, output_file)
    
    print(f"Done! Fetched {len(popular_posts)} posts with all-time views.")


if __name__ == "__main__":
    main()

