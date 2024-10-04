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
        logSVG()
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


async function logSVG() {
    
}




