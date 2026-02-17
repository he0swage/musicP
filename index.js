// Spotify client id: register an app at https://developer.spotify.com/dashboard/
// Then set the CLIENT_ID value below. Also register the redirect URI to
// point to this app (e.g. https://yourdomain.com/index.html).
const SPOTIFY_CLIENT_ID = "YOUR_SPOTIFY_CLIENT_ID_HERE";
const SPOTIFY_SCOPES = ""; // no scopes required for search/preview

// Token storage keys
const TOKEN_KEY = "spotify_access_token";
const TOKEN_EXPIRES_AT = "spotify_token_expires_at";
const REFRESH_TOKEN_KEY = "spotify_refresh_token";
const CODE_VERIFIER_KEY = "spotify_code_verifier";

let audio = new Audio();

let songs = [];
let currentSongIndex = -1;
let player = null;
let playlists = [];

const songList = document.getElementById("song-list");
const searchInput = document.getElementById("search-input");
const searchBtn = document.getElementById("search-btn");
const playBtn = document.getElementById("play-btn");
const pauseBtn = document.getElementById("pause-btn");
const skipBtn = document.getElementById("skip-btn");
const currentTitle = document.getElementById("current-title");
const progress = document.getElementById("progress");
const youtubePlayer = document.getElementById("youtube-player");
const playlistsList = document.getElementById("playlists-list");
const newPlaylistInput = document.getElementById("new-playlist-input");
const createPlaylistBtn = document.getElementById("create-playlist-btn");

// Load playlists from localStorage
function loadPlaylists() {
    const saved = localStorage.getItem("musicPPlaylists");
    playlists = saved ? JSON.parse(saved) : [];
    
    // Ensure "Liked Songs" playlist exists
    if (!playlists.find(p => p.id === "liked-songs")) {
        playlists.unshift({
            id: "liked-songs",
            name: "❤️ Liked Songs",
            songs: [],
            isLiked: true
        });
        savePlaylists();
    }
    
    displayPlaylists();
}

// Save playlists to localStorage
function savePlaylists() {
    localStorage.setItem("musicPPlaylists", JSON.stringify(playlists));
    displayPlaylists();
}

// Create new playlist
function createPlaylist() {
    const name = newPlaylistInput.value.trim();
    if (!name) {
        alert("Please enter a playlist name");
        return;
    }
    playlists.push({
        id: Date.now(),
        name: name,
        songs: []
    });
    newPlaylistInput.value = "";
    savePlaylists();
}

// Add song to playlist
function addSongToPlaylist(playlistId, song) {
    const playlist = playlists.find(p => p.id === playlistId);
    if (playlist) {
        // Check if song already exists
        if (!playlist.songs.find(s => s.videoId === song.videoId)) {
            playlist.songs.push(song);
            savePlaylists();
            alert(`✓ Added "${song.title}" to "${playlist.name}"`);
        } else {
            alert("This song is already in the playlist");
        }
    }
}

// Rename playlist
function renamePlaylist(playlistId) {
    if (playlistId === "liked-songs") {
        alert("Cannot rename the Liked Songs playlist!");
        return;
    }
    const playlist = playlists.find(p => p.id === playlistId);
    if (!playlist) return;
    
    const newName = prompt(`Rename "${playlist.name}" to:`, playlist.name);
    if (newName && newName.trim()) {
        playlist.name = newName.trim();
        savePlaylists();
    }
}

// Delete playlist
function deletePlaylist(playlistId) {
    if (playlistId === "liked-songs") {
        alert("Cannot delete the Liked Songs playlist!");
        return;
    }
    if (confirm("Are you sure you want to delete this playlist?")) {
        playlists = playlists.filter(p => p.id !== playlistId);
        savePlaylists();
    }
}

// Remove song from playlist
function removeSongFromPlaylist(playlistId, videoId) {
    const playlist = playlists.find(p => p.id === playlistId);
    if (playlist) {
        playlist.songs = playlist.songs.filter(s => s.videoId !== videoId);
        savePlaylists();
    }
}

