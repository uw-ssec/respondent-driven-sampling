// This file provides helper functions to manage JWTs used in authentication.
import { jwtDecode } from 'jwt-decode';

import { useAuthStore } from '../stores/useAuthStore';
import { useSurveyStore } from '../stores/useSurveyStore';

interface JwtPayload {
	firstName: string;
	role: string;
	employeeId: string;
}

export function saveAuthToken(token: string): void {
	useAuthStore.getState().setToken(token);
}

export function deleteAuthToken(): void {
	useAuthStore.getState().clearSession();
}

export function getAuthToken(): string | null {
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
	if (decodedAuthToken?.role == null) return '';
	return decodedAuthToken.role;
}

export function getFirstName(): string {
	const decodedAuthToken = getDecodedAuthToken();
	if (decodedAuthToken?.firstName == null) return '';
	return decodedAuthToken.firstName;
}

export function getEmployeeId(): string {
	const decodedAuthToken = getDecodedAuthToken();
	if (decodedAuthToken?.employeeId == null) return '';
	return decodedAuthToken.employeeId;
}

export function initializeSurveyStore() {
	const { setEmployeeId, setEmployeeName, setReferredByCode } =
		useSurveyStore.getState();
	const employeeId = getEmployeeId();
	const employeeName = getFirstName();
	setEmployeeId(employeeId);
	setEmployeeName(employeeName);
	setReferredByCode(null);
}
