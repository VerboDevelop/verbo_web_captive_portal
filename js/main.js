import {sendSms, verifyCode} from "./twilio_service.js";

const detailsForm = document.querySelector("#details-form");
const codeForm = document.querySelector("#code-form");
const detailsStep = document.querySelector("#details-step");
const codeStep = document.querySelector("#code-step");
const successStep = document.querySelector("#success-step");
const detailsMessage = document.querySelector("#details-message");
const codeMessage = document.querySelector("#code-message");
const stepOneIndicator = document.querySelector("#step-indicator-1");
const stepTwoIndicator = document.querySelector("#step-indicator-2");

// ========== DATOS INGRESADOS EN FORMULARIO ===========
const nameInput = document.querySelector("#first-name");
const lastname1Input = document.querySelector("#last-name1");
const lastname2Input = document.querySelector("#last-name2");
const emailInput = document.querySelector("#email");
const phoneInput = document.querySelector("#phone");
const codeInput = document.querySelector("#verification-code");
const consentInput = document.querySelector("#consent");

function formatPhone(){
    const phone = phoneInput.value.replace(/\D/g, "");
    if (!/^\d{10}$/.test(phone)) {
        phoneInput.setAttribute("aria-invalid", "true");
        showMessage(detailsMessage, "Ingresa un número mexicano válido de exactamente 10 dígitos.");
        phoneInput.focus();
        return;
    }
    phoneInput.removeAttribute("aria-invalid");
    const formatedPhone = `+52${phone}`;
    return formatedPhone;
}

let userDetails;

function showMessage(element, message) {
	element.textContent = message;
	element.hidden = false;
}

function hideMessage(element) {
	element.textContent = "";
	element.hidden = true;
}

function showCodeStep() {
	detailsStep.hidden = true;
	codeStep.hidden = false;
	stepOneIndicator.classList.add("is-complete");
	stepOneIndicator.removeAttribute("aria-current");
	stepTwoIndicator.classList.add("is-active");
	stepTwoIndicator.setAttribute("aria-current", "step");
	document.querySelector("#phone-summary").textContent = `${userDetails.telefono}`;
	codeInput.focus();
}

detailsForm.addEventListener("submit", (event) => {
	event.preventDefault();
	hideMessage(detailsMessage);

	if (!detailsForm.reportValidity()) return;
	if(consentInput.value !== "on") return;
	const phone = formatPhone(phoneInput);
	userDetails = {
        nombre: nameInput.value.trim(),
        apellido_paterno: lastname1Input.value.trim(),
		apellido_materno: lastname2Input.value.trim(),
        correo: emailInput.value.trim(),
        telefono: phone,
		acepto_aviso: document.querySelector("#consent").value === "on" ? true : false,
		version_aviso: "2026-10"
    };
	sendSms(phone);
	hideMessage(codeMessage);
	showCodeStep();
});

codeForm.addEventListener("submit", async (event) => {
	event.preventDefault();
	hideMessage(codeMessage);

	if (!codeForm.reportValidity()) return;
	userDetails.codigo = codeInput.value.trim();
	const verifyResult = await verifyCode(userDetails);
	if (!verifyResult){
		showMessage(codeMessage, "El código no coincide. Revisa el código e inténtalo de nuevo.");
		codeInput.focus();
		return;
	}
	codeStep.hidden = true;
	successStep.hidden = false;
	stepTwoIndicator.classList.add("is-complete");
	stepTwoIndicator.removeAttribute("aria-current");
	document.querySelector("#verified-name").textContent = userDetails.nombre;
});

document.querySelector("#resend-code").addEventListener("click", () => {
	const twilioPhone = formatPhone();
	codeInput.value = "";
	sendSms(twilioPhone);
	hideMessage(codeMessage);
	
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

phoneInput.addEventListener("input", () => {
	phoneInput.value = phoneInput.value.replace(/\D/g, "").slice(0, 10);
	phoneInput.removeAttribute("aria-invalid");
});
codeInput.addEventListener("input", () => {
	codeInput.value = codeInput.value.replace(/\D/g, "").slice(0, 6);
	hideMessage(codeMessage);
});

