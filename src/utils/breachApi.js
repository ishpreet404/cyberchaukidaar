/**
 * LeakOSINT API Configuration
 *
 * This module handles all API interactions with the LeakOSINT breach database.
 * API provides access to 15B+ data breach records.
 */

const API_URL = "https://leakosintapi.com/";
const API_TOKEN = "8518143178:mR452s1L";

/**
 * Search for data breaches
 * @param {string} query - Email, phone number, or name to search
 * @param {number} limit - Maximum results to return (default: 100)
 * @returns {Promise<Object>} Breach data results
 */
export const searchBreaches = async (query, limit = 100) => {
	const payload = {
		token: API_TOKEN,
		request: query,
		limit: limit,
		lang: "en",
		type: "json",
	};

	const response = await fetch(API_URL, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify(payload),
	});

	const data = await response.json();

	if (!response.ok) {
		throw new Error(`API request failed: ${response.status}`);
	}

	if (data.error) {
		throw new Error(`API Error ${data.error}`);
	}

	return data;
};

/**
 * Field type categorization for display purposes
 */
export const fieldTypes = {
	email: ["Email", "email", "Mail"],
	phone: ["Phone", "Phone2", "Phone3", "Mobile", "Tel"],
	address: [
		"Address",
		"City",
		"State",
		"Region",
		"Country",
		"PostCode",
		"Zip",
		"Street",
	],
	sensitive: [
		"Password",
		"CreditCard",
		"CardExpiration",
		"DocNumber",
		"PassportNumber",
		"IP",
		"SSN",
		"CVV",
		"PIN",
	],
	personal: [
		"Name",
		"FirstName",
		"LastName",
		"FullName",
		"Username",
		"Gender",
		"Age",
		"DOB",
		"Birthday",
		"BirthDate",
	],
	default: [],
};

/**
 * Get field type category
 * @param {string} fieldName - Name of the field
 * @returns {string} Field category
 */
export const getFieldType = (fieldName) => {
	for (const [type, fields] of Object.entries(fieldTypes)) {
		if (fields.some((f) => fieldName.toLowerCase().includes(f.toLowerCase()))) {
			return type;
		}
	}
	return "default";
};

/**
 * Format field name for display
 * @param {string} name - Raw field name
 * @returns {string} Formatted field name
 */
export const formatFieldName = (name) => {
	return name
		.replace(/([A-Z])/g, " $1")
		.replace(/[_-]/g, " ")
		.trim()
		.toUpperCase();
};

/**
 * Mask sensitive data for display
 * @param {string} value - Value to mask
 * @param {string} fieldType - Type of field
 * @returns {string} Masked or original value
 */
export const maskSensitiveData = (value, fieldType) => {
	if (fieldType === "sensitive" && value) {
		return "●".repeat(Math.min(value.length, 20));
	}
	return value;
};

export default {
	searchBreaches,
	getFieldType,
	formatFieldName,
	maskSensitiveData,
	fieldTypes,
};
