async function fetchVersion() {
    let version_url = "https://cws.auckland.ac.nz/nzsl/api/Version";
    const response = await fetch(version_url);
    const version_text = await response.text();

    const resultDiv = document.getElementById("version");

    resultDiv.innerHTML = `<p>${version_text}</p>`;
}

window.onload = function() {
    fetchVersion();
    document.getElementById("defaultOpen").click();
    localStorage.clear();
};


function openTab(tabName) {
    const tabs = document.getElementsByClassName("main-container");   
    
    for (i = 0; i < tabs.length; i++) {
        tabs[i].style.display = "none";
    }
    document.getElementById(tabName).style.display = "flex";
    if (tabName == "nzsl") {
        fetchAllSigns();
        searchSign();
    }
    else if(tabName == "events") {
        fetchEvent();
    }
    else if (tabName == "user") {
        register();
        login();
    }
    else if (tabName == "guest-book") {
        postComment();
        loadComment();
    }
    else if (tabName == "log") {
        logSVG();
    }
 
}


// fetch signs
function displayNZSL(imageList) {
    const imageContainer = document.getElementById("image-container");
    imageContainer.innerHTML = '';

    imageList.forEach(async element => {
        const imageUrl = await fetchSignId(element.id);

        if (imageUrl) {
            const imageItem = document.createElement("div");
            imageItem.classList.add("image-item");

            const image = document.createElement("img");
            image.src = imageUrl;
            image.alt = element.description;

            const description = document.createElement("p");
            description.classList.add("description");
            description.innerText = element.description;

            imageItem.appendChild(image);
            imageItem.appendChild(description);
            imageContainer.appendChild(imageItem);
        }
    });
}


async function fetchSignId(id) {
    try {
        const url = `https://cws.auckland.ac.nz/nzsl/api/SignImage/${id}`
        const resp = await fetch(url)
        const image = await resp.blob()

        return URL.createObjectURL(image)
    }
    catch {
        return null
    }
    
}

async function fetchAllSigns() {
    try{
        let url = "https://cws.auckland.ac.nz/nzsl/api/AllSigns";
        const resp = await fetch(url);
        const imageList = await resp.json();

        displayNZSL(imageList);
    }
    catch {
        console.log("failed");
    }
    
}

async function searchSign() {
    document.getElementById("search-form").addEventListener("submit", async function(event) {
        event.preventDefault(); 

        const userInput = document.getElementById("search-input").value;

        console.log(userInput)

        const response = await fetch(`https://cws.auckland.ac.nz/nzsl/api/Signs/${encodeURIComponent(userInput)}`)

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const image = await response.json();
        displayNZSL(image);

    });
}

function convertToNZTime(utcDate) {
    function formatDateString(dateString) {
        return dateString.slice(0, 4) + '-' + dateString.slice(4, 6) + '-' + dateString.slice(6, 8) + 'T' + dateString.slice(9, 11) + ':' + dateString.slice(11, 13) + ':' + dateString.slice(13, 15) + 'Z';
    }

    const localDate = new Date(formatDateString(utcDate));

    return localDate.toLocaleString('en-NZ', {
        timeZone: 'Pacific/Auckland',
      });
    
}


function parseICalendar(calendarText) {
    const lines = calendarText.split('\n');
    const eventObj = {};

    lines.forEach(line => {
        const [key, ...value] = line.split(':');
        if (value.length) {
            eventObj[key.trim()] = value.join(':').trim();
        }
    });

    return eventObj;
}


async function fetchEvent() {
    // alert("called");
    const resp = await fetch("https://cws.auckland.ac.nz/nzsl/api/EventCount");
    const numEvent = await resp.json();
    // alert(numEvent);
    const container = document.getElementById('events-container');
    container.innerHTML = '';
    

    for (i = 0; i < numEvent; i++) {
            const eventUrl = `https://cws.auckland.ac.nz/nzsl/api/Event/${i}`;

            const eventResponse = await fetch(eventUrl);
            // alert("response captured")
            const eventText = await eventResponse.text();
            const eventObj = parseICalendar(eventText);
            // alert("evnet object created");

            const eventItem = document.createElement('div');
            eventItem.className = 'event-item';

            eventItem.innerHTML = `
                <h3>${eventObj.SUMMARY}</h3>
                <p>${eventObj.DESCRIPTION}</p>
                <p><strong>Location:</strong> ${eventObj.LOCATION}</p>
                <p><strong>Start:</strong> ${convertToNZTime(eventObj.DTSTART)}</p>
                <p><strong>End:</strong> ${convertToNZTime(eventObj.DTEND)}</p>
            `;
            
            // alert("append child succ")

            const downloadButton = document.createElement('button');
            downloadButton.innerText = 'Download Event';
            
            downloadButton.addEventListener('click', () => {
                const a = document.createElement('a');
                a.href = eventUrl;

                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url); 
            });
            eventItem.appendChild(downloadButton);
            container.appendChild(eventItem);

    }
}