// Display playlists
function displayPlaylists() {
    playlistsList.innerHTML = "";
    playlists.forEach(playlist => {
        const playlistDiv = document.createElement("div");
        playlistDiv.className = "playlist-item";
        
        const header = document.createElement("div");
        header.className = "playlist-header";
        
        let actionHTML = '';
        if (playlist.id !== "liked-songs") {
            actionHTML = `<div class="playlist-actions">
                <button onclick="renamePlaylist('${playlist.id}')" title="Rename"><i class="fas fa-pen"></i></button>
                <button onclick="deletePlaylist('${playlist.id}')" title="Delete"><i class="fas fa-trash"></i></button>
            </div>`;
        }
        
        header.innerHTML = `
            <span>${playlist.name}</span>
            ${actionHTML}
        `;
        
        const songsInfo = document.createElement("div");
        songsInfo.className = "playlist-songs";
        songsInfo.textContent = `${playlist.songs.length} song${playlist.songs.length !== 1 ? 's' : ''}`;
        
        playlistDiv.appendChild(header);
        playlistDiv.appendChild(songsInfo);
        
        // Display songs in playlist
        if (playlist.songs.length > 0) {
            const songsList = document.createElement("div");
            songsList.style.fontSize = "12px";
            songsList.style.maxHeight = "150px";
            songsList.style.overflowY = "auto";
            songsList.style.borderTop = "1px solid rgba(29, 185, 84, 0.3)";
            songsList.style.paddingTop = "8px";
            
            playlist.songs.forEach(song => {
                const songEl = document.createElement("div");
                songEl.style.display = "flex";
                songEl.style.justifyContent = "space-between";
                songEl.style.alignItems = "center";
                songEl.style.marginBottom = "5px";
                songEl.style.color = "rgba(255, 255, 255, 0.8)";
                songEl.style.cursor = "pointer";
                
                const title = document.createElement("span");
                title.textContent = song.title.substring(0, 30) + (song.title.length > 30 ? "..." : "");
                title.style.flex = "1";
                title.style.cursor = "pointer";
                title.onclick = () => playVideo(song.videoId);
                
                const removeBtn = document.createElement("button");
                removeBtn.style.width = "20px";
                removeBtn.style.height = "20px";
                removeBtn.style.padding = "0";
                removeBtn.style.margin = "0";
                removeBtn.style.fontSize = "10px";
                removeBtn.style.background = "rgba(220, 53, 69, 0.6)";
                removeBtn.style.border = "none";
                removeBtn.style.borderRadius = "3px";
                removeBtn.style.color = "white";
                removeBtn.style.cursor = "pointer";
                removeBtn.onclick = () => removeSongFromPlaylist(playlist.id, song.videoId);
                removeBtn.innerHTML = '<i class="fas fa-times"></i>';
                
                songEl.appendChild(title);
                songEl.appendChild(removeBtn);
                songsList.appendChild(songEl);
            });
            playlistDiv.appendChild(songsList);
        }
        
        playlistsList.appendChild(playlistDiv);
    });
}

// Event listeners for playlist
createPlaylistBtn.addEventListener("click", createPlaylist);
newPlaylistInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") createPlaylist();
});

