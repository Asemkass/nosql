import requests
from bs4 import BeautifulSoup
import json

BASE_URL = "https://ecco.kz"

def extract_boot_data(page_url):
    response = requests.get(page_url)
    response.raise_for_status()
    soup = BeautifulSoup(response.text, 'html.parser')
    characteristics = {}
    
    for item in soup.select('.product-characteristic .item'):
        name = item.find('span', class_='item-name').text.strip(':')
        value = item.find('span', class_='item-value') or item.find('div', class_='item-value')
        if value:
            characteristics[name] = value.text.strip()
    
    return characteristics

def get_boot_links():
    response = requests.get(BASE_URL + "/catalog/420113/01001/")
    response.raise_for_status()
    soup = BeautifulSoup(response.text, 'html.parser')
    links = []
    
    for a_tag in soup.find_all('a', class_='detail', href=True):
        href = a_tag['href']
        if href.startswith("http"):
            links.append(href)
        else:
            links.append(BASE_URL + href)
    
    return links

if __name__ == "__main__":
    boot_links = get_boot_links()
    boots_data = []
    
    for link in boot_links[:10]:
        try:
            boot_data = extract_boot_data(link)
            boots_data.append(boot_data)
        except Exception as e:
            print(f"Error processing {link}: {e}")
    
    with open('boots.json', 'w', encoding='utf-8') as f:
        json.dump(boots_data, f, ensure_ascii=False, indent=4)

    print("Data successfully saved to boots.json")
