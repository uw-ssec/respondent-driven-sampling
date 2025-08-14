import { jwtDecode } from "jwt-decode";

interface JwtPayload {
    firstName?:  string;
    role?:       string;
    employeeId?: string
}

// This file provides helper functions to manage JWTs used in authentication.
// TODO: Consider not using local storage for storing the token as it is potentially
//       insecure.

export function saveToken(token: string): void {
    localStorage.setItem("token", token);
}

export function deleteToken(): void {
    localStorage.removeItem("token");
}

export function getToken(): string | null {
    return localStorage.getItem("token");
}

function getDecodedToken(): JwtPayload | null {
    const token = getToken();
    if (token == null) return null;
    return jwtDecode<JwtPayload>(token);
}

export function hasToken(): boolean {
    // If the token exists we will assume we are logged in, even if the token is expired.
    // We can relogin on a failed API call if expired.
    return getToken() == null;
}

export function getRole(): string {
    const decodedToken = getDecodedToken();
    if (decodedToken == null || decodedToken.role == null) return "";
    return decodedToken.role;
}

export function getFirstName(): string {
    const decodedToken = getDecodedToken();
    if (decodedToken == null || decodedToken.firstName == null) return "";
    return decodedToken.firstName;
}

export function getEmployeeId(): string {
    const decodedToken = getDecodedToken();
    if (decodedToken == null || decodedToken.employeeId == null) return "";
    return decodedToken.employeeId;
}