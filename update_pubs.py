import urllib.request
import json
import xml.etree.ElementTree as ET
import re
import os

def fetch_and_update_publications():
    url = 'https://dblp.org/pid/305/5359.xml'
    
    try:
        # Fetch the XML from DBLP
        response = urllib.request.urlopen(url)
        tree = ET.parse(response)
        root = tree.getroot()
    except Exception as e:
        print(f"Error fetching or parsing XML: {e}")
        return

    papers = []

    # DBLP wraps each publication inside an <r> tag
    for r in root.findall('r'):
        for pub_type in ['article', 'inproceedings']:
            pub = r.find(pub_type)
            if pub is not None:
                
                # 1. Extract and Clean Authors
                authors = []
                for author in pub.findall('author'):
                    name = author.text
                    # DBLP quirk: Remove trailing 4-digit disambiguation numbers (e.g., "Puneet Gupta 0002" -> "Puneet Gupta")
                    clean_name = re.sub(r' \d{4}$', '', name)
                    authors.append(clean_name)
                authors_str = ", ".join(authors)
                
                # 2. Extract Title
                title_node = pub.find('title')
                title = title_node.text if title_node is not None else "Unknown Title"
                
                # 3. Extract Year
                year_node = pub.find('year')
                year = year_node.text if year_node is not None else "Unknown Year"
                
                # 4. Extract Venue (journal for articles, booktitle for conferences)
                venue_node = pub.find('journal') if pub.find('journal') is not None else pub.find('booktitle')
                venue_text = venue_node.text if venue_node is not None else "Unknown Venue"
                
                # 5. Extract Link / DOI (<ee> tag)
                ee_node = pub.find('ee')
                ee = ee_node.text if ee_node is not None else ""
                
                papers.append({
                    "year": year,
                    "authors": authors_str,
                    "title": title,
                    "venue": venue_text,
                    "link": ee
                })

    # Sort papers by year in descending order (Newest first)
    papers = sorted(papers, key=lambda x: str(x.get('year', '0')), reverse=True)

    # Ensure the _data directory exists
    os.makedirs('_data', exist_ok=True)
    
    # Save the cleaned data to Jekyll's _data folder
    output_path = os.path.join('_data', 'publications.json')
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(papers, f, indent=4)
        
    print(f"Successfully processed and sorted {len(papers)} publications from DBLP!")

if __name__ == "__main__":
    fetch_and_update_publications()
