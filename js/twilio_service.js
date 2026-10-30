
// =========== FUNCIONES DE VALIDACION CON TWILIO ===========
export async function sendSms(serverEndpoint, twilioPhone){
	const url = serverEndpoint + "/api/enviar-sms";
	try{
		const response = await fetch(url, {
			method: "POST",
			headers: {
				"content-type": "application/json"
			},
			body: JSON.stringify({"telefono": twilioPhone})
		});
		const data = await response.json();
		if(!response.ok) throw new Error(data.mensaje || "Error al enviar SMS");
		return true;
	}catch(e){
		console.error(e.message);
		return false;
	}
}

export async function verifyCode(serverEndpoint, userDetails){
	const url = serverEndpoint + "/api/verificar-codigo";
	try{
		const response = await fetch(url, {
			method: "POST",
			headers: {
				"content-type": "application/json; charset=utf-8"
			},
			body: JSON.stringify({
                "nombre": userDetails.nombre,
                "apellido_paterno": userDetails.apellido_paterno,
                "apellido_materno": userDetails.apellido_materno,
                "correo": userDetails.correo,
				"telefono": userDetails.telefono,
				"codigo": userDetails.codigo,
                "acepto_aviso": userDetails.acepto_aviso,
                "version_aviso": userDetails.version_aviso,
				"hotspot_url": sessionStorage.getItem("hotspot_url")
			})
		});
		return await response.json();
	}catch{
		return {ok: false, mensaje: "No pudimos conectar con el servidor. Inténtalo de nuevo."};
	}
}