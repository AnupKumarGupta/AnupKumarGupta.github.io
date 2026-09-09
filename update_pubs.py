import urllib.request
import json
import xml.etree.ElementTree as ET
import re
import os

URL = 'https://dblp.org/pid/305/5359.xml'
LOCAL_FALLBACK = 'dblp.xml'  # place your manually downloaded file here

def get_xml_root():
    """Try fetching from DBLP; fall back to a manually downloaded local file."""
    # 1. Try the live URL
    try:
        req = urllib.request.Request(
            URL,
            headers={
                'User-Agent': (
                    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) '
                    'AppleWebKit/537.36 (KHTML, like Gecko) '
                    'Chrome/124.0.0.0 Safari/537.36'
                )
            }
        )
        with urllib.request.urlopen(req, timeout=15) as response:
            data = response.read()

        if not data.lstrip().startswith(b'<?xml') and not data.lstrip().startswith(b'<'):
            raise ValueError("Response doesn't look like XML (likely a bot-check page).")

        root = ET.fromstring(data)
        print("Fetched publications from live DBLP URL.")
        return root

    except Exception as e:
        print(f"Could not fetch live URL ({e}). Falling back to local file...")

    # 2. Fall back to local manually-downloaded file
    if not os.path.exists(LOCAL_FALLBACK):
        raise FileNotFoundError(
            f"Live fetch failed and no local fallback file found at '{LOCAL_FALLBACK}'. "
            f"Please manually download the XML from {URL} and save it as '{LOCAL_FALLBACK}'."
        )

    tree = ET.parse(LOCAL_FALLBACK)
    print(f"Loaded publications from local file: {LOCAL_FALLBACK}")
    return tree.getroot()


def fetch_and_update_publications():
    try:
        root = get_xml_root()
    except Exception as e:
        print(f"Error fetching or parsing XML: {e}")
        return

    papers = []

    for r in root.findall('r'):
        for pub_type in ['article', 'inproceedings']:
            pub = r.find(pub_type)
            if pub is not None:

                authors = []
                for author in pub.findall('author'):
                    name = author.text
                    clean_name = re.sub(r' \d{4}$', '', name)
                    authors.append(clean_name)
                authors_str = ", ".join(authors)

                title_node = pub.find('title')
                title = title_node.text if title_node is not None else "Unknown Title"

                year_node = pub.find('year')
                year = year_node.text if year_node is not None else "Unknown Year"

                venue_node = pub.find('journal') if pub.find('journal') is not None else pub.find('booktitle')
                venue_text = venue_node.text if venue_node is not None else "Unknown Venue"

                ee_node = pub.find('ee')
                ee = ee_node.text if ee_node is not None else ""

                papers.append({
                    "year": year,
                    "authors": authors_str,
                    "title": title,
                    "venue": venue_text,
                    "link": ee
                })

    papers = sorted(papers, key=lambda x: str(x.get('year', '0')), reverse=True)

    os.makedirs('_data', exist_ok=True)
    output_path = os.path.join('_data', 'publications.json')
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(papers, f, indent=4)

    print(f"Successfully processed and sorted {len(papers)} publications from DBLP!")


if __name__ == "__main__":
    fetch_and_update_publications()