// Update displaySongs to add "Add to Playlist" button
function displaySongs() {
    songList.innerHTML = "";
    songs.forEach((song, index) => {
        const songContainer = document.createElement("div");
        songContainer.style.display = "flex";
        songContainer.style.alignItems = "center";
        songContainer.style.gap = "8px";
        
        const div = document.createElement("div");
        div.textContent = song.title;
        div.classList.add("song-item");
        div.style.flex = "1";

        div.addEventListener("click", () => {
            currentSongIndex = index;
            currentTitle.textContent = song.title;
            if (song.preview_url) {
                playPreview(song);
            } else if (song.videoId && player) {
                playVideo(song.videoId);
            } else {
                alert('Preview not available for this track.');
            }
        });

        const heartBtn = document.createElement("button");
        heartBtn.style.width = "35px";
        heartBtn.style.height = "35px";
        heartBtn.style.padding = "0";
        heartBtn.style.margin = "0";
        heartBtn.style.fontSize = "16px";
        heartBtn.style.background = "transparent";
        heartBtn.style.border = "none";
        heartBtn.style.cursor = "pointer";
        heartBtn.style.transition = "all 0.3s ease";
        heartBtn.title = "Add to Liked Songs";
        heartBtn.innerHTML = '♥️';
        heartBtn.style.color = isSongLiked(song.videoId) ? "#ff4466" : "rgba(255, 255, 255, 0.5)";
        heartBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            toggleLikeSong(song, heartBtn);
        });
        heartBtn.addEventListener("mouseover", () => {
            heartBtn.style.transform = "scale(1.2)";
        });
        heartBtn.addEventListener("mouseout", () => {
            heartBtn.style.transform = "scale(1)";
        });

        const addBtn = document.createElement("button");
        addBtn.style.width = "35px";
        addBtn.style.height = "35px";
        addBtn.style.padding = "0";
        addBtn.style.margin = "0";
        addBtn.style.fontSize = "14px";
        addBtn.style.background = "rgba(29, 185, 84, 0.5)";
        addBtn.title = "Add to Playlist";
        addBtn.innerHTML = '<i class="fas fa-plus"></i>';
        addBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            if (playlists.length <= 1) {
                alert("Create a playlist first!");
                return;
            }
            showPlaylistOptions(song);
        });

        // small info / actions (preview badge + open in Spotify)
        const infoDiv = document.createElement('div');
        infoDiv.style.display = 'flex';
        infoDiv.style.alignItems = 'center';
        infoDiv.style.gap = '8px';

        if (song.preview_url) {
            const previewBadge = document.createElement('span');
            previewBadge.textContent = 'Preview';
            previewBadge.style.fontSize = '12px';
            previewBadge.style.padding = '4px 8px';
            previewBadge.style.borderRadius = '8px';
            previewBadge.style.background = 'rgba(0,0,0,0.18)';
            previewBadge.style.color = 'white';
            infoDiv.appendChild(previewBadge);
        }

        if (song.external_url) {
            const openBtn = document.createElement('button');
            openBtn.style.width = '36px';
            openBtn.style.height = '36px';
            openBtn.style.padding = '0';
            openBtn.style.margin = '0';
            openBtn.style.fontSize = '14px';
            openBtn.title = 'Open in Spotify';
            openBtn.innerHTML = '<i class="fab fa-spotify"></i>';
            openBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                window.open(song.external_url, '_blank');
            });
            infoDiv.appendChild(openBtn);
        }

        songContainer.insertBefore(infoDiv, heartBtn);

        songContainer.appendChild(div);
        songContainer.appendChild(heartBtn);
        songContainer.appendChild(addBtn);
        songList.appendChild(songContainer);
    });
}

// Show playlist options when adding song
function showPlaylistOptions(song) {
    const playlistOptions = playlists.map(p => `${p.name} (${p.id})`).join("\n");
    const selected = prompt(`Add to which playlist?\n\n${playlists.map((p, i) => `${i + 1}. ${p.name}`).join("\n")}`);
    if (selected) {
        const index = parseInt(selected) - 1;
        if (index >= 0 && index < playlists.length) {
            addSongToPlaylist(playlists[index].id, song);
        }
    }
}

// Like/Unlike a song
function toggleLikeSong(song, heartBtn) {
    const likedPlaylist = playlists.find(p => p.id === "liked-songs");
    if (!likedPlaylist) return;
    
    const isLiked = likedPlaylist.songs.find(s => s.videoId === song.videoId);
    
    if (isLiked) {
        removeSongFromPlaylist(likedPlaylist.id, song.videoId);
        heartBtn.style.color = "rgba(255, 255, 255, 0.5)";
    } else {
        addSongToPlaylist(likedPlaylist.id, song);
        heartBtn.style.color = "#ff4466";
    }
}

// Check if song is liked
function isSongLiked(videoId) {
    const likedPlaylist = playlists.find(p => p.id === "liked-songs");
    return likedPlaylist && likedPlaylist.songs.find(s => s.videoId === videoId);
}

// Load YouTube IFrame API
const tag = document.createElement("script");
tag.src = "https://www.youtube.com/iframe_api";
const firstScriptTag = document.getElementsByTagName("script")[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

// Initialize YouTube player when API is ready
function onYouTubeIframeAPIReady() {
    console.log("YouTube API ready, initializing player...");
    player = new YT.Player("youtube-player", {
        height: "0",
        width: "0",
        videoId: "",
        playerVars: {
            autoplay: 1,
            controls: 0,
            modestbranding: 1,
            rel: 0
        },
        events: {
            onReady: onPlayerReady,
            onStateChange: onPlayerStateChange,
            onError: onPlayerError
        }
    });
}

function onPlayerReady(event) {
    console.log("✓ YouTube Player initialized and ready!");
}

function onPlayerStateChange(event) {
    if (event.data === YT.PlayerState.ENDED) {
        skipSong();
    }
    if (event.data === YT.PlayerState.UNSTARTED) {
        // Video failed to load or is restricted
        console.warn("Video cannot be played (embedding disabled)");
    }
    if (event.data === YT.PlayerState.CUED) {
        console.log("Video ready to play");
    }
}

function onPlayerError(event) {
    console.error("YouTube Player Error:", event.data);
    // Error codes: 2=invalid param, 5=HTML5 player error, 100=video not found, 101/150=cannot be played embedded
    if (event.data === 150 || event.data === 101) {
        console.warn("⚠️ This video cannot be embedded. Skipping...");
        alert("⚠️ This video cannot be played (embedding disabled by copyright holder). Skipping...");
        skipSong();
    }
}

// --- Spotify PKCE helpers and search (uses preview_url for playback) ---
function base64UrlEncode(str) {
    return btoa(String.fromCharCode.apply(null, new Uint8Array(str)))
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/, "");
}

