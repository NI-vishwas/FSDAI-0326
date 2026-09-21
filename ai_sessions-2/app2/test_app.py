import unittest
from unittest.mock import Mock

import app


def call_get_weather(city: str) -> str:
	return app.get_weather.func(city)


class GetWeatherTests(unittest.TestCase):
	def test_get_weather_raises_when_api_key_missing(self):
		with unittest.mock.patch.dict("os.environ", {}, clear=True):
			with self.assertRaisesRegex(ValueError, "WEATHER_API_KEY is not set"):
				call_get_weather("London")

	def test_get_weather_returns_formatted_weather(self):
		geocode_response = Mock()
		geocode_response.status_code = 200
		geocode_response.json.return_value = [{"lat": 51.5072, "lon": -0.1276}]

		weather_response = Mock()
		weather_response.status_code = 200
		weather_response.json.return_value = {
			"coord": {"lon": 76.6554, "lat": 12.3052},
			"weather": [{"description": "heavy intensity rain"}],
			"main": {"temp": 24.07, "feels_like": 24.73},
			"name": "Mysore",
			"sys": {"country": "IN"},
		}

		responses = [geocode_response, weather_response]

		def fake_get(url, params=None):
			return responses.pop(0)

		with unittest.mock.patch.dict("os.environ", {"WEATHER_API_KEY": "test-key"}, clear=True):
			with unittest.mock.patch.object(app.requests, "get", side_effect=fake_get) as mocked_get:
				result = call_get_weather("London")

		self.assertEqual(
			result,
			"The current weather in Mysore, IN is 24.07°C (feels like 24.73°C) with heavy intensity rain.",
		)
		self.assertEqual(mocked_get.call_count, 2)
		self.assertEqual(mocked_get.call_args_list[0].args[0], "https://api.openweathermap.org/geo/1.0/direct")
		self.assertEqual(mocked_get.call_args_list[0].kwargs["params"], {"q": "London", "limit": 1, "appid": "test-key"})
		self.assertEqual(mocked_get.call_args_list[1].args[0], "https://api.openweathermap.org/data/2.5/weather")
		self.assertEqual(
			mocked_get.call_args_list[1].kwargs["params"],
			{"lat": 51.5072, "lon": -0.1276, "units": "metric", "appid": "test-key"},
		)

	def test_get_weather_returns_error_message_for_non_200(self):
		geocode_response = Mock()
		geocode_response.status_code = 200
		geocode_response.json.return_value = [{"lat": 48.8566, "lon": 2.3522}]

		weather_response = Mock()
		weather_response.status_code = 500
		weather_response.text = "Internal Server Error"

		responses = [geocode_response, weather_response]

		def fake_get(url, params=None):
			return responses.pop(0)

		with unittest.mock.patch.dict("os.environ", {"WEATHER_API_KEY": "test-key"}, clear=True):
			with unittest.mock.patch.object(app.requests, "get", side_effect=fake_get):
				result = call_get_weather("Paris")

		self.assertEqual(result, "Error fetching weather data: 500 - Internal Server Error")

	def test_get_weather_returns_unavailable_when_payload_is_incomplete(self):
		geocode_response = Mock()
		geocode_response.status_code = 200
		geocode_response.json.return_value = [{"lat": 52.52, "lon": 13.405}]

		weather_response = Mock()
		weather_response.status_code = 200
		weather_response.json.return_value = {"coord": {"lat": 52.52, "lon": 13.405}, "main": {}, "weather": []}

		responses = [geocode_response, weather_response]

		def fake_get(url, params=None):
			return responses.pop(0)

		with unittest.mock.patch.dict("os.environ", {"WEATHER_API_KEY": "test-key"}, clear=True):
			with unittest.mock.patch.object(app.requests, "get", side_effect=fake_get):
				result = call_get_weather("Berlin")

		self.assertEqual(result, "Weather data is unavailable.")