async function register() {
    document.getElementById("registration-form").addEventListener("submit", async function(event) {
        event.preventDefault(); 

        const username = document.getElementById("username-input").value;
        const password = document.getElementById("password-input").value;
        const addr = document.getElementById("addr-input").value;

        const userDetail = JSON.stringify({"username": username, "password": password, "address": addr});

        const resp = await fetch("https://cws.auckland.ac.nz/nzsl/api/Register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: userDetail,
        });

        if (resp.ok) {
            let message = await resp.text();
            alert(message);
            
        }

        document.getElementById("username-input").value = '';
        document.getElementById("password-input").value = '';
        document.getElementById("addr-input").value = '';

    });

}

async function login() {
    document.getElementById("login-form").addEventListener("submit", async function(event) {
        event.preventDefault(); 

        const username = document.getElementById("login-username").value;
        const password = document.getElementById("login-password").value;

        // alert("entered");

        const credential = btoa(`${username}:${password}`);

        // alert("prepare login");

        const resp = await fetch("https://cws.auckland.ac.nz/nzsl/api/TestAuth", {
            headers: {
                "Authorization": `Basic ${credential}`
            },
        });

        if (resp.ok) {
            let message = await resp.text();
            localStorage.setItem("auth", credential);
            alert("Login successful: " + message);

            if (credential) {
                const container = document.getElementById("logout-container");
                container.innerHTML = '';
    
                const logout = document.createElement("button")
                logout.textContent = "You are signed in. Click to logout";
    
                logout.onclick = function () {
                    localStorage.clear();
                    alert("You have logged out");
                    logout.remove();
                }
    
                container.appendChild(logout);
            }

        } else {
            alert("Login failed");
        }

        document.getElementById("login-username").value = '';
        document.getElementById("login-password").value = '';

    });
}


async function loadComment() {
    const container = document.getElementById("comment-container");
    container.innerHTML = '';
    const iframe = document.createElement('iframe');
    iframe.src = "https://cws.auckland.ac.nz/nzsl/api/Comments";

    container.appendChild(iframe);
}

async function postComment() {
    
    document.getElementById("comment-form").addEventListener("submit", async function(event) {
        event.preventDefault(); 

        // alert("triggered");

        const comment = document.getElementById("comment-input").value;

        // alert("entered");

        const credential = localStorage.getItem("auth");
        if (!credential) {
            alert("You must be logged in to post a comment.");
            openTab("user");
            return;
        }

        const resp = await fetch(`https://cws.auckland.ac.nz/nzsl/api/Comment?comment=${comment}`, {
            method: "POST",
            headers: { 
                "Content-Type": "text/plain",
                "Authorization": `Basic ${credential}`,
            }
        });

        if (resp.ok) {
            let message = await resp.text();
            alert(`You have submitted comment: ${message}`);
            document.getElementById("comment-input").value = '';
        } else {
            const errorText = await resp.text();
            alert(`Failed to post the comment. Status: ${resp.status}, Error: ${errorText}`);
        }
    });
}


function findX(xIndex, lenData) {
    const position = 1000 / (lenData - 1);
    return xIndex * position;
}

function findY(y, maxY, minY) {
    return 600 - ((y - minY) / (maxY - minY)) * 600;
}


function drawPath(data, attr, maxY, minY) {

    let path = `M ${findX(0, data.length)} ${findY(data[0][attr], maxY, minY)}`;

    for (let i = 1; i < data.length; i++) {
        path += ` L ${findX(i, data.length)} ${findY(data[i][attr], maxY, minY)}`;
    }

    return path;
}


