const detailsForm = document.querySelector("#details-form");
const codeForm = document.querySelector("#code-form");
const detailsStep = document.querySelector("#details-step");
const codeStep = document.querySelector("#code-step");
const successStep = document.querySelector("#success-step");
const detailsMessage = document.querySelector("#details-message");
const codeMessage = document.querySelector("#code-message");
const demoCodeNotice = document.querySelector("#demo-code");
const phoneInput = document.querySelector("#phone");
const codeInput = document.querySelector("#verification-code");
const stepOneIndicator = document.querySelector("#step-indicator-1");
const stepTwoIndicator = document.querySelector("#step-indicator-2");

let verificationCode = "";
let userDetails;

function showMessage(element, message) {
	element.textContent = message;
	element.hidden = false;
}

function hideMessage(element) {
	element.textContent = "";
	element.hidden = true;
}

function generateCode() {
	return String(Math.floor(100000 + Math.random() * 900000));
}

function showCodeStep() {
	detailsStep.hidden = true;
	codeStep.hidden = false;
	stepOneIndicator.classList.add("is-complete");
	stepOneIndicator.removeAttribute("aria-current");
	stepTwoIndicator.classList.add("is-active");
	stepTwoIndicator.setAttribute("aria-current", "step");
	document.querySelector("#phone-summary").textContent = `+52 ${userDetails.phone}`;
	codeInput.focus();
}

detailsForm.addEventListener("submit", (event) => {
	event.preventDefault();
	hideMessage(detailsMessage);

	if (!detailsForm.reportValidity()) return;

	const phone = phoneInput.value.replace(/\D/g, "");
	if (!/^\d{10}$/.test(phone)) {
		phoneInput.setAttribute("aria-invalid", "true");
		showMessage(detailsMessage, "Ingresa un número mexicano válido de exactamente 10 dígitos.");
		phoneInput.focus();
		return;
	}

	phoneInput.removeAttribute("aria-invalid");
	userDetails = {
		firstName: document.querySelector("#first-name").value.trim(),
		lastName: document.querySelector("#last-name").value.trim(),
		email: document.querySelector("#email").value.trim(),
		phone,
	};
	verificationCode = generateCode();
	demoCodeNotice.textContent = `Código de demostración: ${verificationCode}. No se envió un SMS; conecta un proveedor de verificación para usar códigos reales.`;
	hideMessage(codeMessage);
	showCodeStep();
});

codeForm.addEventListener("submit", (event) => {
	event.preventDefault();
	hideMessage(codeMessage);

	if (!codeForm.reportValidity()) return;

	if (codeInput.value !== verificationCode) {
		showMessage(codeMessage, "El código no coincide. Revisa el código de demostración e inténtalo de nuevo.");
		codeInput.focus();
		return;
	}

	codeStep.hidden = true;
	successStep.hidden = false;
	stepTwoIndicator.classList.add("is-complete");
	stepTwoIndicator.removeAttribute("aria-current");
	document.querySelector("#verified-name").textContent = userDetails.firstName;
});

document.querySelector("#resend-code").addEventListener("click", () => {
	verificationCode = generateCode();
	codeInput.value = "";
	hideMessage(codeMessage);
	demoCodeNotice.textContent = `Nuevo código de demostración: ${verificationCode}. No se envió un SMS; conecta un proveedor de verificación para usar códigos reales.`;
});

document.querySelector("#edit-details").addEventListener("click", () => {
	codeStep.hidden = true;
	detailsStep.hidden = false;
	stepOneIndicator.classList.remove("is-complete");
	stepOneIndicator.setAttribute("aria-current", "step");
	stepTwoIndicator.classList.remove("is-active");
	stepTwoIndicator.removeAttribute("aria-current");
	hideMessage(detailsMessage);
	document.querySelector("#first-name").focus();
});

phoneInput.addEventListener("input", () => phoneInput.removeAttribute("aria-invalid"));
codeInput.addEventListener("input", () => {
	codeInput.value = codeInput.value.replace(/\D/g, "").slice(0, 6);
	hideMessage(codeMessage);
});
