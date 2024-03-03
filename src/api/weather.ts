// Import necessary modules
import axios from 'axios';

const WEATHER_API_KEY = process.env.EXPO_PUBLIC_WEATHER_API_KEY;
// Define the forecast endpoint
const forecastEndpoint = (params: { cityName: string; days: string }) =>
	`http://api.weatherapi.com/v1/forecast.json?key=${WEATHER_API_KEY}&q=${params.cityName}&days=${params.days}&aqi=no&alerts=no`;

// Define the locations endpoint
const locationsEndpoint = (params: { cityName: string }) =>
	`http://api.weatherapi.com/v1/search.json?key=${WEATHER_API_KEY}&q=${params.cityName}`;

// Make an API call
const apiCall = async (endpoint: string) => {
	const options = {
		method: 'GET',
		url: endpoint,
	};
	try {
		const response = await axios.request(options);
		return response.data;
	} catch (err) {
		console.log('error: ', err);
		return null;
	}
};

// Export functions for fetching weather forecast and locations
export const fetchWeatherForecast = (params: { cityName: string; days: string }) => {
	return apiCall(forecastEndpoint(params));
};

export const fetchLocations = (params: { cityName: string }) => {
	return apiCall(locationsEndpoint(params));
};
