// This file provides helper functions to manage JWTs used in authentication.
import { useAuthStore, useSurveyStore } from '@/stores';
import { jwtDecode } from 'jwt-decode';

interface JwtPayload {
	firstName: string;
	role: string;
	userObjectId: string;
}

export function saveAuthToken(token: string): void {
	useAuthStore.getState().setToken(token);
}

export function deleteAuthToken(): void {
	useAuthStore.getState().clearSession();
}

export function getAuthToken(): string {
	return useAuthStore.getState().token;
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
	return getObjectId();
}

export function getObjectId(): string {
	const decodedAuthToken = getDecodedAuthToken();
	if (decodedAuthToken == null || decodedAuthToken.userObjectId == null)
		return '';
	return decodedAuthToken.userObjectId;
}

export function initializeSurveyStore() {
	const { setEmployeeId, setEmployeeName, setReferredByCode, setObjectId } =
		useSurveyStore.getState();
	const objectId = getObjectId();
	const employeeName = getFirstName();
	setEmployeeId(objectId);
	setEmployeeName(employeeName);
	setReferredByCode(null);
	setObjectId(null);
}
