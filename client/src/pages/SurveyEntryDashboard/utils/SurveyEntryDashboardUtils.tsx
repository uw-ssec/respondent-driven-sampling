import { SurveyDocument } from '@/types/Survey';

export const toPacificDateOnlyString = (input: string | number | Date) => {
	const d = input instanceof Date ? input : new Date(input);
	if (isNaN(d.getTime())) return '';
	const opts: Intl.DateTimeFormatOptions = {
		timeZone: 'America/Los_Angeles',
		year: 'numeric',
		month: '2-digit',
		day: '2-digit'
	};
	const parts = new Intl.DateTimeFormat('en-US', opts).formatToParts(d);
	const y = parts.find(p => p.type === 'year')?.value ?? '';
	const m = parts.find(p => p.type === 'month')?.value ?? '';
	const day = parts.find(p => p.type === 'day')?.value ?? '';
	return `${y}-${m}-${day}`;
};

export const toPacificDateTimeString = (input: string | number | Date) => {
	const d = input instanceof Date ? input : new Date(input);
	if (isNaN(d.getTime())) return '';
	return d.toLocaleString('en-US', { timeZone: 'America/Los_Angeles' });
};

/**
 * Helper function to get nested object values using dot notation path
 */
export const getNestedValue = (obj: any, path: string) => {
	return path.split('.').reduce((acc, part) => acc?.[part], obj);
};

/**
 * Filter surveys by date or return all if viewAll is true
 */
export const filterSurveysByDate = (
	surveys: SurveyDocument[] | undefined,
	viewAll: boolean,
	selectedDate: Date
): SurveyDocument[] => {
	if (!surveys) return [];

	return surveys.filter((s: SurveyDocument) => {
		if (viewAll) return true;
		const surveyDate = toPacificDateOnlyString(s.createdAt);
		const selDate = toPacificDateOnlyString(selectedDate);
		return surveyDate && surveyDate === selDate;
	});
};

/**
 * Sort surveys based on the provided sort configuration
 */
export const sortSurveys = (
	surveys: SurveyDocument[],
	sortConfig: { key: string | null; direction: 'asc' | 'desc' }
): SurveyDocument[] => {
	if (!sortConfig.key) return [...surveys];

	return [...surveys].sort((a, b) => {
		let aValue = getNestedValue(a, sortConfig.key!);
		let bValue = getNestedValue(b, sortConfig.key!);

		if (sortConfig.key === 'createdAt') {
			aValue = new Date(aValue).getTime();
			bValue = new Date(bValue).getTime();
			return sortConfig.direction === 'asc'
				? aValue - bValue
				: bValue - aValue;
		}

		const aStr = (aValue ?? '').toString().toLowerCase();
		const bStr = (bValue ?? '').toString().toLowerCase();

		return sortConfig.direction === 'asc'
			? aStr.localeCompare(bStr)
			: bStr.localeCompare(aStr);
	});
};

/**
 * Filter surveys by location name
 */
export const filterSurveysByLocation = (
	surveys: SurveyDocument[],
	locationName: string | null
): SurveyDocument[] => {
	if (!surveys) return [];
	if (!locationName) return surveys;

	return surveys.filter(s => s.locationName === locationName);
};

/**
 * Search surveys by term across multiple fields
 */
export const searchSurveys = (
	surveys: SurveyDocument[],
	searchTerm: string
): SurveyDocument[] => {
	if (!searchTerm) return surveys;

	const lowerSearchTerm = searchTerm.toLowerCase();

	return surveys.filter(s => {
		const searchableText = [
			s.surveyCode,
			s.employeeName,
			s.locationName,
			s.createdAt,
			s.responses?.first_two_letters_fname,
			s.responses?.first_two_letters_lname,
			s.responses?.date_of_birth
		]
			.filter(Boolean)
			.join(' ')
			.toLowerCase();

		return searchableText.includes(lowerSearchTerm);
	});
};

/**
 * Paginate surveys array
 */
export const paginateSurveys = (
	surveys: SurveyDocument[],
	currentPage: number,
	itemsPerPage: number
): SurveyDocument[] => {
	const startIndex = currentPage * itemsPerPage;
	const endIndex = startIndex + itemsPerPage;
	return surveys.slice(startIndex, endIndex);
};
