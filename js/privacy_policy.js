export async function getPolicyVersion(serverEndpoint){
    const url = serverEndpoint + "/api/aviso_privacidad";
    try{
        const response = await fetch(url);
        const policyVersion = await response.json();
        if(!response.ok) throw new Error("Error al obtener version aviso de privacidad");
        return policyVersion.version_aviso;
    }catch(e){
        console.error(e);
    }
}

export async function openPrivacyPolicy(policyVersion){
    const policyUrl = document.querySelector("#open-policy");
    const modal = document.querySelector("#policy-modal");
    const content = document.querySelector("#policy-content");
    const closeButton = document.querySelector("#close-policy");

    if(!policyUrl || !modal) return;

    policyUrl.addEventListener("click", async (event) => {
        event.preventDefault();

        try{
            const result = await fetch(`privacy_polices/${policyVersion}.html`);
            if(!result.ok) throw new Error("No se pudo cargar el archivo. Intentalo mas tarde");
            const policyText = await result.text();
            content.innerHTML = policyText;
            modal.showModal();
        }catch(e){
            content.innerHTML = `<p style="color:red;">Error al cargar el aviso de privacidad.</p>`;
            modal.showModal();
        }
    });
    closeButton.addEventListener("click", (event) => {
        event.preventDefault();
        modal.close();
    });
}