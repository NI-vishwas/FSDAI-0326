import os

import requests
from dotenv import load_dotenv
from langchain.agents import create_agent
from langchain.tools import tool

load_dotenv()


def get_coordinates(city: str, api_key: str) -> dict[str, float] | None:
    url = "https://api.openweathermap.org/geo/1.0/direct"
    response = requests.get(url, params={"q": city, "limit": 1, "appid": api_key})

    if response.status_code != 200:
        return None

    locations = response.json()
    if not locations:
        return None

    location = locations[0]
    return {"lat": location["lat"], "lon": location["lon"]}

def get_weather_impl(city: str) -> str:
    """Get weather for a given city."""
    api_key = os.getenv("WEATHER_API_KEY")
    if not api_key:
        raise ValueError("WEATHER_API_KEY is not set in the environment variables.")

    coordinates = get_coordinates(city, api_key)
    if not coordinates:
        return f"Could not find coordinates for {city}."

    response = requests.get(
        "https://api.openweathermap.org/data/2.5/weather",
        params={
            "lat": coordinates["lat"],
            "lon": coordinates["lon"],
            "units": "metric",
            "appid": api_key,
        },
    )
    
    if response.status_code != 200:
        return f"Error fetching weather data: {response.status_code} - {response.text}"

    data = response.json()
    weather_data = data.get("main", {})
    weather = data.get("weather", [])

    if not weather_data or not weather:
        return "Weather data is unavailable."

    temp_c = weather_data.get("temp", "N/A")
    feels_like = weather_data.get("feels_like", "N/A")
    condition = weather[0].get("description", "N/A")
    location_name = data.get("name", city)
    country = data.get("sys", {}).get("country")
    location = f"{location_name}, {country}" if country else location_name

    return f"The current weather in {location} is {temp_c}°C (feels like {feels_like}°C) with {condition}."

@tool
def get_weather(city: str) -> str:
    """Get weather for a given city."""
    return get_weather_impl(city)

system_prompt = '''
You are a Weather Agent.

Your job is to answer weather-related questions accurately using the `get_weather` tool.

Rules:
1. Always call `get_weather` for weather information.
2. Never guess or fabricate weather data.
3. Use the user's specified location.
4. If the user says "here" or "near me", use available user-location context.
5. If no location is available, ask the user for a city/location.
6. Resolve using the current system date.
7. Clearly distinguish current weather from forecasts.
8. Use the units returned by the tool unless the user explicitly requests another unit.
9. If the tool fails, explain that weather information could not be retrieved rather than guessing.
10. Keep responses concise and easy to understand.
'''

agent = create_agent(
    model="openai:gpt-5.5",
    tools=[get_weather],
    system_prompt=system_prompt,
)

def main() -> None:
    city = input("Enter the city name: ")

    result = agent.invoke(
        {"messages": [{"role": "user", "content": f"What's the weather in {city}?"}]}
    )

    print(result["messages"][-1].content_blocks)


if __name__ == "__main__":
    main()