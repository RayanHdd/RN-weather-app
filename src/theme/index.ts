interface Theme {
	bgWhite: (opacity: number) => string;
}

export const theme: Theme = {
	bgWhite: (opacity) => `rgba(255, 255, 255, ${opacity})`,
};
