// This file provides helper functions to manage JWTs used in authentication.
import { jwtDecode } from 'jwt-decode';

interface JwtPayload {
	firstName: string;
	role: string;
	employeeId: string;
}

export function saveAuthToken(token: string): void {
	localStorage.setItem('token', token);
}

export function deleteAuthToken(): void {
	localStorage.removeItem('token');
}

export function getAuthToken(): string | null {
	return localStorage.getItem('token');
}

function getDecodedAuthToken(): JwtPayload | null {
	const token = getAuthToken();
	return token ? jwtDecode<JwtPayload>(token) : null;
}

export function hasAuthToken(): boolean {
	// If the token exists we will assume we are logged in, even if the token is expired.
	// We can relogin on a failed API call if expired.
	return getAuthToken() != null;
}

export function getRole(): string {
	const decodedAuthToken = getDecodedAuthToken();
	if (decodedAuthToken == null || decodedAuthToken.role == null) return '';
	return decodedAuthToken.role;
}

export function getFirstName(): string {
	const decodedAuthToken = getDecodedAuthToken();
	if (decodedAuthToken == null || decodedAuthToken.firstName == null)
		return '';
	return decodedAuthToken.firstName;
}

export function getEmployeeId(): string {
	const decodedAuthToken = getDecodedAuthToken();
	if (decodedAuthToken == null || decodedAuthToken.employeeId == null)
		return '';
	return decodedAuthToken.employeeId;
}