async function logSVG() {
    let width = 1000;
    const container = document.getElementById("log-container");
    container.innerHTML = '';

    let ns = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(ns, "svg");
    svg.setAttribute("viewBox", `0 0 ${width} 600`);
    svg.style.border = "2px solid black";

    const resp = await fetch("https://cws.auckland.ac.nz/nzsl/api/Log");
    const data = await resp.json();

    const allVisits = data.map(item => item.visits);
    const allUniqueVisits = data.map(item => item.uniqueVisits);

    // alert(allVisits);
    // alert(allUniqueVisits);


    // y-axis label
    const maxY = Math.max(...allVisits, ...allUniqueVisits);
    const minY = Math.min(...allVisits, ...allUniqueVisits);

    const YLabelMax = document.createElementNS(ns, "text");
    YLabelMax.textContent = `${maxY}`;
    YLabelMax.setAttribute('x', 10);
    YLabelMax.setAttribute('y', 17);
    YLabelMax.setAttribute('font-size', '18');
    YLabelMax.setAttribute('fill', 'black');

    const YLabelMin = document.createElementNS(ns, "text");
    YLabelMin.textContent = `${minY}`;
    YLabelMin.setAttribute('x', 10);
    YLabelMin.setAttribute('y', 600);
    YLabelMin.setAttribute('font-size', '18');
    YLabelMin.setAttribute('fill', 'black');

    svg.appendChild(YLabelMax);
    svg.appendChild(YLabelMin);


    const allDate = data.map(item => item.date);
    const minX = allDate[0];
    const maxX = allDate[allDate.length - 1];

    // alert(`${minX}, ${maxX}`);
    
    const lineVisit = document.createElementNS(ns, 'path')
    const lineUniq = document.createElementNS(ns, 'path')
    
    const pathVisit = drawPath(data, 'visits', maxY, minY);
    lineVisit.setAttribute("d", pathVisit);
    lineVisit.setAttribute("fill", "none");
    lineVisit.setAttribute("stroke", "blue");
    lineVisit.setAttribute("stroke-width", "3");
    
    const pathUniq = drawPath(data, 'uniqueVisits', maxY, minY);
    lineUniq.setAttribute("d", pathUniq);
    lineUniq.setAttribute("fill", "none");
    lineUniq.setAttribute("stroke", "red");
    lineUniq.setAttribute("stroke-width", "3");
    
    svg.appendChild(lineVisit);
    svg.appendChild(lineUniq);
    container.appendChild(svg);


    // x-axis label  
    const axis = document.getElementById("x-axis");
    axis.innerHTML = "";
    const xLabelsvg = document.createElementNS(ns, "svg");
    xLabelsvg.setAttribute("viewBox", `0 0 ${width} 100`);

    const xLabelMin = document.createElementNS(ns, "text");
    xLabelMin.textContent = `${minX}`;
    xLabelMin.setAttribute('x', 0);
    xLabelMin.setAttribute('y', 50);
    xLabelMin.setAttribute('font-size', '24');
    xLabelMin.setAttribute('fill', 'black');

    const xLabelMax = document.createElementNS(ns, "text");
    xLabelMax.textContent = `${maxX}`;
    xLabelMax.setAttribute('x', `${width - 125}`);
    xLabelMax.setAttribute('y', 50);
    xLabelMax.setAttribute('font-size', '24');
    xLabelMax.setAttribute('fill', 'black');

    xLabelsvg.appendChild(xLabelMin);
    xLabelsvg.appendChild(xLabelMax);
    axis.appendChild(xLabelsvg);


    // legend container
    const legendContainer = document.getElementById("log-legend");
    legendContainer.innerHTML = "";
    
    const legendsvg = document.createElementNS(ns, "svg");
    legendsvg.setAttribute("viewBox", `0 0 ${width} 100`);
    
    const legend = document.createElementNS(ns, 'text');
    legend.textContent = "Legend: ";
    legend.setAttribute('x', 0);
    legend.setAttribute('y', 30);
    legend.setAttribute('font-size', '24');
    legend.setAttribute('fill', 'black');

    legendsvg.appendChild(legend);

    const legendVisit = document.createElementNS(ns, "path");
    legendVisit.setAttribute("d", "M 100 22 L 150 22");
    legendVisit.setAttribute("fill", "none");
    legendVisit.setAttribute("stroke", "blue");
    legendVisit.setAttribute("stroke-width", "3");

    const legendVisitText = document.createElementNS(ns, 'text');
    legendVisitText.textContent = "Visit";
    legendVisitText.setAttribute('x', 160);
    legendVisitText.setAttribute('y', 30);
    legendVisitText.setAttribute('font-size', '24');
    legendVisitText.setAttribute('fill', 'black');

    const legendUniq = document.createElementNS(ns, "path");
    legendUniq.setAttribute("d", "M 230 22 L 280 22");
    legendUniq.setAttribute("fill", "none");
    legendUniq.setAttribute("stroke", "red");
    legendUniq.setAttribute("stroke-width", "3");

    const legendUniqText = document.createElementNS(ns, 'text');
    legendUniqText.textContent = "Unique Visit";
    legendUniqText.setAttribute('x', 290);
    legendUniqText.setAttribute('y', 30);
    legendUniqText.setAttribute('font-size', '24');
    legendUniqText.setAttribute('fill', 'black');

    legendsvg.appendChild(legendVisit);
    legendsvg.appendChild(legendVisitText);
    legendsvg.appendChild(legendUniq);
    legendsvg.appendChild(legendUniqText);

    legendContainer.append(legendsvg);

    const allData = document.getElementById("all-data");
    allData.innerHTML = "";

    visitText = document.createElement('p');
    visitText.textContent = `${allVisits}`;

    uniqueText = document.createElement('p');
    uniqueText.textContent = `${allUniqueVisits}`;

    allData.appendChild(visitText);
    allData.appendChild(uniqueText);
    
    
    
}




