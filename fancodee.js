const matchContainer = document.getElementById("matchContainer");
const JSON_URL = "https://raw.githubusercontent.com/doctor-8trange/zyphx8/refs/heads/main/data/fancode.json";

async function loadMatches() {
    matchContainer.innerHTML = `
        <p style="color: var(--text-muted); font-weight: 700; text-align: center; grid-column: 1 / -1; letter-spacing: 1px;">
            LOADING FANCODE EVENTS...
        </p>
    `;

    try {
        const response = await fetch(JSON_URL);

        if (!response.ok) {
            throw new Error("Failed to load JSON data from GitHub.");
        }

        const data = await response.json();
        const matches = Array.isArray(data) ? data : data.matches || [];

        if (!matches.length) {
            matchContainer.innerHTML = `
                <p style="color: var(--text-muted); font-weight: 700; text-align: center; grid-column: 1 / -1; letter-spacing: 1px;">
                    NO FANCODE EVENTS AVAILABLE AT THIS TIME.
                </p>
            `;
            return;
        }

        const playIcon = `
            <svg viewBox="0 0 24 24">
                <polygon points="5 3 19 12 5 21 5 3"></polygon>
            </svg>
        `;

        const clockIcon = `
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
        `;

        const globeIcon = `
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="2" y1="12" x2="22" y2="12"></line>
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
            </svg>
        `;

        let html = "";

        matches.forEach((match, index) => {
            const title = match.title || "Live Match";
            const tournament = match.tournament || "FanCode Event";
            const match_id = match.match_id || index;
            const startTime = match.startTime || "TBA";
            const image = match.image || "https://via.placeholder.com/800x450/1E293B/94A3B8?text=NO+IMAGE";
            const language = match.language || "ENGLISH";
            const statusText = match.status || "UPCOMING";
            const streamingStatus = match.streamingStatus || "";
            const auto_streams = match.auto_streams || [];
            
            const hasLinks = auto_streams.length > 0;
            const isStreamingStatusStarted = streamingStatus.toUpperCase() === "STARTED";

            let finalStatus = statusText.toUpperCase();
            
            if (hasLinks || isStreamingStatusStarted) {
                finalStatus = "LIVE"; 
            } else if (finalStatus !== "LIVE") {
                finalStatus = "UPCOMING";
            }
            
            const isLive = finalStatus === "LIVE";
            const dotColor = isLive ? "#EF4444" : "#F59E0B";

            html += `
                <div class="match-card">
                    <a href="${isLive ? `player.html?id=${match_id}` : '#'}" style="${!isLive ? 'cursor: not-allowed;' : ''}">
                        <div class="card-thumb">
                            <img
                                src="${image}"
                                alt="${title}"
                                loading="lazy"
                                onerror="this.src='https://via.placeholder.com/800x450/1E293B/94A3B8?text=NO+IMAGE'"
                            >
                            <span class="status-badge">
                                <div style="width:8px; height:8px; border-radius:50%; background:${dotColor}; margin-right: 6px;"></div>
                                ${finalStatus}
                            </span>
                        </div>

                        <div class="card-details">
                            <div class="card-info">
                                <h3>${title}</h3>
                                <p>${tournament}</p>

                                <div style="display: flex; flex-wrap: wrap; gap: 8px; margin-top: 8px;">
                                    <div class="time-pill">
                                        ${clockIcon}
                                        <span>${startTime}</span>
                                    </div>
                                    
                                    <div class="time-pill">
                                        ${globeIcon}
                                        <span>${language}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </a>

                    <div class="card-actions">
                        <button
                            class="btn-play"
                            onclick="${isLive ? `window.location.href='player.html?id=${match_id}'` : ''}"
                            ${!isLive ? `style="background: #334155; color: #94A3B8; box-shadow: none; cursor: not-allowed;" disabled` : ""}
                        >
                            ${playIcon}
                            ${isLive ? "WATCH STREAM" : "UPCOMING EVENT"}
                        </button>
                    </div>
                </div>
            `;
        });

        matchContainer.innerHTML = html;

    } catch (error) {
        console.error("Error loading JSON:", error);
        matchContainer.innerHTML = `
            <p style="color: var(--danger); font-weight: 700; text-align: center; grid-column: 1 / -1; letter-spacing: 1px;">
                ERROR LOADING FANCODE DATA. PLEASE REFRESH THE PAGE.
            </p>
        `;
    }
}

document.addEventListener("DOMContentLoaded", () => {
    loadMatches();
    setInterval(loadMatches, 60000);
});
