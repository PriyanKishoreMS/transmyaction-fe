import { useAuth } from "../contexts/AuthContext";

const prod = true;

export const BASE_URL = prod
	? "https://api-txns.priyankishore.dev"
	: "http://localhost:3000";

export const useApi = () => {
	const { accessToken, refreshToken, logout, reloadTokens } = useAuth();

	const fetchWithToken = async (url: string, options: RequestInit = {}) => {
		try {
			console.log("fetching with tokens: ", url, accessToken);
			if (!accessToken) {
				return fetchWithoutToken(url, options);
			}

			const headers = new Headers(options.headers);
			headers.set("Authorization", `Bearer ${accessToken}`);

			const response = await fetch(`${url}`, {
				...options,
				headers,
			});

			if (response.status === 401) {
				console.log("Refreshing token...");
				const refreshResponse = await fetch(`${BASE_URL}/refresh`, {
					headers: { Authorization: `Bearer ${refreshToken}` },
				});

				if (refreshResponse.ok) {
					const { accessToken: newAccessToken } = await refreshResponse.json();
					console.log("Token refreshed successfully");
					console.log("newAccessToken", newAccessToken);
					reloadTokens();
					localStorage.setItem("accessToken", newAccessToken);
					headers.set("Authorization", `Bearer ${newAccessToken}`);
					return fetch(`${BASE_URL}${url}`, { ...options, headers });
				} else {
					logout();
					throw new Error("Session expired. Please login again.");
				}
			}

			return response;
		} catch (err) {
			console.error("Error in fetchWithToken:", err);
			throw err;
		}
	};

	const fetchWithoutToken = async (url: string, options: RequestInit = {}) => {
		const headers = new Headers(options.headers);
		headers.set("Content-Type", "application/json");
		const response = await fetch(`${BASE_URL}${url}`, { ...options, headers });

		return response;
	};

	return { fetchWithToken, fetchWithoutToken };
};
