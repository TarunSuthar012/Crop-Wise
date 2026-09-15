import Constants from 'expo-constants'

const extra =
	Constants.expoConfig?.extra ||
	Constants.manifest?.extra ||
	{}

const env = {
	SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL,
	SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
	OPENWEATHER_API_KEY: process.env.EXPO_PUBLIC_OPENWEATHER_API_KEY,
	MANDI_API_BASE: process.env.EXPO_PUBLIC_MANDI_API_BASE,
}

export const config = {
	...extra,
	...Object.fromEntries(Object.entries(env).filter(([, v]) => Boolean(v))),
}