async function sha256(plain) {
    const encoder = new TextEncoder();
    const data = encoder.encode(plain);
    return await crypto.subtle.digest('SHA-256', data);
}

function generateCodeVerifier(length = 128) {
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);
    return base64UrlEncode(array);
}

async function generateCodeChallenge(verifier) {
    const hashed = await sha256(verifier);
    return base64UrlEncode(hashed);
}

function getRedirectUri() {
    return window.location.origin + window.location.pathname;
}

function saveToken(token, expiresIn) {
    localStorage.setItem(TOKEN_KEY, token);
    const expiresAt = Date.now() + (expiresIn * 1000) - 5000; // small buffer
    localStorage.setItem(TOKEN_EXPIRES_AT, expiresAt.toString());
}

function saveRefreshToken(refreshToken) {
    if (refreshToken) localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
}

function getSavedToken() {
    const token = localStorage.getItem(TOKEN_KEY);
    const expires = parseInt(localStorage.getItem(TOKEN_EXPIRES_AT) || '0', 10);
    if (!token || Date.now() > expires) return null;
    return token;
}

async function redirectToSpotifyAuth() {
    if (!SPOTIFY_CLIENT_ID || SPOTIFY_CLIENT_ID.includes('YOUR_SPOTIFY')) {
        alert('Please set the SPOTIFY_CLIENT_ID constant in index.js with your app client id.');
        return;
    }
    const verifier = generateCodeVerifier();
    localStorage.setItem(CODE_VERIFIER_KEY, verifier);
    const challenge = await generateCodeChallenge(verifier);
    const params = new URLSearchParams({
        client_id: SPOTIFY_CLIENT_ID,
        response_type: 'code',
        redirect_uri: getRedirectUri(),
        code_challenge_method: 'S256',
        code_challenge: challenge,
        scope: SPOTIFY_SCOPES,
        show_dialog: 'true'
    });
    window.location.href = `https://accounts.spotify.com/authorize?${params.toString()}`;
}

async function exchangeCodeForToken(code) {
    const verifier = localStorage.getItem(CODE_VERIFIER_KEY);
    if (!verifier) throw new Error('Code verifier not found in localStorage');

    const body = new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: getRedirectUri(),
        client_id: SPOTIFY_CLIENT_ID,
        code_verifier: verifier
    });

    const res = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: body.toString()
    });
    const data = await res.json();
    if (data.error) throw new Error(data.error_description || data.error);
    saveToken(data.access_token, data.expires_in || 3600);
    saveRefreshToken(data.refresh_token);
    return data.access_token;
}

async function refreshAccessToken() {
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
    if (!refreshToken) return null;

    const body = new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        client_id: SPOTIFY_CLIENT_ID
    });

    const res = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: body.toString()
    });
    const data = await res.json();
    if (data.error) {
        console.error('Refresh token error', data);
        // Clear refresh token if invalid
        localStorage.removeItem(REFRESH_TOKEN_KEY);
        return null;
    }
    saveToken(data.access_token, data.expires_in || 3600);
    if (data.refresh_token) saveRefreshToken(data.refresh_token);
    return data.access_token;
}

async function ensureTokenOrAuthorize() {
    const token = getSavedToken();
    if (token) return token;
    // Try refresh token flow before redirecting
    const refreshed = await refreshAccessToken();
    if (refreshed) return refreshed;
    const url = new URL(window.location.href);
    const code = url.searchParams.get('code');
    if (code) {
        try {
            const t = await exchangeCodeForToken(code);
            // remove code from url
            url.searchParams.delete('code');
            window.history.replaceState({}, document.title, url.pathname + url.search + url.hash);
            return t;
        } catch (err) {
            console.error('Token exchange failed:', err);
            alert('Spotify authentication failed: ' + err.message);
            return null;
        }
    }
    // No token and no code -> redirect to authorize
    await redirectToSpotifyAuth();
    return null;
}

