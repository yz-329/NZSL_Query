
async function fetchVersion() {
    version_url = "https://cws.auckland.ac.nz/nzsl/api/Version";
    const response = await fetch(version_url);
    const version_text = await response.text();

    const resultDiv = document.getElementById('version');

    resultDiv.innerHTML = `<p>${version_text}</p>`;
}

window.onload = fetchVersion;


function openTab(tabName) {
    alert(tabName);
}

function fetchSignId(id) {
    let url = "https://cws.auckland.ac.nz/nzsl/api/SignImage/" + "${id}"
    return url
}

async function fetchAllSigns() {
    try{
        url = "https://cws.auckland.ac.nz/nzsl/api/AllSigns";
        const resp = await fetch(url)
        const list_image = await resp.json()

        for (const image of list_image) {
            const imageItem = document.createElement("img");
            imageItem.src = fetchSignId(list_image.id);

        }
    }
    catch{
        console.log("failed")
    }
    
}

