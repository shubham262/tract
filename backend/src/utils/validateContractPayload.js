const CLIENT_NAME_MAX = 255;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

const isValidCalendarDate = (value) => {
	if (!DATE_RE.test(value)) return false;
	const [year, month, day] = value.split("-").map(Number);
	const date = new Date(Date.UTC(year, month - 1, day));
	return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
};

const isNonEmptyString = (v) => typeof v === "string" && v.trim().length > 0;
const isFiniteNumber = (v) => typeof v === "number" && Number.isFinite(v);

const validateItem = (item, index, errors) => {
	const prefix = `items[${index}]`;
	if (typeof item !== "object" || item === null || Array.isArray(item)) {
		errors.push({ field: prefix, message: "Item must be an object" });
		return null;
	}
	if (!isNonEmptyString(item.description)) {
		errors.push({ field: `${prefix}.description`, message: "Description is required" });
	}
	if (!isFiniteNumber(item.quantity) || item.quantity <= 0) {
		errors.push({ field: `${prefix}.quantity`, message: "Quantity must be a number greater than 0" });
	}
	if (item.quantity_unit != null && typeof item.quantity_unit !== "string") {
		errors.push({ field: `${prefix}.quantity_unit`, message: "Quantity unit must be a string" });
	}
	if (!isFiniteNumber(item.unit_price) || item.unit_price < 0) {
		errors.push({ field: `${prefix}.unit_price`, message: "Unit price must be a number greater than or equal to 0" });
	}
	if (item.pricing_unit != null && typeof item.pricing_unit !== "string") {
		errors.push({ field: `${prefix}.pricing_unit`, message: "Pricing unit must be a string" });
	}
	if (item.total != null && !isFiniteNumber(item.total)) {
		errors.push({ field: `${prefix}.total`, message: "Total must be a number" });
	}
	return {
		description: isNonEmptyString(item.description) ? item.description.trim() : item.description,
		quantity: item.quantity,
		quantity_unit: item.quantity_unit ?? null,
		unit_price: item.unit_price,
		pricing_unit: item.pricing_unit ?? null,
		total:
			item.total != null
				? item.total
				: isFiniteNumber(item.quantity) && isFiniteNumber(item.unit_price)
					? Math.round(item.quantity * item.unit_price * 100) / 100
					: null,
	};
};

export const validateContractPayload = (payload) => {
	const errors = [];

	if (typeof payload !== "object" || payload === null || Array.isArray(payload)) {
		return { valid: false, errors: [{ field: "root", message: "Payload must be a JSON object" }] };
	}

	if (!isNonEmptyString(payload.client_name)) {
		errors.push({ field: "client_name", message: "Client name is required" });
	} else if (payload.client_name.trim().length > CLIENT_NAME_MAX) {
		errors.push({ field: "client_name", message: `Client name must be ${CLIENT_NAME_MAX} characters or fewer` });
	}

	if (!isNonEmptyString(payload.po_ref_no)) {
		errors.push({ field: "po_ref_no", message: "PO reference number is required" });
	}

	if (!isNonEmptyString(payload.po_date)) {
		errors.push({ field: "po_date", message: "PO date is required" });
	} else if (!isValidCalendarDate(payload.po_date.trim())) {
		errors.push({ field: "po_date", message: "PO date must be a valid date in YYYY-MM-DD format" });
	}

	if (payload.payment_terms != null && typeof payload.payment_terms !== "string") {
		errors.push({ field: "payment_terms", message: "Payment terms must be a string" });
	}
	if (payload.delivery_terms != null && typeof payload.delivery_terms !== "string") {
		errors.push({ field: "delivery_terms", message: "Delivery terms must be a string" });
	}

	let normalizedItems = [];
	if (!Array.isArray(payload.items) || payload.items.length === 0) {
		errors.push({ field: "items", message: "At least one item is required" });
	} else {
		normalizedItems = payload.items.map((item, index) => validateItem(item, index, errors));
	}

	if (errors.length > 0) {
		return { valid: false, errors };
	}

	return {
		valid: true,
		data: {
			client_name: payload.client_name.trim(),
			po_ref_no: payload.po_ref_no.trim(),
			po_date: payload.po_date.trim(),
			payment_terms: payload.payment_terms?.trim() || null,
			delivery_terms: payload.delivery_terms?.trim() || null,
			items: normalizedItems,
		},
	};
};