// Search Spotify tracks and store preview_url for playback
async function searchSpotify() {
    const query = searchInput.value.trim();
    if (!query) {
        alert('Please enter a search term');
        return;
    }

    const token = await ensureTokenOrAuthorize();
    if (!token) return; // ensureTokenOrAuthorize redirected or failed

    try {
        const url = `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=12`;
        const res = await fetch(url, { headers: { Authorization: 'Bearer ' + token } });
        const data = await res.json();
        if (data.error) {
            // If token expired or invalid, clear it and try again once
            if (data.error.status === 401) {
                localStorage.removeItem(TOKEN_KEY);
                const retryToken = await ensureTokenOrAuthorize();
                if (retryToken) return await searchSpotify();
            }
            throw new Error(data.error.message || JSON.stringify(data.error));
        }

        if (data.tracks && data.tracks.items.length > 0) {
            songs = data.tracks.items.map(t => ({
                title: `${t.name} — ${t.artists.map(a => a.name).join(', ')}`,
                spotifyId: t.id,
                videoId: t.id, // reuse playlist logic
                preview_url: t.preview_url,
                external_url: t.external_urls && t.external_urls.spotify
            }));
            displaySongs();
        } else {
            alert('No results found. Try another search.');
        }
    } catch (err) {
        console.error('Spotify search error:', err);
        alert('Error searching Spotify: ' + err.message);
    }
}

function playVideo(videoId) {
    if (!videoId) {
        alert("Error: No video ID provided");
        return;
    }
    
    if (!player) {
        console.error("❌ Player not initialized yet. Try again in a moment.");
        alert("Player is initializing... Please try again in a moment.");
        return;
    }
    
    console.log("Playing video:", videoId);
    try {
        player.loadVideoById(videoId);
        player.playVideo();
    } catch (err) {
        console.error("Error playing video:", err);
    }
}

function skipSong() {
    if (songs.length === 0) return;
    if (currentSongIndex < songs.length - 1) {
        currentSongIndex++;
    } else {
        currentSongIndex = 0;
    }
    playCurrentSong();
}

function playPreview(song) {
    if (!song || !song.preview_url) {
        alert('No preview available for this track.');
        return;
    }
    try {
        audio.src = song.preview_url;
        audio.play().catch(err => console.warn('Audio play failed:', err));
    } catch (err) {
        console.error('Error playing preview:', err);
    }
}

function playCurrentSong() {
    if (songs.length === 0) return;
    const song = songs[currentSongIndex];
    currentTitle.textContent = song.title;
    if (song.preview_url) {
        playPreview(song);
    } else if (song.videoId && player) {
        playVideo(song.videoId);
    } else {
        alert('This track cannot be played (no preview or embeddable video).');
    }
}

// Event listeners
searchBtn.addEventListener("click", searchSpotify);
searchInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") searchSpotify();
});

// Play
playBtn.addEventListener("click", () => {
    if (audio && audio.src) {
        audio.play().catch(err => console.warn('Audio play failed:', err));
    } else if (player) {
        player.playVideo();
    }
});

// Pause
pauseBtn.addEventListener("click", () => {
    if (audio && !audio.paused) {
        audio.pause();
    } else if (player) {
        player.pauseVideo();
    }
});

// Skip
skipBtn.addEventListener("click", () => {
    if (songs.length === 0) return;
    if (currentSongIndex < songs.length - 1) {
        currentSongIndex++;
    } else {
        currentSongIndex = 0;
    }
    playCurrentSong();
});

// Update progress bar (supports audio preview or YouTube player)
setInterval(() => {
    if (audio && audio.duration && !isNaN(audio.duration) && audio.duration > 0) {
        progress.value = (audio.currentTime / audio.duration) * 100;
    } else if (player && player.getDuration && player.getDuration()) {
        progress.value = (player.getCurrentTime() / player.getDuration()) * 100;
    }
}, 1000);

// Progress bar seek
progress.addEventListener("input", () => {
    if (audio && audio.duration && !isNaN(audio.duration) && audio.src) {
        const newTime = (progress.value / 100) * audio.duration;
        audio.currentTime = newTime;
    } else if (player && player.getDuration && player.getDuration()) {
        const newTime = (progress.value / 100) * player.getDuration();
        player.seekTo(newTime);
    }
});

// Initialize playlists on page load
window.addEventListener("DOMContentLoaded", () => {
    loadPlaylists();
});

// Register service worker for PWA (if supported)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js')
            .then(reg => console.log('ServiceWorker registered:', reg))
            .catch(err => console.warn('ServiceWorker registration failed:', err));
    });
}
