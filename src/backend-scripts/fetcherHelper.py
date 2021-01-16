import math
import requests
import json

# Sends a get request to the url and returns a JSON object of the results
def send_get_request(url: str) -> json:
    r = requests.get(url=url)
    return r.json()