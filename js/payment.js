const PAYMENT_CART_STORAGE_KEY = "cart";
const paymentForm = document.getElementById("payment-form");
const successModal = document.getElementById("success-modal");
const cardNumberInput = document.getElementById("card-number");
const expirationDateInput = document.getElementById("expiration-date");
const cvvInput = document.getElementById("cvv");
const EXPIRATION_REGEX = /^(0[1-9]|1[0-2])\/(\d{2})$/;
const CVV_REGEX = /^\d{3}$/;

function formatCardNumberInput(rawValue) {
	const digitsOnly = rawValue.replace(/\D/g, "").slice(0, 16);
	const chunks = digitsOnly.match(/.{1,4}/g) || [];
	return chunks.join(" ");
}

function formatExpirationInput(rawValue) {
	let digits = rawValue.replace(/\D/g, "").slice(0, 4);

	if (digits.length > 0 && Number(digits[0]) > 1) {
		digits = "";
	}

	if (digits.length >= 2) {
		const month = Number(digits.slice(0, 2));
		if (month < 1 || month > 12) {
			digits = digits.slice(0, 1);
		}
	}

	if (digits.length <= 2) {
		return digits;
	}

	return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

function isExpirationValid(value) {
	const match = value.match(EXPIRATION_REGEX);
	if (!match) return false;

	const month = Number(match[1]);
	const yearTwoDigits = Number(match[2]);

	const now = new Date();
	const currentYear = now.getFullYear();
	const currentMonth = now.getMonth() + 1;

	const fullYear = 2000 + yearTwoDigits;
	const maxYear = currentYear + 10;

	if (fullYear < currentYear || fullYear > maxYear) {
		return false;
	}

	if (fullYear === currentYear && month < currentMonth) {
		return false;
	}

	return true;
}

function formatCvvInput(rawValue) {
	return rawValue.replace(/\D/g, "").slice(0, 3);
}

function getFieldLabelText(input) {
	if (!input) return "This field";

	const label = input.previousElementSibling;
	if (label && label.tagName === "LABEL") {
		return label.textContent.trim();
	}

	return input.getAttribute("placeholder") || "This field";
}

function ensureErrorElement(input) {
	const next = input.nextElementSibling;
	if (next && next.classList.contains("input-error-text")) {
		return next;
	}

	const error = document.createElement("small");
	error.className = "input-error-text";
	error.textContent = "";
	input.insertAdjacentElement("afterend", error);
	return error;
}

function setInputError(input, message) {
	const errorEl = ensureErrorElement(input);
	input.classList.add("input-invalid");
	errorEl.textContent = message;
}

function clearInputError(input) {
	const errorEl = ensureErrorElement(input);
	input.classList.remove("input-invalid");
	errorEl.textContent = "";
}

function validatePaymentForm() {
	if (!paymentForm) return true;

	let valid = true;
	const requiredInputs = paymentForm.querySelectorAll("input[required]");

	requiredInputs.forEach((input) => {
		const value = input.value.trim();

		if (input === expirationDateInput) {
			if (!value) {
				setInputError(input, "Expiration date should be filed");
				valid = false;
				return;
			}

			if (!isExpirationValid(value)) {
				setInputError(input, "Expiration date should be MM/YY with valid month and year");
				valid = false;
				return;
			}

			clearInputError(input);
			return;
		}

		if (input === cvvInput) {
			if (!value) {
				setInputError(input, "CVV should be filed");
				valid = false;
				return;
			}

			if (!CVV_REGEX.test(value)) {
				setInputError(input, "CVV should be exactly 3 digits");
				valid = false;
				return;
			}

			clearInputError(input);
			return;
		}

		if (!value) {
			const fieldName = getFieldLabelText(input);
			setInputError(input, `${fieldName} should be filed`);
			valid = false;
			return;
		}

		clearInputError(input);
	});

	return valid;
}

function readCartItems() {
	try {
		const parsed = JSON.parse(localStorage.getItem(PAYMENT_CART_STORAGE_KEY) || "[]");
		return Array.isArray(parsed) ? parsed : [];
	} catch (_error) {
		localStorage.setItem(PAYMENT_CART_STORAGE_KEY, "[]");
		return [];
	}
}

function refreshBadgeToZero() {
	const badge = document.querySelector(".notification-badge");
	if (badge) {
		badge.textContent = "0";
	}
}

if (paymentForm) {
	if (cardNumberInput) {
		cardNumberInput.addEventListener("input", () => {
			cardNumberInput.value = formatCardNumberInput(cardNumberInput.value);
		});
	}

	if (expirationDateInput) {
		expirationDateInput.addEventListener("input", () => {
			expirationDateInput.value = formatExpirationInput(expirationDateInput.value);

			if (expirationDateInput.value.trim() && isExpirationValid(expirationDateInput.value.trim())) {
				clearInputError(expirationDateInput);
			}
		});
	}

	if (cvvInput) {
		cvvInput.addEventListener("input", () => {
			cvvInput.value = formatCvvInput(cvvInput.value);

			if (CVV_REGEX.test(cvvInput.value.trim())) {
				clearInputError(cvvInput);
			}
		});
	}

	paymentForm.querySelectorAll("input[required]").forEach((input) => {
		input.addEventListener("input", () => {
			if (input.value.trim()) {
				clearInputError(input);
			}
		});
	});

	paymentForm.addEventListener("submit", (event) => {
		event.preventDefault();

		if (!validatePaymentForm()) {
			return;
		}

		const cart = readCartItems();
		if (!cart.length) {
			return;
		}

		if (successModal) {
			successModal.style.display = "flex";
		}

		localStorage.removeItem(PAYMENT_CART_STORAGE_KEY);
		refreshBadgeToZero();
		document.dispatchEvent(new CustomEvent("cart:updated"));

		setTimeout(() => {
			if (successModal) {
				successModal.style.display = "none";
			}
		}, 1800);
	});
}

if (successModal) {
	successModal.addEventListener("click", (event) => {
		if (event.target === successModal) {
			successModal.style.display = "none";
		}
	});
}
