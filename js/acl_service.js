export async function consultAccess(serverEndpoint, hotspot_url){
    const url = serverEndpoint + "/api/check-site";
    try{
        const response = await fetch(url, {
            method: "POST",
			headers: {
				"content-type": "application/json"
			},
			body: JSON.stringify({
				"hotspot_url": hotspot_url
			})
        });
        const data = await response.json();
        return {ok: true, data: data};
    }catch{
        return{ok: false, mensaje: "Servicio no disponible, accede en otro momento"};
    }
}