import math
import requests
import json

# Sends a get request to the url and returns a JSON object of the results
def sendGetRequest(url: str) -> json:
    r = requests.get(url=url)
    return r.json()