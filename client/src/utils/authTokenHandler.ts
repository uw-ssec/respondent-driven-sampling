// This file provides helper functions to manage JWTs used in authentication.
import { useAuthStore } from '@/stores';
import { jwtDecode } from 'jwt-decode';

interface JwtPayload {
	userObjectId: string;
}

export function saveAuthToken(token: string): void {
	useAuthStore.getState().setToken(token);
}

export function deleteAuthToken(): void {
	useAuthStore.getState().clearToken();
}

export function getAuthToken(): string {
	return useAuthStore.getState().token;
}

export function getDecodedAuthToken(): JwtPayload | null {
	const token = getAuthToken();
	if (!token) return null;
	try {
		return jwtDecode<JwtPayload>(token);
	} catch (error) {
		console.error('Error decoding token:', error);
		return null;
	}
}

export function hasAuthToken(): boolean {
	// If the token exists we will assume we are logged in, even if the token is expired.
	// We can relogin on a failed API call if expired.
	const token = getAuthToken();
	return token != null && token !== '';
}

export function isTokenValid(): boolean {
	const token = getAuthToken();
	if (!token) return false;

	try {
		const decoded = jwtDecode<JwtPayload & { exp?: number }>(token);
		// Check if token has expiration and if it's expired
		if (decoded.exp) {
			const currentTime = Math.floor(Date.now() / 1000);
			return decoded.exp > currentTime;
		}
		// If no expiration date, treat as invalid for security
		return false;
	} catch (error) {
		// Token is invalid or malformed
		return false;
	}
}
