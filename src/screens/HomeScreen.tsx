import React, { FC, useState, useCallback, useEffect } from 'react';
import {
	View,
	Text,
	SafeAreaView,
	Image,
	TextInput,
	Platform,
	StatusBar as NativeStatusBar,
	TouchableOpacity,
	ScrollView,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { CalendarDaysIcon, MagnifyingGlassIcon } from 'react-native-heroicons/outline';
import { MapPinIcon } from 'react-native-heroicons/solid';
import { debounce } from 'lodash';
import * as Progress from 'react-native-progress';
import LottieView from 'lottie-react-native';

import { theme } from '../theme';
import { fetchLocations, fetchWeatherForecast } from '../api/weather';
import { getData, storeData } from '../utils/asyncStorage';
import { weatherAnims } from '../constants';

interface Location {
	name: string;
	country: string;
}

interface Weather {
	current?: any;
	location?: Location;
	forecast?: any;
}

const HomeScreen: FC = () => {
	const [showSearch, toggleSearch] = useState<boolean>(false);
	const [locations, setLocations] = useState<Location[]>([]);
	const [weather, setWeather] = useState<Weather>({});
	const [loading, setLoading] = useState<boolean>(true);
	const [forecastState, setForecastState] = useState<String>('Hourly');

	const handleLocation = (loc: Location) => {
		setLocations([]);
		toggleSearch(false);
		setLoading(true);
		fetchWeatherForecast({
			cityName: loc.name,
			days: '3',
		}).then((data: any) => {
			setWeather(data);
			setLoading(false);
			storeData('city', loc.name);
		});
	};

	const handleSearch = (value: string) => {
		// fetch locations
		if (value.length > 2) {
			fetchLocations({ cityName: value }).then((data: Location[]) => {
				setLocations(data);
			});
		}
	};

	useEffect(() => {
		fetchMyWeatherData();
	}, []);

	const fetchMyWeatherData = async () => {
		let myCity = await getData('city');
		let cityName = 'Shiraz';
		if (myCity) cityName = myCity;

		fetchWeatherForecast({
			cityName,
			days: '7',
		}).then((data) => {
			setWeather(data);
			setLoading(false);
		});
	};

	const handleTextDebounce = useCallback(debounce(handleSearch, 1200), []);

	const setCurrAnim = (animText: string, sunsetTime: string): string => {
		if (animText === 'Partly cloudy') {
			// Parse the sunset time (assuming format: "hh:mm AM/PM")
			const sunsetTimeParts: string[] = sunsetTime.split(' ');
			const [sunsetHour, sunsetMinute]: string[] = sunsetTimeParts[0].split(':');
			const isPM: boolean = sunsetTimeParts[1] === 'PM';

			const currentTime: Date = new Date();
			const currentHour: number = currentTime.getHours();
			const currentMinute: number = currentTime.getMinutes();

			// Convert sunset time to 24-hour format
			let sunsetHour24: number = parseInt(sunsetHour, 10);
			if (isPM && sunsetHour24 !== 12) {
				sunsetHour24 += 12;
			} else if (!isPM && sunsetHour24 === 12) {
				sunsetHour24 = 0;
			}

			// Compare times
			if (
				!(currentHour < sunsetHour24 || (currentHour === sunsetHour24 && currentMinute < parseInt(sunsetMinute, 10)))
			) {
				// Current time is after sunset
				animText += ' night';
			}
		}
		return weatherAnims[animText];
	};

	const { current, location } = weather;

	return (
		<View className="flex flex-1 relative">
			<StatusBar style="light" />
			<Image source={require('../assets/bg-home.png')} className="absolute h-full w-full" />
			{loading ? (
				<View className="flex-1 flex-row justify-center items-center">
					<Progress.CircleSnail thickness={10} size={140} color="#0bb3b2" />
				</View>
			) : (
				<SafeAreaView
					className="flex flex-1"
					style={{ marginTop: Platform.OS === 'android' ? NativeStatusBar.currentHeight : 0 }}
				>
					{/* search section */}
					<View style={{ height: '7%' }} className="mx-4 relative z-50">
						<View
							className="flex-row justify-end items-center rounded-full"
							style={{ backgroundColor: showSearch ? theme.bgWhite(0.2) : 'transparent' }}
						>
							{showSearch ? (
								<TextInput
									onChangeText={handleTextDebounce}
									placeholder="Search city"
									placeholderTextColor="lightgray"
									className="pl-6 h-10 pb-1 flex-1 text-base text-white"
								/>
							) : null}
							<TouchableOpacity
								style={{ backgroundColor: theme.bgWhite(0.3) }}
								className="rounded-full p-3 m-1"
								onPress={() => toggleSearch(!showSearch)}
							>
								<MagnifyingGlassIcon size="25" color="white" />
							</TouchableOpacity>
						</View>
						{locations.length > 0 && showSearch ? (
							<View className="absolute w-full bg-gray-300 top-16 rounded-3xl">
								{locations.map((loc, index) => {
									let showBorder = index + 1 != locations.length;
									let borderClass = showBorder ? 'border-b-2 border-b-gray-400' : '';
									return (
										<TouchableOpacity
											onPress={() => handleLocation(loc)}
											key={index}
											className={'flex-row items-center border-0 p-3 px-4 mb-1 ' + borderClass}
										>
											<MapPinIcon size="20" color="gray" />
											<Text className="text-black text-lg ml-2">
												{loc?.name}, {loc?.country}
											</Text>
										</TouchableOpacity>
									);
								})}
							</View>
						) : null}
					</View>
					{/* forecast section */}
					<View className="mx-4 flex justify-around flex-1 mb-2">
						{/* location */}
						<Text className="text-white text-center text-2xl font-bold">
							{location?.name},<Text className="text-lg font-semibold text-gray-300">{' ' + location?.country}</Text>
						</Text>
						<View className="flex-row justify-center">
							{/* weather image */}
							{/* <Image source={{ uri: 'https:' + current?.condition?.icon }} className="w-52 h-52" /> */}
							<LottieView
								source={setCurrAnim(current?.condition?.text, weather?.forecast?.forecastday[0]?.astro?.sunset)}
								loop
								style={{ width: '80%', aspectRatio: 1 }}
								autoPlay
							/>
						</View>
						{/* degree celsius */}
						<View className="space-y-2">
							<Text className="text-center font-bold text-white text-6xl ml-5">{current?.temp_c}°</Text>
							<Text className="text-center text-white text-xl tracking-widest">{current?.condition?.text}</Text>
						</View>
						{/* other stats */}
						<View className="flex-row justify-between mx-4">
							<View className="flex-row space-x-2 items-center">
								<Image source={require('../assets/images/wind.png')} className="h-6 w-6" />
								<Text className="text-white font-semibold text-base">{current?.wind_kph}km</Text>
							</View>
							<View className="flex-row space-x-2 items-center">
								<Image source={require('../assets/images/drop.png')} className="h-6 w-6" />
								<Text className="text-white font-semibold text-base">{current?.humidity}%</Text>
							</View>
							<View className="flex-row space-x-2 items-center">
								<Image source={require('../assets/images/sun.png')} className="h-6 w-6" />
								<Text className="text-white font-semibold text-base">
									{weather?.forecast?.forecastday[0]?.astro?.sunrise}
								</Text>
							</View>
						</View>
					</View>

					<View className="mb-2 space-y-3">
						<TouchableOpacity
							className="flex-row items-center mx-5 space-x-2"
							onPress={() => {
								if (forecastState == 'Hourly') {
									setForecastState('Daily');
								} else {
									setForecastState('Hourly');
								}
							}}
						>
							<CalendarDaysIcon size="22" color="white" />
							<Text className="text-white text-base">
								{forecastState == 'Hourly' ? 'Hourly forecast' : 'Daily forecast'}
							</Text>
						</TouchableOpacity>
						<ScrollView
							horizontal
							contentContainerStyle={{ paddingHorizontal: 15 }}
							showsHorizontalScrollIndicator={false}
						>
							{forecastState == 'Hourly'
								? weather?.forecast?.forecastday
										?.slice(0, 2)[0]
										.hour.concat(weather?.forecast?.forecastday?.slice(0, 2)[1].hour.slice(0, 12))
										.map((item: any, index: number) => {
											const date = new Date(item?.time);

											// Get the hours, and AM/PM
											const hours = date.getHours() % 12 || 12; // Convert 0 to 12
											const ampm = date.getHours() >= 12 ? 'PM' : 'AM';
											// Format the resulting time as a string
											const formattedTime = `${hours} ${ampm}`;
											const currentTime = new Date();
											if (date > currentTime) {
												return (
													<View
														key={index}
														className="flex justify-center items-center w-24 rounded-3xl py-3 space-y-1 mr-4"
														style={{ backgroundColor: theme.bgWhite(0.15) }}
													>
														<Image source={{ uri: 'https:' + item?.condition?.icon }} className="h-11 w-[80px]" />
														<Text className="text-white">{formattedTime}</Text>
														<Text className="text-white text-xl font-semibold">{Math.round(item?.temp_c)}°</Text>
													</View>
												);
											}
										})
								: weather?.forecast?.forecastday?.map((item: any, index: number) => {
										let date = new Date(item?.date);
										let options: Intl.DateTimeFormatOptions = { weekday: 'long' };
										let dayName: string = date.toLocaleDateString('en-US', options);
										dayName.split(',')[0];
										return (
											<View
												key={index}
												className="flex justify-center items-center w-24 rounded-3xl py-3 space-y-1 mr-4"
												style={{ backgroundColor: theme.bgWhite(0.15) }}
											>
												<Image source={{ uri: 'https:' + item?.day?.condition?.icon }} className="h-11 w-[80px]" />
												<Text className="text-white">{dayName}</Text>
												<Text className="text-white text-xl font-semibold">{Math.round(item?.day?.avgtemp_c)}°</Text>
											</View>
										);
								  })}
						</ScrollView>
					</View>
				</SafeAreaView>
			)}
		</View>
	);
};

export default HomeScreen;
