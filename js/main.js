import {sendSms, verifyCode} from "./twilio_service.js";
import {getPolicyVersion, openPrivacyPolicy} from "./privacy_policy.js";
import {consultAccess} from "./acl_service.js";
const serverEndpoint = "https://verbo-web-auth-backend-598460425969.us-central1.run.app";
const params = new URLSearchParams(window.location.search);
if(params.has("challenge") && params.has("md")){
	sessionStorage.setItem("hotspot_url", window.location.href);
}

document.addEventListener("DOMContentLoaded", async() => {

	const detailsForm = document.querySelector("#details-form");
	const codeForm = document.querySelector("#code-form");
	const detailsStep = document.querySelector("#details-step");
	const codeStep = document.querySelector("#code-step");
	const successStep = document.querySelector("#success-step");
	const waitStep = document.querySelector("#wait-step");
	const detailsMessage = document.querySelector("#details-message");
	const codeMessage = document.querySelector("#code-message");
	const stepOneIndicator = document.querySelector("#step-indicator-1");
	const stepTwoIndicator = document.querySelector("#step-indicator-2");
	const resendButton = document.querySelector("#resend-code");

	// ========== DATOS INGRESADOS EN FORMULARIO ===========
	const nameInput = document.querySelector("#first-name");
	const lastname1Input = document.querySelector("#last-name1");
	const lastname2Input = document.querySelector("#last-name2");
	const emailInput = document.querySelector("#email");
	const phoneInput = document.querySelector("#phone");
	const codeInput = document.querySelector("#verification-code");
	const consentInput = document.querySelector("#consent");

	waitStep.hidden = true;

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

	function showSuccessStep(nombre){
		detailsStep.hidden = true;
		codeStep.hidden = true;
		successStep.hidden = false;
		stepOneIndicator.classList.add("is-complete");
		stepOneIndicator.removeAttribute("aria-current");
		stepTwoIndicator.classList.remove("is-active");
		stepTwoIndicator.classList.add("is-complete");
		stepTwoIndicator.removeAttribute("aria-current");
		document.querySelector("#verified-name").textContent = nombre;
	}

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

	if(params.get("estado") === "conectado"){
			let nombre = "";
			try{
				nombre = sessionStorage.getItem("verified_name") ?? "";
				sessionStorage.removeItem("verified_name");
			}catch{}
			detailsStep.hidden = true;
			codeStep.hidden = true;
			successStep.hidden = false;
			stepOneIndicator.classList.add("is-complete");
			stepTwoIndicator.classList.add("is-complete");
			stepTwoIndicator.removeAttribute("aria-current");
			document.querySelector("#verified-name").textContent = nombre;
	}

	if(params.get("res") === "failed") showMessage(detailsMessage, "No pudimos conectarte. Desconéctate del WiFi y vuelve a conectarte.");

	let policyVersion;
	const vieneDelHotspot = params.has("challenge") && params.has("md");
	const access = vieneDelHotspot
		? await consultAccess(serverEndpoint, sessionStorage.getItem("hotspot_url"))
		: null;

	if(!access){
    	if(params.get("estado") !== "conectado") showMessage(detailsMessage, "Conéctate a la red WiFi y abre el portal desde ahí para continuar.");
	}else if(!access.ok){
		showMessage(detailsMessage, access.mensaje);
	}else if(access.data.codigo === "ACCESO_EN_ESPERA"){
		detailsStep.hidden = true;
		codeStep.hidden = true;
		successStep.hidden = true;
		waitStep.hidden = false;
		document.querySelector("#wait-title").textContent = access.data.reingreso ? "Tiempo de sesión agotado" : "Número con acceso registrado";
		document.querySelector("#wait-message").textContent = access.data.mensaje;
	}else if(!access.data.ok){
		showMessage(detailsMessage, access.data.mensaje);
	}else if(access.data.loginUrl){
		if(params.get("res") !== "failed"){
			sessionStorage.removeItem("hotspot_url");
			window.location.replace(access.data.loginUrl);
		}
	}else{
		policyVersion = await getPolicyVersion(serverEndpoint);
		openPrivacyPolicy(policyVersion);
	}

	let codeWasSent = false;

	let userDetails = {
		telefono: ""
	};

	detailsForm.addEventListener("submit", async (event) => {
		event.preventDefault();
		hideMessage(detailsMessage);
		if (!detailsForm.reportValidity()) return;
		if (!consentInput.checked) return;
		const phone = formatPhone();
		if(!phone) return;
		if(!codeWasSent || (!userDetails.telefono || phone !== userDetails.telefono)){
			const smsResult = await sendSms(serverEndpoint, phone, sessionStorage.getItem("hotspot_url"));
			if(!smsResult.ok){
				showMessage(detailsMessage, smsResult.mensaje || "No pudimos enviar el código. Inténtalo de nuevo.");
				return;
			}
			codeWasSent = true;
		}
			userDetails = {
			nombre: nameInput.value.trim(),
			apellido_paterno: lastname1Input.value.trim(),
			apellido_materno: lastname2Input.value.trim(),
			correo: emailInput.value.trim(),
			telefono: phone,
			acepto_aviso: document.querySelector("#consent").checked,
			version_aviso: policyVersion,
			hotspot_url: sessionStorage.getItem("hotspot_url")
		};
		hideMessage(codeMessage);
		showCodeStep();
	});

	codeForm.addEventListener("submit", async (event) => {
		event.preventDefault();
		hideMessage(codeMessage);

		if (!codeForm.reportValidity()) return;
		userDetails.codigo = codeInput.value.trim();
		const verifyResult = await verifyCode(serverEndpoint, userDetails);

		if (!verifyResult.ok){
			showMessage(codeMessage, verifyResult.mensaje || "Código incorrecto. Inténtalo de nuevo.");
			codeInput.focus();
			return;
		}

		try{
			sessionStorage.removeItem("hotspot_url");
			sessionStorage.setItem("verified_name", userDetails.nombre);
		}catch{}

		if(verifyResult.loginUrl){
			codeForm.querySelector("button[type=submit]").disabled = true;
			showMessage(codeMessage, "Conectando a la red…");
			window.location.replace(verifyResult.loginUrl);
			return;
		}

		showSuccessStep(userDetails.nombre);
	});

	resendButton.addEventListener("click", () => {
		codeInput.value = "";
		sendSms(serverEndpoint, userDetails.telefono);
		hideMessage(codeMessage);

		let timeOff = 60;
		const originalText = resendButton.textContent;

		resendButton.disabled = true;
		resendButton.textContent = `Volver a enviar en (${timeOff}s)`;

		const countDown = setInterval(() => {
			timeOff--;
			if (timeOff > 0){
				resendButton.textContent = `Volver a enviar en (${timeOff}s)`;
			}
			else{
				clearInterval(countDown);
				resendButton.disabled = false;
				resendButton.textContent = originalText;
			}
		}, 1000);
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
})



