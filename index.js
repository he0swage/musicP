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

// --- YOUTUBE SEARCH ONLY ---
// Search YouTube for music videos
async function searchYouTube() {
    const query = searchInput.value.trim();
    if (!query) return;

    songList.innerHTML = ""; // reset

    // Crée un message temporaire
    const loading = document.createElement('div');
    loading.style.padding = '16px';
    loading.textContent = 'Searching YouTube...';
    songList.appendChild(loading);

    try {
        // Générer des liens YouTube Search (sans API ni proxy)
        const results = [];
        for (let i = 1; i <= 12; i++) { // simulate 12 results
            results.push({
                title: `Result ${i} for "${query}"`,
                videoId: '', // vide car pas de vraie vidéo
                external_url: `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`,
            });
        }

        // Afficher les résultats
        songList.innerHTML = "";
        results.forEach(r => {
            const div = document.createElement('div');
            div.style.marginBottom = '8px';
            div.style.padding = '8px';
            div.style.background = 'rgba(255,255,255,0.05)';
            div.style.cursor = 'default';
            div.textContent = r.title;
            // No click event: do not open YouTube
            songList.appendChild(div);
        });

    } catch (err) {
        songList.innerHTML = '<div style="padding:16px;color:#ff4466;">Failed to search YouTube. Try again later.</div>';
        console.error('YouTube search error:', err);
    }
}


// Event listeners
searchBtn.addEventListener("click", searchYouTube);
searchInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") searchYouTube();
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
