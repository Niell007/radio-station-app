class RadioPlayer {
    audio: HTMLAudioElement;
    currentSong: any;
    playlist: any[];
    isPlaying: boolean;
    currentTab: string;
    playerElement: HTMLElement | null;
    playButton: HTMLElement | null;
    prevButton: HTMLElement | null;
    nextButton: HTMLElement | null;
    progressBar: HTMLElement | null;
    currentArt: HTMLImageElement | null;
    currentTitle: HTMLElement | null;
    currentArtist: HTMLElement | null;
    volumeControl: HTMLInputElement | null;
    tabButtons: NodeListOf<HTMLElement>;
    contentPanels: { [key: string]: HTMLElement | null };
    loginBtn: HTMLElement | null;
    loginModal: HTMLElement | null;
    loginForm: HTMLFormElement | null;

    constructor() {
        this.audio = new Audio();
        this.currentSong = null;
        this.playlist = [];
        this.isPlaying = false;
        this.currentTab = 'songs';
        this.initializeUI();
        this.setupEventListeners();
        this.audio.volume = 0.7; // Default volume
    }

    initializeUI() {
        // Player elements
        this.playerElement = document.getElementById('player');
        this.playButton = document.getElementById('playBtn');
        this.prevButton = document.getElementById('prevBtn');
        this.nextButton = document.getElementById('nextBtn');
        this.progressBar = document.getElementById('progress');
        this.currentArt = document.getElementById('currentArt') as HTMLImageElement;
        this.currentTitle = document.getElementById('currentTitle');
        this.currentArtist = document.getElementById('currentArtist');
        this.volumeControl = document.getElementById('volumeControl') as HTMLInputElement;

        // Tab elements
        this.tabButtons = document.querySelectorAll('[role="tab"]');
        this.contentPanels = {
            songs: document.getElementById('songList'),
            playlists: document.getElementById('playlistList'),
            favorites: document.getElementById('favoritesList')
        };

        // Modal elements
        this.loginBtn = document.getElementById('loginBtn');
        this.loginModal = document.getElementById('loginModal');
        this.loginForm = document.getElementById('loginForm') as HTMLFormElement;

        // Initialize volume control
        if (this.volumeControl) {
            this.volumeControl.value = this.audio.volume * 100;
        }
    }

    setupEventListeners() {
        // Player controls
        this.playButton?.addEventListener('click', () => this.togglePlay());
        this.prevButton?.addEventListener('click', () => this.playPrevious());
        this.nextButton?.addEventListener('click', () => this.playNext());
        
        // Volume control
        if (this.volumeControl) {
            this.volumeControl.addEventListener('input', (e) => {
                this.audio.volume = Number((e.target as HTMLInputElement).value) / 100;
            });
        }

        // Tab switching
        this.tabButtons.forEach(button => {
            button.addEventListener('click', () => this.switchTab(button));
        });
        
        // Audio events
        this.audio.addEventListener('timeupdate', () => this.updateProgress());
        this.audio.addEventListener('ended', () => this.playNext());

        // Modal events
        this.loginBtn?.addEventListener('click', () => this.showLoginModal());
        this.loginModal?.addEventListener('click', (e) => {
            if (e.target === this.loginModal) this.hideLoginModal();
        });
        this.loginForm?.addEventListener('submit', (e) => this.handleLogin(e));

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleKeyboardShortcuts(e));

        // Load initial content
        this.loadContent('songs');
    }

    handleKeyboardShortcuts(e: KeyboardEvent) {
        if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

        switch(e.key.toLowerCase()) {
            case ' ':
                e.preventDefault();
                this.togglePlay();
                break;
            case 'arrowright':
                if (e.ctrlKey) this.playNext();
                break;
            case 'arrowleft':
                if (e.ctrlKey) this.playPrevious();
                break;
            case 'm':
                if (e.ctrlKey) this.toggleMute();
                break;
            case 'arrowup':
                e.preventDefault();
                this.adjustVolume(0.1);
                break;
            case 'arrowdown':
                e.preventDefault();
                this.adjustVolume(-0.1);
                break;
            case 'n':
                if (e.ctrlKey) {
                    e.preventDefault();
                    this.showCreatePlaylistModal();
                }
                break;
            case 's':
                if (e.ctrlKey) {
                    e.preventDefault();
                    this.saveCurrentPlaylist();
                }
                break;
            case '/':
                e.preventDefault();
                (document.getElementById('searchInput') as HTMLInputElement).focus();
                break;
            case '1':
            case '2':
            case '3':
                const tabs = ['songs', 'playlists', 'favorites'];
                const index = parseInt(e.key) - 1;
                if (index >= 0 && index < tabs.length) {
                    const tab = document.querySelector(`[data-tab="${tabs[index]}"]`);
                    if (tab) this.switchTab(tab as HTMLElement);
                }
                break;
        }
    }

    adjustVolume(delta: number) {
        if (!this.volumeControl) return;
        const newVolume = Math.max(0, Math.min(1, this.audio.volume + delta));
        this.audio.volume = newVolume;
        this.volumeControl.value = newVolume * 100;
    }

    showCreatePlaylistModal() {
        const modal = document.getElementById('createPlaylistModal');
        if (modal) {
            modal.classList.remove('hidden');
            (document.getElementById('playlistName') as HTMLInputElement).focus();
        }
    }

    hideCreatePlaylistModal() {
        const modal = document.getElementById('createPlaylistModal');
        if (modal) {
            modal.classList.add('hidden');
            (document.getElementById('createPlaylistForm') as HTMLFormElement).reset();
        }
    }

    showShortcutsModal() {
        const modal = document.getElementById('shortcutsModal');
        if (modal) modal.classList.remove('hidden');
    }

    hideShortcutsModal() {
        const modal = document.getElementById('shortcutsModal');
        if (modal) modal.classList.add('hidden');
    }

    async saveCurrentPlaylist() {
        if (!this.currentSong) return;

        try {
            const name = prompt('Enter playlist name:');
            if (!name) return;

            const response = await fetch('/api/playlists', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    name,
                    songs: [this.currentSong.id],
                    is_public: true
                })
            });

            if (response.ok) {
                this.showNotification('Playlist created successfully');
                await this.loadPlaylists();
            } else {
                throw new Error('Failed to create playlist');
            }
        } catch (error) {
            console.error('Error saving playlist:', error);
            this.showError('Failed to create playlist');
        }
    }

    showNotification(message: string, type: 'success' | 'error' = 'success') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `fixed bottom-4 left-4 px-4 py-2 rounded ${
            type === 'success' ? 'bg-green-500' : 'bg-red-500'
        } text-white transition-opacity duration-300`;
        notification.textContent = message;

        // Add to document
        document.body.appendChild(notification);

        // Remove after delay
        setTimeout(() => {
            notification.style.opacity = '0';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    async handleSearch(query: string) {
        if (!query) return;

        try {
            const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
            const results = await response.json();
            
            // Update UI with search results
            this.renderSongs(results.songs || []);
            
            // Update URL without reload
            const url = new URL(window.location.href);
            url.searchParams.set('q', query);
            window.history.pushState({}, '', url);
        } catch (error) {
            console.error('Search error:', error);
            this.showError('Search failed');
        }
    }

    async switchTab(selectedTab: HTMLElement) {
        const tabId = selectedTab.getAttribute('data-tab');
        
        // Update tab button states
        this.tabButtons.forEach(button => {
            const isSelected = button === selectedTab;
            button.setAttribute('aria-selected', isSelected.toString());
            button.classList.toggle('text-blue-500', isSelected);
            button.classList.toggle('border-blue-500', isSelected);
            button.classList.toggle('text-gray-400', !isSelected);
        });

        // Load and show content
        await this.loadContent(tabId!);
    }

    async loadContent(tabId: string) {
        try {
            let content;
            switch(tabId) {
                case 'songs':
                    content = await this.loadSongs();
                    break;
                case 'playlists':
                    content = await this.loadPlaylists();
                    break;
                case 'favorites':
                    content = await this.loadFavorites();
                    break;
            }

            // Update visible content
            Object.entries(this.contentPanels).forEach(([id, panel]) => {
                if (panel) {
                    panel.classList.toggle('hidden', id !== tabId);
                    panel.setAttribute('aria-hidden', (id !== tabId).toString());
                }
            });

        } catch (error) {
            console.error(`Error loading ${tabId}:`, error);
            this.showError(`Failed to load ${tabId}`);
        }
    }

    async loadSongs() {
        try {
            const response = await fetch('/api/songs');
            const songs = await response.json();
            this.renderSongs(songs);
        } catch (error) {
            console.error('Failed to load songs:', error);
            this.showError('Failed to load songs');
        }
    }

    async loadPlaylists() {
        try {
            const response = await fetch('/api/playlists');
            const playlists = await response.json();
            this.renderPlaylists(playlists);
        } catch (error) {
            console.error('Failed to load playlists:', error);
            this.showError('Failed to load playlists');
        }
    }

    async loadFavorites() {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                this.showLoginModal();
                return;
            }

            const response = await fetch('/api/favorites', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const favorites = await response.json();
            this.renderFavorites(favorites);
        } catch (error) {
            console.error('Failed to load favorites:', error);
            this.showError('Failed to load favorites');
        }
    }

    renderSongs(songs: any[]) {
        if (!this.contentPanels.songs) return;
        
        this.contentPanels.songs.innerHTML = songs.map(song => `
            <div class="bg-gray-800 p-4 rounded-lg hover:bg-gray-700 cursor-pointer song-card"
                 onclick="player.playSong(${JSON.stringify(song)})"
                 role="button"
                 tabindex="0"
                 aria-label="Play ${song.title} by ${song.artist}">
                <img src="${song.cover_art_url || '/assets/default-cover.png'}" 
                     alt="${song.title} cover art" 
                     class="w-full aspect-square object-cover rounded-lg mb-2">
                <h3 class="font-bold">${song.title}</h3>
                <p class="text-gray-400">${song.artist}</p>
                <div class="flex justify-between mt-2">
                    <span class="text-sm text-gray-500">${this.formatDuration(song.duration)}</span>
                    <button onclick="player.toggleFavorite(event, ${song.id})" 
                            class="text-gray-400 hover:text-red-500"
                            aria-label="Add to favorites">
                        <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.653 16.915l-.005-.003-.019-.01a20.759 20.759 0 01-1.162-.682 22.045 22.045 0 01-2.582-1.9C4.045 12.733 2 10.352 2 7.5a4.5 4.5 0 018-2.828A4.5 4.5 0 0118 7.5c0 2.852-2.044 5.233-3.885 6.82a22.049 22.049 0 01-3.744 2.582l-.019.01-.005.003h-.002a.739.739 0 01-.69.001l-.002-.001z"/>
                        </svg>
                    </button>
                </div>
            </div>
        `).join('');
    }

    renderPlaylists(playlists: any[]) {
        if (!this.contentPanels.playlists) return;

        this.contentPanels.playlists.innerHTML = playlists.map(playlist => `
            <div class="bg-gray-800 p-4 rounded-lg hover:bg-gray-700 cursor-pointer playlist-card"
                 onclick="player.openPlaylist(${playlist.id})"
                 role="button"
                 tabindex="0"
                 aria-label="Open playlist ${playlist.name}">
                <h3 class="font-bold">${playlist.name}</h3>
                <p class="text-gray-400">${playlist.description || ''}</p>
                <p class="text-sm text-gray-500 mt-2">${playlist.song_count || 0} songs</p>
            </div>
        `).join('');
    }

    renderFavorites(favorites: any[]) {
        if (!this.contentPanels.favorites) return;

        this.contentPanels.favorites.innerHTML = favorites.map(song => `
            <div class="bg-gray-800 p-4 rounded-lg hover:bg-gray-700 cursor-pointer song-card"
                 onclick="player.playSong(${JSON.stringify(song)})"
                 role="button"
                 tabindex="0"
                 aria-label="Play ${song.title} by ${song.artist}">
                <img src="${song.cover_art_url || '/assets/default-cover.png'}" 
                     alt="${song.title} cover art" 
                     class="w-full aspect-square object-cover rounded-lg mb-2">
                <h3 class="font-bold">${song.title}</h3>
                <p class="text-gray-400">${song.artist}</p>
                <div class="flex justify-between mt-2">
                    <span class="text-sm text-gray-500">${this.formatDuration(song.duration)}</span>
                    <button onclick="player.toggleFavorite(event, ${song.id})" 
                            class="text-red-500 hover:text-gray-400"
                            aria-label="Remove from favorites">
                        <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"/>
                        </svg>
                    </button>
                </div>
            </div>
        `).join('');
    }

    formatDuration(seconds: number) {
        if (!seconds) return '0:00';
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.floor(seconds % 60);
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }

    playSong(song: any) {
        this.currentSong = song;
        this.audio.src = `/api/songs/${song.id}/stream`;
        this.audio.play();
        this.isPlaying = true;
        this.updatePlayerUI();
    }

    togglePlay() {
        if (!this.currentSong) return;
        
        if (this.isPlaying) {
            this.audio.pause();
        } else {
            this.audio.play();
        }
        this.isPlaying = !this.isPlaying;
        this.updatePlayerUI();
    }

    playPrevious() {
        // Implement previous song logic
    }

    playNext() {
        // Implement next song logic
    }

    updateProgress() {
        if (!this.audio.duration) return;
        const progress = (this.audio.currentTime / this.audio.duration) * 100;
        this.progressBar!.style.width = `${progress}%`;
    }

    updatePlayerUI() {
        if (this.currentSong) {
            this.currentTitle!.textContent = this.currentSong.title;
            this.currentArtist!.textContent = this.currentSong.artist;
            this.currentArt!.src = this.currentSong.cover_art_url || '/assets/default-cover.png';
        }

        // Update play button icon based on state
        // (You might want to update the SVG path here)
    }

    showLoginModal() {
        this.loginModal?.classList.remove('hidden');
    }

    hideLoginModal() {
        this.loginModal?.classList.add('hidden');
    }

    async handleLogin(event: Event) {
        event.preventDefault();
        const formData = new FormData(event.target as HTMLFormElement);
        const email = formData.get('email');
        const password = formData.get('password');

        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
            });

            if (response.ok) {
                const data = await response.json();
                localStorage.setItem('token', data.token);
                this.hideLoginModal();
                // Reload content with authenticated user
                this.loadSongs();
            } else {
                // Handle login error
                console.error('Login failed');
            }
        } catch (error) {
            console.error('Login error:', error);
        }
    }

    showError(message: string) {
        // Implement error toast/notification
        console.error(message);
    }

    toggleMute() {
        this.audio.muted = !this.audio.muted;
        if (this.volumeControl) {
            this.volumeControl.value = this.audio.muted ? '0' : (this.audio.volume * 100).toString();
        }
    }
}

// Initialize the player
const player = new RadioPlayer();