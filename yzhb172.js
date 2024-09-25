async function fetchVersion() {
    version_url = "https://cws.auckland.ac.nz/nzsl/api/Version";
    const response = await fetch(version_url);
    const version_text = await response.text();

    const resultDiv = document.getElementById('version');

    resultDiv.innerHTML = `<p>${version_text}</p>`;
}


function openTab(tabName) {
    alert(tabName);
}

window.onload = fetchVersion;