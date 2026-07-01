const matchNameEl = document.getElementById("matchName");
const matchTitleEl = document.getElementById("matchTitle");
const serverListEl = document.getElementById("serverList");
const videoElement = document.getElementById("videoPlayer");
const videoContainer = document.getElementById("videoContainer");

const JSON_URL = "https://raw.githubusercontent.com/doctor-8trange/zyphx8/refs/heads/main/data/fancode.json";

let player;
let ui;
let qualitiesData = [];
let currentQualityIndex = 0;

const urlParams = new URLSearchParams(window.location.search);
const matchId = urlParams.get("id");

if (!matchId) {
    matchNameEl.innerText = "ERROR: NO MATCH ID";
    matchTitleEl.innerText = "Please click a match from the homepage.";
    matchNameEl.style.color = "var(--danger)";
}

async function initPlayer() {
    try {
        shaka.polyfill.installAll();
        
        if (!shaka.Player.isBrowserSupported()) {
            alert("Your browser does not support the video player.");
            return;
        }

        player = new shaka.Player();
        await player.attach(videoElement);

        ui = new shaka.ui.Overlay(player, videoContainer, videoElement);
        ui.configure({
            controlPanelElements: [
                "play_pause", "time_and_duration", "mute", "volume",
                "spacer", "quality", "picture_in_picture", "fullscreen"
            ]
        });

        player.addEventListener("error", event => {
            console.error("Shaka Player Error:", event.detail);
        });

    } catch (error) {
        console.error("Initialization Error:", error);
    }
}

window.loadStream = async function (index) {
    if (!qualitiesData[index]) return;
    
    currentQualityIndex = index;
    const streamUrl = qualitiesData[index].url;

    document.querySelectorAll(".server-btn-play").forEach((btn, i) => {
        btn.classList.toggle("active", i === index);
    });

    try {
        videoElement.removeAttribute('src');
        videoElement.load();
        
        await player.unload();
        player.configure({ drm: {} });
        player.getNetworkingEngine().clearAllRequestFilters();

        await player.load(streamUrl);
        try {
            await videoElement.play();
        } catch (e) {
            console.warn("Autoplay prevented by browser.");
        }

    } catch (error) {
        console.error("Shaka Load Error, passing into native HTML5 runtime layout:", error);
        
        try {
            await player.unload();
            videoElement.src = streamUrl;
            await videoElement.play();
        } catch (fallbackError) {
            console.error("Native Playback Failed completely.", fallbackError);
        }
    }
};

async function fetchMatchData() {
    if (!matchId) return;

    try {
        const response = await fetch(JSON_URL);
        const data = await response.json();
        
        const matches = Array.isArray(data) ? data : data.matches || [];
        const match = matches.find(m => String(m.match_id) === String(matchId));

        if (!match) {
            matchNameEl.innerText = "MATCH NOT FOUND";
            return;
        }

        matchNameEl.innerText = match.title || "Live Match";
        matchTitleEl.innerText = match.tournament || "FanCode Event";

        qualitiesData = [];

        const autoPlaylist = match.auto_streams?.[0]?.auto;
        
        if (autoPlaylist) {
            const lines = autoPlaylist.split("\n");
            
            for (let i = 0; i < lines.length; i++) {
                if (lines[i].includes("#EXT-X-STREAM-INF")) {
                    const resolution = lines[i].match(/RESOLUTION=\d+x(\d+)/);
                    const quality = resolution ? resolution[1] + "p" : "STREAM";
                    const url = lines[i + 1]?.trim();

                    if (url && url.startsWith("http")) {
                        qualitiesData.push({ quality, url });
                    }
                }
            }
        }

        if (!qualitiesData.length) {
            serverListEl.innerHTML = `<p style="color:var(--text-muted); grid-column: 1 / -1; text-align: center;">No broadcast qualities available.</p>`;
            return;
        }

        serverListEl.innerHTML = qualitiesData.map((q, index) => `
            <button class="server-btn-play" onclick="loadStream(${index})">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="display:none;">
                    <polygon points="5 3 19 12 5 21 5 3"></polygon>
                </svg>
                ${q.quality}
            </button>
        `).join("");

        loadStream(0);

    } catch (error) {
        console.error("JSON Error:", error);
        matchNameEl.innerText = "ERROR LOADING MATCH";
        matchTitleEl.innerText = "Could not fetch match data.";
    }
}

document.addEventListener("DOMContentLoaded", async () => {
    await initPlayer();
    await fetchMatchData();
});
