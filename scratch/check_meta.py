import requests
from bs4 import BeautifulSoup

urls = [
    "https://www.jejutime.com/",
    "https://www.jejuqq.com/",
    "https://www.jejujapan.com/"
]

for url in urls:
    print(f"\n--- {url} ---")
    try:
        r = requests.get(url, timeout=10)
        soup = BeautifulSoup(r.text, 'html.parser')
        
        for meta in soup.find_all('meta'):
            prop = meta.get('property') or meta.get('name')
            if prop and ('og:' in prop or 'twitter:' in prop):
                print(f"{prop}: {meta.get('content')}")
    except Exception as e:
        print(f"Error: {e}")
