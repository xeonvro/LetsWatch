/**
 * SyncCinema — Client Synchronization Engine & Theater Controller
 */

// --- Global App State ---
const state = {
  socket: null,
  inTheater: false,
  roomId: 'cinema-lounge',
  pendingInitialVideo: null,
  user: {
    id: null,
    username: 'Viewer',
    avatar: '',
    deviceType: getDeviceType()
  },
  isHost: false,
  controlsLocked: false,
  activePlayerType: 'html5', // 'html5' | 'hls' | 'youtube'
  hlsInstance: null,
  ytPlayer: null,
  ytReady: false,
  isApplyingSync: false,
  lastSyncTime: 0,
  pingMs: 0,
  settings: {
    autoSync: true,
    sfx: true,
    ambientGlow: true
  },
  network: {
    port: 3000,
    localIps: [],
    recommendedUrl: ''
  },
  lastDeviceCount: 0
};

// --- DOM Element References ---
const DOM = {
  // Home Page View
  homePageContainer: document.getElementById('homePageContainer'),
  homeActiveRoomsChip: document.getElementById('homeActiveRoomsChip'),
  homeActiveCount: document.getElementById('homeActiveCount'),
  homeTabCreateBtn: document.getElementById('homeTabCreateBtn'),
  homeTabWatchBtn: document.getElementById('homeTabWatchBtn'),
  homeCreateForm: document.getElementById('homeCreateForm'),
  homeWatchForm: document.getElementById('homeWatchForm'),
  homeStreamUrlInput: document.getElementById('homeStreamUrlInput'),
  homeClearStreamBtn: document.getElementById('homeClearStreamBtn'),
  homeDisplayRoomCode: document.getElementById('homeDisplayRoomCode'),
  homeRerollCodeBtn: document.getElementById('homeRerollCodeBtn'),
  homeCopyCodeBtn: document.getElementById('homeCopyCodeBtn'),
  homeCopyCodeText: document.getElementById('homeCopyCodeText'),
  homeCopyLinkBtn: document.getElementById('homeCopyLinkBtn'),
  homeCopyLinkText: document.getElementById('homeCopyLinkText'),
  homeScanQrBtn: document.getElementById('homeScanQrBtn'),
  homeShareUrlLabel: document.getElementById('homeShareUrlLabel'),
  homeShareUrlPreview: document.getElementById('homeShareUrlPreview'),
  homeHostNameInput: document.getElementById('homeHostNameInput'),
  homeCreateSubmitBtn: document.getElementById('homeCreateSubmitBtn'),
  homeJoinCodeInput: document.getElementById('homeJoinCodeInput'),
  homeJoinNameInput: document.getElementById('homeJoinNameInput'),
  homeWatchSubmitBtn: document.getElementById('homeWatchSubmitBtn'),
  homeActiveRoomsList: document.getElementById('homeActiveRoomsList'),
  homeRefreshRoomsBtn: document.getElementById('homeRefreshRoomsBtn'),

  // Theater Navigation & Badges
  navHomeBtn: document.getElementById('navHomeBtn'),
  navCopyRoomCodeBtn: document.getElementById('navCopyRoomCodeBtn'),
  displayRoomId: document.getElementById('displayRoomId'),
  roomPillBtn: document.getElementById('roomPillBtn'),
  openWelcomeHubBtn: document.getElementById('openWelcomeHubBtn'),
  connectMobileBtn: document.getElementById('connectMobileBtn'),
  connectedDevicesCount: document.getElementById('connectedDevicesCount'),
  devicesBadgeBtn: document.getElementById('devicesBadgeBtn'),
  devicesDropdown: document.getElementById('devicesDropdown'),
  dropdownDeviceCount: document.getElementById('dropdownDeviceCount'),
  dropdownCopyInviteBtn: document.getElementById('dropdownCopyInviteBtn'),
  dropdownConnectPhoneBtn: document.getElementById('dropdownConnectPhoneBtn'),
  quickDeviceList: document.getElementById('quickDeviceList'),
  myPingDisplay: document.getElementById('myPingDisplay'),
  navUserAvatar: document.getElementById('navUserAvatar'),
  navUserName: document.getElementById('navUserName'),
  navHostTag: document.getElementById('navHostTag'),
  toggleSidebarBtn: document.getElementById('toggleSidebarBtn'),
  chatUnreadDot: document.getElementById('chatUnreadDot'),
  navCopyLinkBtn: document.getElementById('navCopyLinkBtn'),
  inlinePipBtn: document.getElementById('inlinePipBtn'),
  copyVideoUrlBottomBtn: document.getElementById('copyVideoUrlBottomBtn'),
  metaDurationDisplay: document.getElementById('metaDurationDisplay'),
  metaResolutionDisplay: document.getElementById('metaResolutionDisplay'),
  metaFormatDisplay: document.getElementById('metaFormatDisplay'),
  metaStatusDisplay: document.getElementById('metaStatusDisplay'),
  currentRoomCodeDisplay: document.getElementById('currentRoomCodeDisplay'),
  copyRoomCodeDirectBtn: document.getElementById('copyRoomCodeDirectBtn'),
  copyRoomLinkDirectBtn: document.getElementById('copyRoomLinkDirectBtn'),
  createRoomDirectBtn: document.getElementById('createRoomDirectBtn'),
  joinRoomDirectBtn: document.getElementById('joinRoomDirectBtn'),

  // Mobile QR Modal
  mobileConnectModal: document.getElementById('mobileConnectModal'),
  qrCodeCanvas: document.getElementById('qrCodeCanvas'),
  mobileLanUrlInput: document.getElementById('mobileLanUrlInput'),
  copyMobileLanUrlBtn: document.getElementById('copyMobileLanUrlBtn'),
  closeMobileModalBtn: document.getElementById('closeMobileModalBtn'),
  mobileUnmuteOverlay: document.getElementById('mobileUnmuteOverlay'),
  mobileUnmuteBtn: document.getElementById('mobileUnmuteBtn'),

  // Room Manager & Switcher Modal
  dropdownRoomCodeBtn: document.getElementById('dropdownRoomCodeBtn'),
  roomManagerModal: document.getElementById('roomManagerModal'),
  activeRoomCodeDisplay: document.getElementById('activeRoomCodeDisplay'),
  activeRoomShareUrlInput: document.getElementById('activeRoomShareUrlInput'),
  copyActiveRoomCodeBtn: document.getElementById('copyActiveRoomCodeBtn'),
  copyActiveRoomShareUrlBtn: document.getElementById('copyActiveRoomShareUrlBtn'),
  openQrFromRoomManagerBtn: document.getElementById('openQrFromRoomManagerBtn'),
  switchRoomForm: document.getElementById('switchRoomForm'),
  switchRoomCodeInput: document.getElementById('switchRoomCodeInput'),
  generateNewSwitchCodeBtn: document.getElementById('generateNewSwitchCodeBtn'),
  closeRoomManagerModalBtn: document.getElementById('closeRoomManagerModalBtn'),
  modalGenerateCodeBtn: document.getElementById('modalGenerateCodeBtn'),

  // Stream inputs & Quick Controls
  streamUrlInput: document.getElementById('streamUrlInput'),
  clearStreamInputBtn: document.getElementById('clearStreamInputBtn'),
  loadStreamBtn: document.getElementById('loadStreamBtn'),
  quickPlayPauseBtn: document.getElementById('quickPlayPauseBtn'),
  quickPlayPauseIcon: document.getElementById('quickPlayPauseIcon'),
  quickPlayPauseText: document.getElementById('quickPlayPauseText'),
  presetDropdownBtn: document.getElementById('presetDropdownBtn'),
  presetDropdownMenu: document.getElementById('presetDropdownMenu'),

  // Player Elements
  playerWrapper: document.getElementById('playerWrapper'),
  videoContainer: document.getElementById('videoContainer'),
  cinemaVideo: document.getElementById('cinemaVideo'),
  ytContainer: document.getElementById('youtubePlayerContainer'),
  ytTarget: document.getElementById('ytPlayerTarget'),
  reactionOverlay: document.getElementById('reactionOverlay'),
  centerActionIndicator: document.getElementById('centerActionIndicator'),
  centerActionIcon: document.getElementById('centerActionIcon'),
  syncNotificationBadge: document.getElementById('syncNotificationBadge'),
  syncNotificationText: document.getElementById('syncNotificationText'),
  hostLockedOverlay: document.getElementById('hostLockedOverlay'),
  customControls: document.getElementById('customControls'),

  // Inline SVG icon refs (not Lucide — these don't get replaced)
  iconPlay: document.getElementById('iconPlay'),
  iconPause: document.getElementById('iconPause'),
  ctrlVolumeIcon: document.getElementById('ctrlVolumeIcon'),
  volWave1: document.getElementById('volWave1'),
  volWave2: document.getElementById('volWave2'),

  // Controls
  progressContainer: document.getElementById('progressContainer'),
  progressTooltip: document.getElementById('progressTooltip'),
  progressHoverLine: document.getElementById('progressHoverLine'),
  progressBuffered: document.getElementById('progressBuffered'),
  progressPlayed: document.getElementById('progressPlayed'),
  progressScrubber: document.getElementById('progressScrubber'),
  ctrlPlayBtn: document.getElementById('ctrlPlayBtn'),
  ctrlPlayIcon: document.getElementById('ctrlPlayIcon'),
  ctrlRewindBtn: document.getElementById('ctrlRewindBtn'),
  ctrlFastForwardBtn: document.getElementById('ctrlFastForwardBtn'),
  ctrlVolumeBtn: document.getElementById('ctrlVolumeBtn'),
  ctrlVolumeIcon: document.getElementById('ctrlVolumeIcon'),
  ctrlVolumeSlider: document.getElementById('ctrlVolumeSlider'),
  currentTimeDisplay: document.getElementById('currentTimeDisplay'),
  durationTimeDisplay: document.getElementById('durationTimeDisplay'),
  syncStatusPill: document.getElementById('syncStatusPill'),
  syncStatusLabel: document.getElementById('syncStatusLabel'),
  speedMenuBtn: document.getElementById('speedMenuBtn'),
  currentSpeedLabel: document.getElementById('currentSpeedLabel'),
  speedMenu: document.getElementById('speedMenu'),
  ctrlPipBtn: document.getElementById('ctrlPipBtn'),
  ctrlFullscreenBtn: document.getElementById('ctrlFullscreenBtn'),
  fullscreenIcon: document.getElementById('fullscreenIcon'),

  // Video Meta & Reactions
  displayStreamType: document.getElementById('displayStreamType'),
  displayVideoTitle: document.getElementById('displayVideoTitle'),
  displayVideoSubtitle: document.getElementById('displayVideoSubtitle'),

  // Sidebar & Tabs
  partySidebar: document.getElementById('partySidebar'),
  appLayout: document.getElementById('appLayout'),
  sideDeviceCount: document.getElementById('sideDeviceCount'),
  tabDeviceCount: document.getElementById('tabDeviceCount'),
  chatMessages: document.getElementById('chatMessages'),
  chatForm: document.getElementById('chatForm'),
  chatInput: document.getElementById('chatInput'),
  devicesListFull: document.getElementById('devicesListFull'),
  shareUrlInput: document.getElementById('shareUrlInput'),
  copyShareUrlBtn: document.getElementById('copyShareUrlBtn'),
  queueUrlInput: document.getElementById('queueUrlInput'),
  addToQueueBtn: document.getElementById('addToQueueBtn'),
  playlistItemsList: document.getElementById('playlistItemsList'),

  // Settings
  settingLockToggle: document.getElementById('settingLockToggle'),
  settingAutoSyncToggle: document.getElementById('settingAutoSyncToggle'),
  settingSfxToggle: document.getElementById('settingSfxToggle'),
  settingAmbientGlowToggle: document.getElementById('settingAmbientGlowToggle'),
  settingsAvatarPicker: document.getElementById('settingsAvatarPicker'),
  settingsUsernameInput: document.getElementById('settingsUsernameInput'),
  saveProfileBtn: document.getElementById('saveProfileBtn'),

  // Welcome Hub Modal
  joinModal: document.getElementById('joinModal'),
  closeWelcomeModalBtn: document.getElementById('closeWelcomeModalBtn'),
  tabStartStreamBtn: document.getElementById('tabStartStreamBtn'),
  tabWatchStreamBtn: document.getElementById('tabWatchStreamBtn'),
  startStreamForm: document.getElementById('startStreamForm'),
  watchStreamForm: document.getElementById('watchStreamForm'),
  createStreamUrlInput: document.getElementById('createStreamUrlInput'),
  createRoomCodeInput: document.getElementById('createRoomCodeInput'),
  rollNewRoomCodeBtn: document.getElementById('rollNewRoomCodeBtn'),
  joinRoomCodeInput: document.getElementById('joinRoomCodeInput'),
  modalAvatarGrid: document.getElementById('modalAvatarGrid'),
  modalUsernameInput: document.getElementById('modalUsernameInput'),
  toastCenter: document.getElementById('toastCenter'),

  // Ambient
  ambientCanvas: document.getElementById('ambientCanvas'),
  ambientGlow: document.getElementById('ambientGlow')
};

// --- Web Audio Synthesized Sound Effects (No external audio files needed) ---
let audioCtx = null;
function playSound(type) {
  if (!state.settings.sfx) return;
  try {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);

    const now = audioCtx.currentTime;
    if (type === 'pop') {
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.1);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.linearRampToValueAtTime(0.01, now + 0.1);
      osc.start(now);
      osc.stop(now + 0.1);
    } else if (type === 'chat') {
      osc.frequency.setValueAtTime(587.33, now); // D5
      osc.frequency.setValueAtTime(880, now + 0.08); // A5
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.linearRampToValueAtTime(0.01, now + 0.18);
      osc.start(now);
      osc.stop(now + 0.18);
    } else if (type === 'sync') {
      osc.frequency.setValueAtTime(523.25, now);
      gain.gain.setValueAtTime(0.06, now);
      gain.gain.linearRampToValueAtTime(0.01, now + 0.12);
      osc.start(now);
      osc.stop(now + 0.12);
    }
  } catch (e) {
    // AudioContext user gesture policy
  }
}

// --- Device Detection ---
function getDeviceType() {
  const ua = navigator.userAgent;
  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
    return 'Tablet';
  }
  if (/Mobile|iP(hone|od)|Android|BlackBerry|IEMobile|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) {
    return 'Mobile';
  }
  return 'Desktop';
}

// --- Room Code Generator ---
function generateRandomRoomCode() {
  const words = ['cinema', 'lounge', 'party', 'watch', 'movie', 'stream', 'night', 'chill', 'binge', 'screen'];
  const word = words[Math.floor(Math.random() * words.length)];
  const num = Math.floor(1000 + Math.random() * 9000);
  return `${word}-${num}`;
}

// --- Network & LAN IP Resolution ---
function fetchNetworkInfo() {
  return fetch('/api/network-info')
    .then(r => r.json())
    .then(data => {
      if (data && data.success) {
        state.network.port = data.port || 3000;
        state.network.localIps = data.localIps || [];
        state.network.recommendedUrl = data.recommendedUrl || '';
        state.network.isCloud = Boolean(data.isCloud);
      }
      // Re-update current share links once network is resolved
      updateRoomCodeDisplays(state.roomId);
      if (!state.inTheater) {
        const currentCode = DOM.homeDisplayRoomCode ? DOM.homeDisplayRoomCode.textContent : state.roomId;
        updateHomePageRoomCode(currentCode);
      }
      const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      if (DOM.homeShareUrlLabel) {
        DOM.homeShareUrlLabel.textContent = isLocalhost ? 'Phone / LAN Link:' : 'Party Invite Link:';
      }
      return state.network;
    })
    .catch(() => state.network);
}

function getBestShareUrl(roomId = state.roomId) {
  const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  // If hosted on Render or any public cloud/domain, always use current public origin
  if (!isLocalhost) {
    return `${window.location.origin}/?room=${roomId}`;
  }
  // If testing on local PC, share LAN IP so phones on the same Wi-Fi can join
  if (state.network.recommendedUrl && !state.network.isCloud) {
    return `${state.network.recommendedUrl}/?room=${roomId}`;
  }
  return `${window.location.origin}/?room=${roomId}`;
}

// --- Initialize Application ---
document.addEventListener('DOMContentLoaded', () => {
  const BETHLEHEM_URL = 'https://xeonmodz.koyeb.app/stream/691?hash=923b67';
  const BETHLEHEM_TITLE = 'Bethlehem Kudumba Unit (2026) Malayalam HQ HDRip - 1080p - x.mkv';

  // Immediately resolve local network IP for mobile & device syncing
  fetchNetworkInfo();

  // Check URL query parameters for room
  const urlParams = new URLSearchParams(window.location.search);
  const roomParam = urlParams.get('room');

  // Load stored profile
  const storedUser = localStorage.getItem('synccinema_user');
  if (storedUser) {
    try {
      const parsed = JSON.parse(storedUser);
      state.user.username = parsed.username || 'Viewer';
      state.user.avatar = '';
    } catch (e) {}
  } else {
    state.user.username = `Viewer_${Math.floor(100 + Math.random() * 900)}`;
  }

  // Pre-fill the Home Page stream URL and generate a fresh room code
  const freshCode = generateRandomRoomCode();
  if (DOM.homeStreamUrlInput) DOM.homeStreamUrlInput.value = BETHLEHEM_URL;
  if (DOM.homeDisplayRoomCode) DOM.homeDisplayRoomCode.textContent = freshCode;
  if (DOM.homeShareUrlPreview) DOM.homeShareUrlPreview.value = `${window.location.origin}/?room=${freshCode}`;
  if (DOM.homeHostNameInput && storedUser) {
    try { DOM.homeHostNameInput.value = JSON.parse(storedUser).username || ''; } catch (e) {}
  }

  // Pre-fill theater stream input too
  if (DOM.streamUrlInput) DOM.streamUrlInput.value = BETHLEHEM_URL;

  // If ?room= param in URL, jump directly into theater mode
  if (roomParam) {
    state.roomId = roomParam.toLowerCase();
    state.pendingInitialVideo = null; // joining, don't override server state
    enterTheaterMode();
  } else {
    // Show home page
    updateHomePageRoomCode(freshCode);
    loadActiveRooms();
  }

  updateProfileUI();
  initLucide();
  setupEventListeners();
  initSocket();
});

// --- View Switcher: Home <-> Theater ---
function enterTheaterMode(videoUrl, videoTitle) {
  if (DOM.homePageContainer) DOM.homePageContainer.style.display = 'none';
  if (DOM.appLayout) DOM.appLayout.style.display = 'flex';
  if (DOM.roomManagerModal) DOM.roomManagerModal.style.display = 'none';
  if (DOM.joinModal) DOM.joinModal.style.display = 'none';
  state.inTheater = true;

  if (videoUrl) {
    state.pendingInitialVideo = { url: videoUrl, title: videoTitle };
  }

  updateRoomCodeDisplays(state.roomId);
  initLucide();
}

function goHome() {
  if (DOM.appLayout) DOM.appLayout.style.display = 'none';
  if (DOM.homePageContainer) DOM.homePageContainer.style.display = 'flex';
  state.inTheater = false;
  loadActiveRooms();
  initLucide();
}

function updateHomePageRoomCode(code) {
  if (DOM.homeDisplayRoomCode) DOM.homeDisplayRoomCode.textContent = code;
  const shareUrl = getBestShareUrl(code, true);
  if (DOM.homeShareUrlPreview) DOM.homeShareUrlPreview.value = shareUrl;
}

function loadActiveRooms() {
  fetch('/api/rooms')
    .then(r => r.json())
    .then(data => {
      if (!DOM.homeActiveRoomsList) return;
      const rooms = data.rooms || [];

      // Update count chip
      const activeCount = rooms.filter(r => r.userCount > 0).length;
      if (DOM.homeActiveCount) DOM.homeActiveCount.textContent = activeCount;

      if (rooms.length === 0) {
        DOM.homeActiveRoomsList.innerHTML = '<p class="empty-rooms-text">No active watch parties yet. Be the first to start one!</p>';
        return;
      }

      DOM.homeActiveRoomsList.innerHTML = '';
      rooms.forEach(room => {
        const item = document.createElement('div');
        item.className = 'active-room-item';
        item.innerHTML = `
          <div class="active-room-info-left">
            <div>
              <div class="active-room-title">${room.id}</div>
              <div class="active-room-media-title">${room.currentVideo || 'Idle'}</div>
            </div>
          </div>
          <div style="display:flex;align-items:center;gap:0.75rem;">
            <span style="font-size:0.75rem;color:#64748b;">${room.userCount} viewer${room.userCount !== 1 ? 's' : ''}</span>
            <button class="btn-join-room-pill" data-room="${room.id}">Join Party</button>
          </div>
        `;
        item.querySelector('.btn-join-room-pill').addEventListener('click', () => {
          state.roomId = room.id;
          state.pendingInitialVideo = null;
          enterTheaterMode();
          // socket will join when connected
          if (state.socket && state.socket.connected) joinCurrentRoom();
        });
        DOM.homeActiveRoomsList.appendChild(item);
      });
    })
    .catch(() => {
      if (DOM.homeActiveRoomsList) {
        DOM.homeActiveRoomsList.innerHTML = '<p class="empty-rooms-text">Could not load rooms.</p>';
      }
    });
}


function initLucide() {
  if (window.lucide) {
    window.lucide.createIcons();
  }
}

// --- Socket.IO & Synchronization Setup ---
function initSocket() {
  state.socket = io();

  state.socket.on('connect', () => {
    state.user.id = state.socket.id;
    // Join initial room
    joinCurrentRoom();
    startPingInterval();
  });

  // Room Joined initial full state
  state.socket.on('room_joined_state', (snapshot) => {
    state.lastDeviceCount = snapshot.connectedDevicesCount || 1;
    updateRoomCodeDisplays(snapshot.roomId);
    
    state.isHost = (state.socket.id === snapshot.hostId);
    state.controlsLocked = snapshot.controlsLocked;
    updateHostLockUI();

    updateDeviceCounters(snapshot.connectedDevicesCount);
    renderDeviceLists(snapshot.users, snapshot.hostId);
    renderPlaylist(snapshot.playlist);

    // Render chat history
    DOM.chatMessages.innerHTML = '';
    snapshot.chatHistory.forEach(msg => appendChatMessage(msg));

    // Load and apply video state
    applyVideoState(snapshot.videoState, true);
    const countText = snapshot.connectedDevicesCount > 1 
      ? `(${snapshot.connectedDevicesCount} devices connected)` 
      : `(1 device in room)`;
    showToast(`Joined watch room "${snapshot.roomId}" ${countText}!`, 'success');
  });

  // User list & device count updated
  state.socket.on('room_users_updated', ({ connectedDevicesCount, users, hostId }) => {
    const prevCount = state.lastDeviceCount;
    state.lastDeviceCount = connectedDevicesCount;

    updateDeviceCounters(connectedDevicesCount);
    renderDeviceLists(users, hostId);
    state.isHost = (state.socket.id === hostId);
    updateHostLockUI();

    // Alert user when a new device connects
    if (connectedDevicesCount > prevCount && prevCount > 0) {
      const joinedUser = users[users.length - 1];
      const isMe = joinedUser && joinedUser.id === state.socket.id;
      if (!isMe) {
        const uName = joinedUser?.username || 'Another viewer';
        const dType = joinedUser?.deviceType ? ` (${joinedUser.deviceType})` : '';
        showToast(`🎉 ${uName}${dType} connected to your watch party!`, 'success');
        playSound('chat');
        if (DOM.devicesBadgeBtn) {
          DOM.devicesBadgeBtn.classList.add('pulse-green');
          setTimeout(() => DOM.devicesBadgeBtn.classList.remove('pulse-green'), 2200);
        }
      }
    } else if (connectedDevicesCount < prevCount && prevCount > 1) {
      showToast('A device left the room.', 'info');
    }
  });

  // Real-time Action Sync broadcast
  state.socket.on('room_sync_action', ({ action, senderId, senderName, videoState, timestamp }) => {
    if (senderId === state.socket.id && action !== 'force_resync') {
      // Ignore echoed own actions to avoid feedback loops
      return;
    }

    applyRoomSyncAction(action, videoState, senderName);
  });

  // Chat message received
  state.socket.on('chat_message', (msg) => {
    appendChatMessage(msg);
    if (msg.userId !== state.socket.id) {
      playSound('chat');
    }
  });

  // Floating Reaction received
  state.socket.on('room_reaction', (reaction) => {
    spawnFloatingReaction(reaction.emoji);
    playSound('pop');
  });

  // Playlist updated
  state.socket.on('playlist_updated', (playlist) => {
    renderPlaylist(playlist);
  });

  // Host lock changed
  state.socket.on('controls_lock_changed', ({ controlsLocked, hostName }) => {
    state.controlsLocked = controlsLocked;
    updateHostLockUI();
    showToast(`${hostName} ${controlsLocked ? 'locked' : 'unlocked'} playback controls.`, 'info');
  });

  // Action rejected by server
  state.socket.on('action_rejected', ({ reason }) => {
    showToast(reason, 'warn');
  });

  // Latency response
  state.socket.on('latency_pong', ({ clientTimestamp }) => {
    state.pingMs = Date.now() - clientTimestamp;
    DOM.myPingDisplay.textContent = `⚡ ${state.pingMs}ms`;
    state.socket.emit('update_ping', { ping: state.pingMs });
  });

  state.socket.on('user_ping_updated', ({ userId, ping }) => {
    const pingEl = document.querySelector(`[data-user-ping="${userId}"]`);
    if (pingEl) pingEl.textContent = `${ping}ms`;
  });
}

function joinCurrentRoom() {
  state.socket.emit('join_room', {
    roomId: state.roomId,
    username: state.user.username,
    avatar: state.user.avatar,
    deviceType: state.user.deviceType,
    initialVideo: state.pendingInitialVideo || null
  });
  // Clear pending after emitting so it's only sent once
  state.pendingInitialVideo = null;
}

function startPingInterval() {
  setInterval(() => {
    if (state.socket && state.socket.connected) {
      state.socket.emit('latency_ping', Date.now());
    }
  }, 4000);
}

// --- Uniform Video Player Controller ---
const Player = {
  getVideoType(url) {
    if (!url) return 'html5';
    if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube';
    if (url.includes('.m3u8')) return 'hls';
    return 'html5';
  },

  loadSource(url, videoType, initialTime = 0, autoPlay = false) {
    state.activePlayerType = videoType || this.getVideoType(url);
    DOM.displayStreamType.textContent = state.activePlayerType.toUpperCase();

    if (state.activePlayerType === 'youtube') {
      DOM.cinemaVideo.style.display = 'none';
      DOM.ytContainer.style.display = 'block';
      this.loadYouTube(url, initialTime, autoPlay);
    } else if (state.activePlayerType === 'hls') {
      DOM.ytContainer.style.display = 'none';
      DOM.cinemaVideo.style.display = 'block';
      this.loadHLS(url, initialTime, autoPlay);
    } else {
      // HTML5 video
      DOM.ytContainer.style.display = 'none';
      DOM.cinemaVideo.style.display = 'block';
      this.destroyHls();
      DOM.cinemaVideo.src = url;
      if (initialTime > 0) {
        const setInitialTime = () => {
          try { DOM.cinemaVideo.currentTime = initialTime; } catch (e) {}
          DOM.cinemaVideo.removeEventListener('loadedmetadata', setInitialTime);
        };
        if (DOM.cinemaVideo.readyState >= 1) {
          try { DOM.cinemaVideo.currentTime = initialTime; } catch (e) {}
        } else {
          DOM.cinemaVideo.addEventListener('loadedmetadata', setInitialTime);
        }
      }
      if (autoPlay) {
        this.play();
      }
    }
  },

  loadHLS(url, initialTime, autoPlay) {
    this.destroyHls();
    if (Hls.isSupported()) {
      state.hlsInstance = new Hls({ enableWorker: true });
      state.hlsInstance.loadSource(url);
      state.hlsInstance.attachMedia(DOM.cinemaVideo);
      state.hlsInstance.on(Hls.Events.MANIFEST_PARSED, () => {
        if (initialTime > 0) DOM.cinemaVideo.currentTime = initialTime;
        if (autoPlay) DOM.cinemaVideo.play().catch(() => {});
      });
    } else if (DOM.cinemaVideo.canPlayType('application/vnd.apple.mpegurl')) {
      DOM.cinemaVideo.src = url;
      if (initialTime > 0) DOM.cinemaVideo.currentTime = initialTime;
      if (autoPlay) DOM.cinemaVideo.play().catch(() => {});
    }
  },

  destroyHls() {
    if (state.hlsInstance) {
      state.hlsInstance.destroy();
      state.hlsInstance = null;
    }
  },

  loadYouTube(url, initialTime, autoPlay) {
    const videoId = extractYouTubeId(url);
    if (!videoId) return;

    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

      window.onYouTubeIframeAPIReady = () => {
        this.createYouTubePlayer(videoId, initialTime, autoPlay);
      };
    } else {
      if (state.ytPlayer && state.ytPlayer.loadVideoById) {
        state.ytPlayer.loadVideoById({
          videoId,
          startSeconds: initialTime || 0
        });
        if (!autoPlay) state.ytPlayer.pauseVideo();
      } else {
        this.createYouTubePlayer(videoId, initialTime, autoPlay);
      }
    }
  },

  createYouTubePlayer(videoId, initialTime, autoPlay) {
    state.ytPlayer = new YT.Player('ytPlayerTarget', {
      height: '100%',
      width: '100%',
      videoId: videoId,
      playerVars: {
        autoplay: autoPlay ? 1 : 0,
        start: Math.floor(initialTime || 0),
        controls: 0,
        disablekb: 1,
        rel: 0,
        modestbranding: 1
      },
      events: {
        onReady: (event) => {
          state.ytReady = true;
          if (autoPlay) event.target.playVideo();
        },
        onStateChange: (event) => {
          // Sync state changes if initiated locally
        }
      }
    });
  },

  play() {
    if (state.activePlayerType === 'youtube' && state.ytPlayer?.playVideo) {
      state.ytPlayer.playVideo();
    } else {
      const playPromise = DOM.cinemaVideo.play();
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          console.warn('Playback play() was restricted by browser:', err);
          // If browser blocked unmuted autoplay, immediately play muted to stay synced
          DOM.cinemaVideo.muted = true;
          DOM.cinemaVideo.play().then(() => {
            if (DOM.mobileUnmuteOverlay) DOM.mobileUnmuteOverlay.style.display = 'flex';
          }).catch(() => {
            if (DOM.mobileUnmuteOverlay) DOM.mobileUnmuteOverlay.style.display = 'flex';
          });
        });
      }
    }
    updatePlayPauseButtonUI(true);
  },

  pause() {
    if (state.activePlayerType === 'youtube' && state.ytPlayer?.pauseVideo) {
      state.ytPlayer.pauseVideo();
    } else {
      DOM.cinemaVideo.pause();
    }
    updatePlayPauseButtonUI(false);
  },

  seek(seconds) {
    if (state.activePlayerType === 'youtube' && state.ytPlayer?.seekTo) {
      state.ytPlayer.seekTo(seconds, true);
    } else {
      DOM.cinemaVideo.currentTime = seconds;
    }
  },

  setPlaybackRate(rate) {
    if (state.activePlayerType === 'youtube' && state.ytPlayer?.setPlaybackRate) {
      state.ytPlayer.setPlaybackRate(rate);
    } else {
      DOM.cinemaVideo.playbackRate = rate;
    }
    updateSpeedPillsUI(rate);
  },

  getCurrentTime() {
    if (state.activePlayerType === 'youtube' && state.ytPlayer?.getCurrentTime) {
      return state.ytPlayer.getCurrentTime() || 0;
    }
    return DOM.cinemaVideo.currentTime || 0;
  },

  getDuration() {
    if (state.activePlayerType === 'youtube' && state.ytPlayer?.getDuration) {
      return state.ytPlayer.getDuration() || 0;
    }
    return DOM.cinemaVideo.duration || 0;
  },

  isPlaying() {
    if (state.activePlayerType === 'youtube' && state.ytPlayer?.getPlayerState) {
      return state.ytPlayer.getPlayerState() === 1; // 1 = YT.PlayerState.PLAYING
    }
    return !DOM.cinemaVideo.paused && !DOM.cinemaVideo.ended;
  }
};

function extractYouTubeId(url) {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
}

// --- Video State Synchronization Engine ---
function applyVideoState(videoState, isInitial = false) {
  state.isApplyingSync = true;

  const currentUrl = DOM.cinemaVideo.src;
  const isNewUrl = !currentUrl.includes(videoState.url) || isInitial;

  DOM.displayVideoTitle.textContent = videoState.title || 'Stream Media';
  updateVideoMetadataDisplays(videoState.url, videoState.title);

  if (isNewUrl) {
    Player.loadSource(videoState.url, videoState.videoType, videoState.currentTime, videoState.isPlaying);
  } else {
    Player.seek(videoState.currentTime);
    if (videoState.isPlaying) {
      Player.play();
    } else {
      Player.pause();
    }
  }

  if (videoState.playbackRate) {
    Player.setPlaybackRate(videoState.playbackRate);
  }

  setTimeout(() => {
    state.isApplyingSync = false;
  }, 400);
}

function applyRoomSyncAction(action, videoState, senderName) {
  state.isApplyingSync = true;

  // Calculate room drift
  let targetTime = videoState.currentTime;
  if (videoState.isPlaying && videoState.serverTime) {
    const elapsedSec = (Date.now() - videoState.serverTime) / 1000;
    targetTime += (elapsedSec * (videoState.playbackRate || 1.0));
  }

  const localTime = Player.getCurrentTime();
  const drift = Math.abs(localTime - targetTime);

  switch (action) {
    case 'change_video':
      DOM.displayVideoTitle.textContent = videoState.title;
      updateVideoMetadataDisplays(videoState.url, videoState.title);
      Player.loadSource(videoState.url, videoState.videoType, 0, videoState.isPlaying);
      flashCenterAction('play');
      showSyncBadge(`Loaded: ${videoState.title}`);
      break;

    case 'play':
      if (videoState.url && (!DOM.cinemaVideo.src || !DOM.cinemaVideo.src.includes(videoState.url))) {
        Player.loadSource(videoState.url, videoState.videoType, targetTime, true);
      } else {
        if (drift > 0.4) Player.seek(targetTime);
        Player.play();
      }
      flashCenterAction('play');
      showSyncBadge(`Play by ${senderName}`);
      break;

    case 'pause':
      Player.seek(targetTime);
      Player.pause();
      flashCenterAction('pause');
      showSyncBadge(`Paused by ${senderName}`);
      break;

    case 'seek':
    case 'fast_forward':
    case 'rewind':
      Player.seek(targetTime);
      flashCenterAction(action === 'seek' ? 'rotate-cw' : action === 'fast_forward' ? 'fast-forward' : 'rewind');
      showSyncBadge(`Jumped to ${formatTime(targetTime)}`);
      break;

    case 'rate_change':
      Player.setPlaybackRate(videoState.playbackRate);
      showSyncBadge(`Speed set to ${videoState.playbackRate}x`);
      break;

    case 'force_resync':
      if (videoState.url && (!DOM.cinemaVideo.src || !DOM.cinemaVideo.src.includes(videoState.url))) {
        Player.loadSource(videoState.url, videoState.videoType, targetTime, videoState.isPlaying);
      } else {
        Player.seek(targetTime);
        if (videoState.isPlaying) Player.play();
        else Player.pause();
      }
      showSyncBadge(`Force Re-synced (Drift ${drift.toFixed(2)}s)`);
      playSound('sync');
      break;
  }

  setTimeout(() => {
    state.isApplyingSync = false;
  }, 400);
}

// --- Outgoing Sync Actions Broadcast ---
function emitSyncAction(action, data = {}) {
  if (state.isApplyingSync) return;

  if (state.controlsLocked && !state.isHost) {
    showToast('Controls locked by Host.', 'warn');
    return;
  }

  const currentTime = Player.getCurrentTime();
  const payload = {
    action,
    time: typeof data.time === 'number' ? data.time : currentTime,
    rate: data.rate || 1.0,
    url: data.url,
    videoType: data.videoType,
    title: data.title
  };

  state.socket.emit('sync_action', payload);
}

// --- Periodic Drift Detection & Auto-Correction ---
setInterval(() => {
  if (!state.settings.autoSync || state.isApplyingSync || !state.socket) return;
  if (!Player.isPlaying()) return;

  // Visual status pill update
  DOM.syncStatusPill.className = 'sync-status-pill in-sync';
  DOM.syncStatusLabel.textContent = 'Synchronized';
}, 2000);

// --- Video Events & Custom Scrubber updates ---
DOM.cinemaVideo.addEventListener('timeupdate', () => {
  const current = Player.getCurrentTime();
  const duration = Player.getDuration();

  DOM.currentTimeDisplay.textContent = formatTime(current);
  DOM.durationTimeDisplay.textContent = formatTime(duration);

  if (duration > 0) {
    const percent = (current / duration) * 100;
    DOM.progressPlayed.style.width = `${percent}%`;
    DOM.progressScrubber.style.left = `${percent}%`;
  }

  // Buffer progress
  if (DOM.cinemaVideo.buffered.length > 0) {
    const bufferedEnd = DOM.cinemaVideo.buffered.end(DOM.cinemaVideo.buffered.length - 1);
    const bufPercent = (bufferedEnd / duration) * 100;
    DOM.progressBuffered.style.width = `${bufPercent}%`;
  }

  // Update dynamic ambient canvas lighting
  if (state.settings.ambientGlow && !DOM.cinemaVideo.paused) {
    renderAmbientCanvas();
  }
});

DOM.cinemaVideo.addEventListener('loadedmetadata', () => {
  updateVideoMetadataDisplays(DOM.cinemaVideo.src, DOM.displayVideoTitle?.textContent);
});

DOM.cinemaVideo.addEventListener('error', () => {
  const err = DOM.cinemaVideo.error;
  console.warn('Cinema video error event:', err);
  if (err) {
    let msg = 'Stream error loading media.';
    if (err.code === 2) msg = 'Network error fetching stream.';
    if (err.code === 3) msg = 'Error decoding video stream format.';
    if (err.code === 4) msg = 'Video format or source not supported by browser.';
    showToast(msg, 'warn');
  }
});

DOM.cinemaVideo.addEventListener('waiting', () => {
  showSyncBadge('Buffering stream...');
});

// Sync play/pause button with native video events
DOM.cinemaVideo.addEventListener('play', () => setPlayPauseIconState(true));
DOM.cinemaVideo.addEventListener('pause', () => setPlayPauseIconState(false));
DOM.cinemaVideo.addEventListener('ended', () => setPlayPauseIconState(false));

// Play / Pause Icon Toggle (inline SVG — no Lucide dependency)
function setPlayPauseIconState(isPlaying) {
  if (DOM.iconPlay)  DOM.iconPlay.style.display  = isPlaying ? 'none' : 'block';
  if (DOM.iconPause) DOM.iconPause.style.display = isPlaying ? 'block' : 'none';
}

// Play / Pause UI Sync (called from Player methods)
function updatePlayPauseButtonUI(isPlaying) {
  setPlayPauseIconState(isPlaying);
  // Update quick play/pause button text
  if (DOM.quickPlayPauseText) DOM.quickPlayPauseText.textContent = isPlaying ? 'Pause' : 'Play';
  // Update quick icon (it's a Lucide icon; re-render it)
  if (DOM.quickPlayPauseBtn) {
    const existing = DOM.quickPlayPauseBtn.querySelector('[data-lucide], svg');
    if (existing) {
      const newIcon = document.createElement('i');
      newIcon.setAttribute('data-lucide', isPlaying ? 'pause' : 'play');
      newIcon.id = 'quickPlayPauseIcon';
      newIcon.className = 'w-4 h-4 text-amber-300';
      DOM.quickPlayPauseBtn.replaceChild(newIcon, existing);
      if (window.lucide) window.lucide.createIcons();
    }
  }
}

// Volume icon update
function updateVolumeIcon(vol) {
  if (!DOM.ctrlVolumeIcon) return;
  const w1 = DOM.volWave1;
  const w2 = DOM.volWave2;
  if (vol === 0) {
    if (w1) w1.style.display = 'none';
    if (w2) w2.style.display = 'none';
  } else if (vol < 0.5) {
    if (w1) w1.style.display = '';
    if (w2) w2.style.display = 'none';
  } else {
    if (w1) w1.style.display = '';
    if (w2) w2.style.display = '';
  }
}

// --- Event Listeners & UI Controls ---
function setupEventListeners() {

  // =========================================================
  // HOME PAGE CONTROLS
  // =========================================================

  // Tab switcher: Create / Watch
  if (DOM.homeTabCreateBtn) {
    DOM.homeTabCreateBtn.addEventListener('click', () => {
      DOM.homeTabCreateBtn.classList.add('active');
      DOM.homeTabWatchBtn.classList.remove('active');
      if (DOM.homeCreateForm) DOM.homeCreateForm.style.display = 'flex';
      if (DOM.homeWatchForm) DOM.homeWatchForm.style.display = 'none';
    });
  }
  if (DOM.homeTabWatchBtn) {
    DOM.homeTabWatchBtn.addEventListener('click', () => {
      DOM.homeTabWatchBtn.classList.add('active');
      DOM.homeTabCreateBtn.classList.remove('active');
      if (DOM.homeWatchForm) DOM.homeWatchForm.style.display = 'flex';
      if (DOM.homeCreateForm) DOM.homeCreateForm.style.display = 'none';
    });
  }

  // Stream URL clear button on home
  if (DOM.homeStreamUrlInput) {
    DOM.homeStreamUrlInput.addEventListener('input', () => {
      if (DOM.homeClearStreamBtn) {
        DOM.homeClearStreamBtn.style.display = DOM.homeStreamUrlInput.value ? 'flex' : 'none';
      }
    });
  }
  if (DOM.homeClearStreamBtn) {
    DOM.homeClearStreamBtn.addEventListener('click', () => {
      if (DOM.homeStreamUrlInput) DOM.homeStreamUrlInput.value = '';
      DOM.homeClearStreamBtn.style.display = 'none';
    });
  }

  // Sample chips on home page
  document.querySelectorAll('#homeCreateForm .sample-chip-btn').forEach(chip => {
    chip.addEventListener('click', () => {
      const url = chip.getAttribute('data-url');
      const title = chip.getAttribute('data-title');
      if (DOM.homeStreamUrlInput) DOM.homeStreamUrlInput.value = url;
      if (DOM.homeClearStreamBtn) DOM.homeClearStreamBtn.style.display = 'flex';
    });
  });

  // Quick join room tags
  document.querySelectorAll('.quick-join-tag').forEach(tag => {
    tag.addEventListener('click', () => {
      const room = tag.getAttribute('data-room');
      if (DOM.homeJoinCodeInput) DOM.homeJoinCodeInput.value = room;
    });
  });

  // Reroll room code
  if (DOM.homeRerollCodeBtn) {
    DOM.homeRerollCodeBtn.addEventListener('click', () => {
      const newCode = generateRandomRoomCode();
      updateHomePageRoomCode(newCode);
    });
  }

  // Copy Room Code button
  if (DOM.homeCopyCodeBtn) {
    DOM.homeCopyCodeBtn.addEventListener('click', () => {
      const code = DOM.homeDisplayRoomCode?.textContent || '';
      navigator.clipboard.writeText(code).then(() => {
        if (DOM.homeCopyCodeText) DOM.homeCopyCodeText.textContent = 'Copied!';
        setTimeout(() => { if (DOM.homeCopyCodeText) DOM.homeCopyCodeText.textContent = 'Copy Code'; }, 2000);
      });
    });
  }

  // Copy Invite Link button
  if (DOM.homeCopyLinkBtn) {
    DOM.homeCopyLinkBtn.addEventListener('click', () => {
      const url = DOM.homeShareUrlPreview?.value || window.location.href;
      navigator.clipboard.writeText(url).then(() => {
        if (DOM.homeCopyLinkText) DOM.homeCopyLinkText.textContent = 'Copied!';
        setTimeout(() => { if (DOM.homeCopyLinkText) DOM.homeCopyLinkText.textContent = 'Copy Link'; }, 2000);
      });
    });
  }

  // Refresh Rooms button
  if (DOM.homeRefreshRoomsBtn) {
    DOM.homeRefreshRoomsBtn.addEventListener('click', loadActiveRooms);
  }

  // Home Create Room Form Submit
  if (DOM.homeCreateForm) {
    DOM.homeCreateForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = (DOM.homeHostNameInput?.value || '').trim() || state.user.username;
      const code = (DOM.homeDisplayRoomCode?.textContent || generateRandomRoomCode()).trim().toLowerCase().replace(/[^a-z0-9_-]/g, '');
      const url = (DOM.homeStreamUrlInput?.value || '').trim();
      const videoType = Player.getVideoType(url);
      const videoTitle = url ? `Stream: ${url.split('/').pop().split('?')[0] || 'Custom Stream'}` : 'Bethlehem Kudumba Unit (2026) Malayalam HQ HDRip - 1080p - x.mkv';

      state.user.username = name;
      state.roomId = code;
      localStorage.setItem('synccinema_user', JSON.stringify(state.user));

      if (url) {
        state.pendingInitialVideo = { url, videoType, title: videoTitle };
      }

      const newUrl = `${window.location.protocol}//${window.location.host}${window.location.pathname}?room=${code}`;
      window.history.pushState({ path: newUrl }, '', newUrl);

      enterTheaterMode(url || null, videoTitle);
      if (state.socket && state.socket.connected) joinCurrentRoom();
      showToast(`Room "${code}" created!`, 'success');
    });
  }

  // Home Watch Stream Form Submit (Join with code)
  if (DOM.homeWatchForm) {
    DOM.homeWatchForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = (DOM.homeJoinNameInput?.value || '').trim() || state.user.username;
      let codeOrUrl = (DOM.homeJoinCodeInput?.value || '').trim();

      // Allow pasting a full URL like http://localhost:3000/?room=cinema-7821
      if (codeOrUrl.includes('?room=')) {
        try {
          codeOrUrl = new URL(codeOrUrl).searchParams.get('room') || codeOrUrl;
        } catch (e) {}
      }
      const code = codeOrUrl.toLowerCase().replace(/[^a-z0-9_-]/g, '') || 'cinema-lounge';

      state.user.username = name;
      state.roomId = code;
      state.pendingInitialVideo = null;
      localStorage.setItem('synccinema_user', JSON.stringify(state.user));

      const newUrl = `${window.location.protocol}//${window.location.host}${window.location.pathname}?room=${code}`;
      window.history.pushState({ path: newUrl }, '', newUrl);

      enterTheaterMode();
      if (state.socket && state.socket.connected) joinCurrentRoom();
      showToast(`Joining room "${code}"...`, 'info');
    });
  }

  // Navbar "Home" button
  if (DOM.navHomeBtn) {
    DOM.navHomeBtn.addEventListener('click', () => {
      // Update URL to root
      window.history.pushState({}, '', window.location.pathname);
      goHome();
    });
  }

  // Navbar "Copy Room Code" button
  if (DOM.navCopyRoomCodeBtn) {
    DOM.navCopyRoomCodeBtn.addEventListener('click', () => {
      navigator.clipboard.writeText(state.roomId).then(() => {
        showToast(`Room code "${state.roomId}" copied!`, 'success');
      });
    });
  }

  // =========================================================
  // THEATER CONTROLS (below)
  // =========================================================

  // Play / Pause Button
  DOM.ctrlPlayBtn.addEventListener('click', () => {
    if (Player.isPlaying()) {
      Player.pause();
      emitSyncAction('pause');
    } else {
      Player.play();
      emitSyncAction('play');
    }
  });

  // Rewind -10s
  DOM.ctrlRewindBtn.addEventListener('click', () => {
    const newTime = Math.max(0, Player.getCurrentTime() - 10);
    Player.seek(newTime);
    emitSyncAction('rewind', { time: newTime });
  });

  // Fast Forward +10s
  DOM.ctrlFastForwardBtn.addEventListener('click', () => {
    const newTime = Math.min(Player.getDuration() || 9999, Player.getCurrentTime() + 10);
    Player.seek(newTime);
    emitSyncAction('fast_forward', { time: newTime });
  });

  // Force Resync Button
  DOM.syncStatusPill.addEventListener('click', () => {
    state.socket.emit('request_resync');
    showToast('Re-syncing with room...', 'info');
  });

  // Scrubber hover & click
  DOM.progressContainer.addEventListener('mousemove', (e) => {
    const rect = DOM.progressContainer.getBoundingClientRect();
    const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const duration = Player.getDuration();
    const hoverTime = pos * duration;

    DOM.progressHoverLine.style.width = `${pos * 100}%`;
    DOM.progressTooltip.style.left = `${pos * 100}%`;
    DOM.progressTooltip.textContent = formatTime(hoverTime);
  });

  DOM.progressContainer.addEventListener('click', (e) => {
    const rect = DOM.progressContainer.getBoundingClientRect();
    const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const duration = Player.getDuration();
    if (duration > 0) {
      const seekTime = pos * duration;
      Player.seek(seekTime);
      emitSyncAction('seek', { time: seekTime });
    }
  });

  // Volume Slider
  DOM.ctrlVolumeSlider.addEventListener('input', (e) => {
    const vol = parseFloat(e.target.value);
    DOM.cinemaVideo.volume = vol;
    updateVolumeIcon(vol);
  });

  DOM.ctrlVolumeBtn.addEventListener('click', () => {
    if (DOM.cinemaVideo.volume > 0) {
      DOM.cinemaVideo.volume = 0;
      DOM.ctrlVolumeSlider.value = 0;
      updateVolumeIcon(0);
    } else {
      DOM.cinemaVideo.volume = 1;
      DOM.ctrlVolumeSlider.value = 1;
      updateVolumeIcon(1);
    }
  });

  // Inline Speed Bar Pills (File2Link aesthetic)
  document.querySelectorAll('.speed-pill-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const speed = parseFloat(btn.dataset.speed);
      if (isNaN(speed)) return;
      Player.setPlaybackRate(speed);
      emitSyncAction('rate_change', { rate: speed });
    });
  });

  // Top Nav Copy Link Button
  if (DOM.navCopyLinkBtn) {
    DOM.navCopyLinkBtn.addEventListener('click', () => {
      const shareUrl = `${window.location.origin}?room=${state.roomId}`;
      navigator.clipboard.writeText(shareUrl).then(() => {
        showToast('Room link copied to clipboard!', 'success');
      }).catch(() => {
        showToast(`Room link: ${shareUrl}`, 'info');
      });
    });
  }

  // Picture in Picture Button
  if (DOM.inlinePipBtn) {
    DOM.inlinePipBtn.addEventListener('click', () => {
      if (document.pictureInPictureElement) {
        document.exitPictureInPicture().catch(() => {});
      } else if (DOM.cinemaVideo && document.pictureInPictureEnabled) {
        DOM.cinemaVideo.requestPictureInPicture().catch(() => {
          showToast('Picture-in-Picture not supported for this stream', 'warn');
        });
      }
    });
  }

  // Copy Video URL Button (Bottom card)
  if (DOM.copyVideoUrlBottomBtn) {
    DOM.copyVideoUrlBottomBtn.addEventListener('click', () => {
      const videoUrl = (DOM.streamUrlInput ? DOM.streamUrlInput.value : '') || DOM.cinemaVideo.currentSrc || DOM.cinemaVideo.src;
      if (videoUrl) {
        navigator.clipboard.writeText(videoUrl).then(() => {
          showToast('Video stream URL copied to clipboard!', 'success');
        }).catch(() => {
          showToast(`Video URL: ${videoUrl}`, 'info');
        });
      } else {
        showToast('No video stream loaded to copy', 'warn');
      }
    });
  }

  // Tap video to Play / Pause
  DOM.cinemaVideo.addEventListener('click', () => {
    DOM.ctrlPlayBtn.click();
  });

  // Fullscreen
  DOM.ctrlFullscreenBtn.addEventListener('click', () => {
    if (!document.fullscreenElement) {
      DOM.videoContainer.requestFullscreen().catch(() => {});
      DOM.fullscreenIcon.setAttribute('data-lucide', 'minimize');
    } else {
      document.exitFullscreen().catch(() => {});
      DOM.fullscreenIcon.setAttribute('data-lucide', 'maximize');
    }
    initLucide();
  });

  // Stream Input & Update / Play Buttons (if present)
  if (DOM.loadStreamBtn) {
    DOM.loadStreamBtn.addEventListener('click', () => {
      broadcastNewStreamFromInput();
    });
  }

  if (DOM.quickPlayPauseBtn) {
    DOM.quickPlayPauseBtn.addEventListener('click', () => {
      DOM.ctrlPlayBtn.click();
    });
  }

  if (DOM.streamUrlInput) {
    DOM.streamUrlInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') broadcastNewStreamFromInput();
    });

    DOM.streamUrlInput.addEventListener('input', () => {
      if (DOM.clearStreamInputBtn) {
        DOM.clearStreamInputBtn.style.display = DOM.streamUrlInput.value ? 'flex' : 'none';
      }
    });
  }

  if (DOM.clearStreamInputBtn) {
    DOM.clearStreamInputBtn.addEventListener('click', () => {
      if (DOM.streamUrlInput) DOM.streamUrlInput.value = '';
      DOM.clearStreamInputBtn.style.display = 'none';
    });
  }

  // Preset Streams Menu (if present)
  if (DOM.presetDropdownBtn) {
    DOM.presetDropdownBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (DOM.presetDropdownMenu) DOM.presetDropdownMenu.classList.toggle('open');
    });
  }

  document.querySelectorAll('.preset-item').forEach(item => {
    item.addEventListener('click', () => {
      const url = item.getAttribute('data-url');
      const type = item.getAttribute('data-type');
      const title = item.getAttribute('data-title');

      if (DOM.streamUrlInput) DOM.streamUrlInput.value = url;
      if (DOM.presetDropdownMenu) DOM.presetDropdownMenu.classList.remove('open');

      emitSyncAction('change_video', { url, videoType: type, title });
    });
  });

  // Live Reactions Click & Keyboard shortcuts (1-7)
  document.querySelectorAll('.btn-rx').forEach(btn => {
    btn.addEventListener('click', () => {
      const emoji = btn.getAttribute('data-emoji');
      sendReaction(emoji);
    });
  });

  // Keyboard Shortcuts
  window.addEventListener('keydown', (e) => {
    // Don't trigger if user is typing in chat or input
    if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;

    if (e.code === 'Space') {
      e.preventDefault();
      DOM.ctrlPlayBtn.click();
    } else if (e.code === 'ArrowLeft') {
      e.preventDefault();
      DOM.ctrlRewindBtn.click();
    } else if (e.code === 'ArrowRight') {
      e.preventDefault();
      DOM.ctrlFastForwardBtn.click();
    } else if (e.key.toLowerCase() === 'f') {
      DOM.ctrlFullscreenBtn.click();
    } else if (e.key.toLowerCase() === 'm') {
      DOM.ctrlVolumeBtn.click();
    } else if (['1','2','3','4','5','6','7'].includes(e.key)) {
      const emojis = ['❤️', '🔥', '🍿', '😂', '😮', '👏', '🎉'];
      const rx = emojis[parseInt(e.key) - 1];
      if (rx) sendReaction(rx);
    }
  });

  // Devices Dropdown Toggle
  DOM.devicesBadgeBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    DOM.devicesDropdown.classList.toggle('open');
  });

  // Room Code & Invite Link Triggers
  if (DOM.openWelcomeHubBtn) DOM.openWelcomeHubBtn.addEventListener('click', () => openJoinModal(false));
  if (DOM.closeWelcomeModalBtn) DOM.closeWelcomeModalBtn.addEventListener('click', () => { DOM.joinModal.style.display = 'none'; });
  if (DOM.roomPillBtn) DOM.roomPillBtn.addEventListener('click', openRoomManagerModal);
  if (DOM.dropdownRoomCodeBtn) {
    DOM.dropdownRoomCodeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      DOM.devicesDropdown.classList.remove('open');
      openRoomManagerModal();
    });
  }
  if (DOM.dropdownCopyInviteBtn) DOM.dropdownCopyInviteBtn.addEventListener('click', copyInviteUrl);
  if (DOM.copyShareUrlBtn) DOM.copyShareUrlBtn.addEventListener('click', copyInviteUrl);

  // Direct Room Hub Bar Actions
  if (DOM.copyRoomCodeDirectBtn) {
    DOM.copyRoomCodeDirectBtn.addEventListener('click', () => {
      navigator.clipboard.writeText(state.roomId).then(() => {
        showToast(`Room Code "${state.roomId}" copied!`, 'success');
      }).catch(() => {
        showToast(`Room Code: ${state.roomId}`, 'info');
      });
    });
  }

  if (DOM.copyRoomLinkDirectBtn) {
    DOM.copyRoomLinkDirectBtn.addEventListener('click', () => {
      const shareUrl = `${window.location.origin}?room=${state.roomId}`;
      navigator.clipboard.writeText(shareUrl).then(() => {
        showToast('Party invite link copied to clipboard!', 'success');
      }).catch(() => {
        showToast(`Invite URL: ${shareUrl}`, 'info');
      });
    });
  }

  if (DOM.createRoomDirectBtn) {
    DOM.createRoomDirectBtn.addEventListener('click', () => {
      openJoinModal(false);
    });
  }

  if (DOM.joinRoomDirectBtn) {
    DOM.joinRoomDirectBtn.addEventListener('click', () => {
      openJoinModal(true);
    });
  }

  // Room Manager Modal Actions
  if (DOM.copyActiveRoomCodeBtn) {
    DOM.copyActiveRoomCodeBtn.addEventListener('click', () => {
      navigator.clipboard.writeText(state.roomId).then(() => {
        showToast(`Room code "${state.roomId}" copied!`, 'success');
      });
    });
  }

  if (DOM.copyActiveRoomShareUrlBtn) {
    DOM.copyActiveRoomShareUrlBtn.addEventListener('click', () => {
      const url = DOM.activeRoomShareUrlInput.value || window.location.href;
      navigator.clipboard.writeText(url).then(() => {
        showToast('Room invite link copied to clipboard!', 'success');
      });
    });
  }

  if (DOM.modalGenerateCodeBtn) {
    DOM.modalGenerateCodeBtn.addEventListener('click', () => {
      DOM.modalRoomIdInput.value = generateRandomRoomCode();
    });
  }

  if (DOM.generateNewSwitchCodeBtn) {
    DOM.generateNewSwitchCodeBtn.addEventListener('click', () => {
      DOM.switchRoomCodeInput.value = generateRandomRoomCode();
    });
  }

  if (DOM.switchRoomForm) {
    DOM.switchRoomForm.addEventListener('submit', (e) => {
      e.preventDefault();
      switchRoom(DOM.switchRoomCodeInput.value);
    });
  }

  if (DOM.closeRoomManagerModalBtn) {
    DOM.closeRoomManagerModalBtn.addEventListener('click', () => {
      DOM.roomManagerModal.style.display = 'none';
    });
  }

  // Connect Phone / QR Code Modal
  if (DOM.dropdownConnectPhoneBtn) {
    DOM.dropdownConnectPhoneBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      DOM.devicesDropdown.classList.remove('open');
      openMobileConnectModal();
    });
  }
  if (DOM.connectMobileBtn) {
    DOM.connectMobileBtn.addEventListener('click', openMobileConnectModal);
  }
  DOM.closeMobileModalBtn.addEventListener('click', () => {
    DOM.mobileConnectModal.style.display = 'none';
  });
  DOM.copyMobileLanUrlBtn.addEventListener('click', () => {
    const url = DOM.mobileLanUrlInput.value;
    navigator.clipboard.writeText(url).then(() => {
      showToast('Mobile link copied to clipboard!', 'success');
    });
  });

  // Mobile Unmute & Realtime Sync Handler
  function handleUnmuteAndSync(e) {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    DOM.cinemaVideo.muted = false;
    DOM.cinemaVideo.volume = 1.0;
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => {});
    }
    if (DOM.mobileUnmuteOverlay) {
      DOM.mobileUnmuteOverlay.style.display = 'none';
    }
    // Attempt authentic user gesture play
    const p = DOM.cinemaVideo.play();
    if (p !== undefined) {
      p.then(() => {
        updatePlayPauseButtonUI(true);
      }).catch(err => {
        console.warn('Gesture playback notice:', err);
      });
    }
    // Immediately ask server for exact room timestamp and playback state
    if (state.socket && state.socket.connected) {
      state.socket.emit('request_resync');
    }
    showToast('🔊 Audio synchronized with room!', 'success');
  }

  if (DOM.mobileUnmuteBtn) {
    DOM.mobileUnmuteBtn.addEventListener('click', handleUnmuteAndSync);
    DOM.mobileUnmuteBtn.addEventListener('touchend', handleUnmuteAndSync, { passive: false });
  }
  if (DOM.mobileUnmuteOverlay) {
    DOM.mobileUnmuteOverlay.addEventListener('click', handleUnmuteAndSync);
    DOM.mobileUnmuteOverlay.addEventListener('touchend', handleUnmuteAndSync, { passive: false });
  }

  // Sidebar Toggle
  if (DOM.toggleSidebarBtn) {
    DOM.toggleSidebarBtn.addEventListener('click', () => {
      const stage = document.querySelector('.main-stage');
      if (stage) stage.classList.toggle('sidebar-open');
    });
  }

  // Sidebar Tabs
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));

      btn.classList.add('active');
      const targetId = btn.getAttribute('data-tab');
      document.getElementById(targetId).classList.add('active');

      if (targetId === 'chatTab') {
        DOM.chatUnreadDot.style.display = 'none';
      }
    });
  });

  // Chat Form Submit
  DOM.chatForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = DOM.chatInput.value.trim();
    if (text) {
      state.socket.emit('send_chat', { text });
      DOM.chatInput.value = '';
    }
  });

  // Queue Add
  DOM.addToQueueBtn.addEventListener('click', () => {
    const url = DOM.queueUrlInput.value.trim();
    if (url) {
      const type = Player.getVideoType(url);
      state.socket.emit('add_to_playlist', {
        url,
        videoType: type,
        title: `Queued Stream (${type.toUpperCase()})`
      });
      DOM.queueUrlInput.value = '';
      showToast('Added to watch queue!', 'success');
    }
  });

  // Settings Toggles
  DOM.settingLockToggle.addEventListener('change', (e) => {
    if (state.isHost) state.socket.emit('toggle_controls_lock');
    else e.target.checked = state.controlsLocked;
  });

  DOM.settingAutoSyncToggle.addEventListener('change', (e) => {
    state.settings.autoSync = e.target.checked;
  });

  DOM.settingSfxToggle.addEventListener('change', (e) => {
    state.settings.sfx = e.target.checked;
  });

  DOM.settingAmbientGlowToggle.addEventListener('change', (e) => {
    state.settings.ambientGlow = e.target.checked;
    DOM.ambientGlow.style.opacity = e.target.checked ? '1' : '0';
    DOM.ambientCanvas.style.opacity = e.target.checked ? '0.3' : '0';
  });

  // Settings Profile Save
  DOM.saveProfileBtn.addEventListener('click', () => {
    const newName = DOM.settingsUsernameInput.value.trim();
    if (newName) {
      state.user.username = newName;
      localStorage.setItem('synccinema_user', JSON.stringify(state.user));
      updateProfileUI();
      joinCurrentRoom();
      showToast('Profile updated!', 'success');
    }
  });

  // Welcome Hub: Tabs Switcher (Start Stream vs Watch Stream)
  if (DOM.tabStartStreamBtn) {
    DOM.tabStartStreamBtn.addEventListener('click', () => switchWelcomeTab('start'));
  }
  if (DOM.tabWatchStreamBtn) {
    DOM.tabWatchStreamBtn.addEventListener('click', () => switchWelcomeTab('watch'));
  }

  // Welcome Hub: Roll New Code
  if (DOM.rollNewRoomCodeBtn) {
    DOM.rollNewRoomCodeBtn.addEventListener('click', () => {
      DOM.createRoomCodeInput.value = generateRandomRoomCode();
    });
  }

  // Welcome Hub: Quick Stream Chips
  document.querySelectorAll('.stream-chip-btn').forEach(chip => {
    chip.addEventListener('click', () => {
      const url = chip.getAttribute('data-url');
      if (DOM.createStreamUrlInput) DOM.createStreamUrlInput.value = url;
    });
  });

  // Quick Room Presets in Modal
  document.querySelectorAll('.room-tag-btn').forEach(tag => {
    tag.addEventListener('click', () => {
      if (DOM.joinRoomCodeInput) DOM.joinRoomCodeInput.value = tag.getAttribute('data-room');
    });
  });

  // Welcome Hub: Mode 1 - Start Stream & Create Room Form Submit
  if (DOM.startStreamForm) {
    DOM.startStreamForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const enteredName = DOM.modalUsernameInput.value.trim() || state.user.username;
      const roomCode = (DOM.createRoomCodeInput.value || generateRandomRoomCode()).trim().toLowerCase().replace(/[^a-z0-9_-]/g, '');
      const streamUrl = DOM.createStreamUrlInput ? DOM.createStreamUrlInput.value.trim() : '';

      state.user.username = enteredName;
      state.roomId = roomCode;
      localStorage.setItem('synccinema_user', JSON.stringify(state.user));
      updateProfileUI();
      updateRoomCodeDisplays(state.roomId);

      // Update browser URL
      const newUrl = `${window.location.protocol}//${window.location.host}${window.location.pathname}?room=${state.roomId}`;
      window.history.pushState({ path: newUrl }, '', newUrl);

      joinCurrentRoom();
      DOM.joinModal.style.display = 'none';

      // If user pasted a stream link, broadcast it
      if (streamUrl) {
        DOM.streamUrlInput.value = streamUrl;
        const type = Player.getVideoType(streamUrl);
        const title = `Stream: ${streamUrl.split('/').pop().split('?')[0] || 'Custom Stream'}`;
        setTimeout(() => {
          emitSyncAction('change_video', { url: streamUrl, videoType: type, title });
        }, 700);
      }

      showToast(`Party created! Room Code: ${state.roomId}`, 'success');
      if (DOM.joinModal) DOM.joinModal.style.display = 'none';
      if (DOM.roomManagerModal) DOM.roomManagerModal.style.display = 'none';
    });
  }

  // Welcome Hub: Mode 2 - Watch Stream Form Submit
  if (DOM.watchStreamForm) {
    DOM.watchStreamForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const enteredName = DOM.modalUsernameInput.value.trim() || state.user.username;
      const roomCode = (DOM.joinRoomCodeInput.value || 'cinema-lounge').trim().toLowerCase().replace(/[^a-z0-9_-]/g, '');

      state.user.username = enteredName;
      state.roomId = roomCode;
      localStorage.setItem('synccinema_user', JSON.stringify(state.user));
      updateProfileUI();
      updateRoomCodeDisplays(state.roomId);

      const newUrl = `${window.location.protocol}//${window.location.host}${window.location.pathname}?room=${state.roomId}`;
      window.history.pushState({ path: newUrl }, '', newUrl);

      joinCurrentRoom();
      DOM.joinModal.style.display = 'none';
      if (DOM.roomManagerModal) DOM.roomManagerModal.style.display = 'none';
      showToast(`Joined watch party "${state.roomId}"!`, 'success');
    });
  }

  // Home QR Scan button trigger
  if (DOM.homeScanQrBtn) {
    DOM.homeScanQrBtn.addEventListener('click', openMobileConnectModal);
  }

  // Room Manager QR Scan button trigger
  if (DOM.openQrFromRoomManagerBtn) {
    DOM.openQrFromRoomManagerBtn.addEventListener('click', () => {
      if (DOM.roomManagerModal) DOM.roomManagerModal.style.display = 'none';
      openMobileConnectModal();
    });
  }

  // Close menus on outside click or tap
  function closeAllDropdowns(e) {
    const targetEl = (e && e.target instanceof Element) ? e.target : (e?.target?.parentElement instanceof Element ? e.target.parentElement : null);
    if (targetEl) {
      if (!targetEl.closest('.devices-indicator-container') && DOM.devicesDropdown) {
        DOM.devicesDropdown.classList.remove('open');
      }
      if (!targetEl.closest('.preset-dropdown-container') && DOM.presetDropdownMenu) {
        DOM.presetDropdownMenu.classList.remove('open');
      }
    } else {
      if (DOM.devicesDropdown) DOM.devicesDropdown.classList.remove('open');
      if (DOM.presetDropdownMenu) DOM.presetDropdownMenu.classList.remove('open');
    }
  }

  document.addEventListener('click', closeAllDropdowns);
  document.addEventListener('touchstart', closeAllDropdowns, { passive: true });
}

function broadcastNewStreamFromInput() {
  const url = DOM.streamUrlInput.value.trim();
  if (!url) {
    showToast('Please enter a valid video stream URL.', 'warn');
    return;
  }

  const type = Player.getVideoType(url);
  const title = `Stream: ${url.split('/').pop().split('?')[0] || 'Custom Stream'}`;

  emitSyncAction('change_video', { url, videoType: type, title });
  DOM.clearStreamInputBtn.style.display = 'none';
}

function sendReaction(emoji) {
  state.socket.emit('send_reaction', { emoji });
  spawnFloatingReaction(emoji);
  playSound('pop');
}

// --- Floating Reactions Engine ---
function spawnFloatingReaction(emoji) {
  const el = document.createElement('div');
  el.className = 'floating-reaction';
  el.textContent = emoji;

  const leftPercent = 15 + Math.random() * 70;
  const rotMid = (Math.random() - 0.5) * 40;
  const rotEnd = (Math.random() - 0.5) * 60;

  el.style.left = `${leftPercent}%`;
  el.style.setProperty('--rot-mid', `${rotMid}deg`);
  el.style.setProperty('--rot-end', `${rotEnd}deg`);

  DOM.reactionOverlay.appendChild(el);

  setTimeout(() => {
    el.remove();
  }, 3300);
}

// --- UI Rendering Helpers ---
function updateDeviceCounters(count) {
  DOM.connectedDevicesCount.textContent = count;
  DOM.dropdownDeviceCount.textContent = count;
  DOM.sideDeviceCount.textContent = count;
  DOM.tabDeviceCount.textContent = `${count} Active`;
}

function renderDeviceLists(users, hostId) {
  // Quick dropdown list
  DOM.quickDeviceList.innerHTML = '';
  DOM.devicesListFull.innerHTML = '';

  users.forEach(user => {
    const isMe = user.id === state.socket.id;
    const isHost = user.id === hostId;
    const deviceIcon = user.deviceType === 'Mobile' ? 'smartphone' : 'monitor';

    // Quick item card
    const quickCard = document.createElement('div');
    quickCard.className = 'device-item-card';
    quickCard.innerHTML = `
      <div class="device-item-left">
        <div class="device-icon-chip">
          <i data-lucide="${deviceIcon}" class="w-3.5 h-3.5 text-slate-300"></i>
        </div>
        <div class="device-info-name">
          <span>${user.username} ${isMe ? '(You)' : ''}</span>
          ${isHost ? '<span class="badge-host">HOST</span>' : ''}
        </div>
      </div>
      <span class="device-ping-badge" data-user-ping="${user.id}">⚡ ${user.ping || 12}ms</span>
    `;
    DOM.quickDeviceList.appendChild(quickCard);

    // Full sidebar device card
    const fullCard = document.createElement('div');
    fullCard.className = 'device-card-row';
    fullCard.innerHTML = `
      <div class="device-item-left">
        <div class="device-icon-chip">
          <i data-lucide="${deviceIcon}" class="w-3.5 h-3.5 text-slate-300"></i>
        </div>
        <div class="device-info-wrap">
          <div class="device-info-name">
            <span>${user.username} ${isMe ? '(You)' : ''}</span>
            ${isHost ? '<span class="badge-host">HOST</span>' : ''}
          </div>
          <span class="device-info-sub">${user.deviceType} &bull; Joined ${formatJoinTime(user.joinedAt)}</span>
        </div>
      </div>
      <span class="device-ping-badge" data-user-ping="${user.id}">⚡ ${user.ping || 12}ms</span>
    `;
    DOM.devicesListFull.appendChild(fullCard);
  });
  initLucide();
}

function renderPlaylist(playlist) {
  DOM.playlistItemsList.innerHTML = '';
  if (!playlist || playlist.length === 0) {
    DOM.playlistItemsList.innerHTML = '<p style="font-size:0.78rem;color:var(--text-muted);text-align:center;">Queue is empty.</p>';
    return;
  }

  playlist.forEach(item => {
    const itemEl = document.createElement('div');
    itemEl.className = 'queue-item';
    itemEl.innerHTML = `
      <div class="queue-item-info">
        <span class="queue-item-title">${item.title}</span>
        <span class="queue-item-url">${item.url}</span>
      </div>
      <div class="queue-actions">
        <button class="btn-play-queue" title="Play Now">
          <i data-lucide="play" class="w-3.5 h-3.5 text-emerald-400"></i>
        </button>
        <button class="btn-del-queue" title="Remove">
          <i data-lucide="trash-2" class="w-3.5 h-3.5 text-rose-400"></i>
        </button>
      </div>
    `;

    itemEl.querySelector('.btn-play-queue').addEventListener('click', () => {
      emitSyncAction('change_video', {
        url: item.url,
        videoType: item.videoType,
        title: item.title
      });
    });

    itemEl.querySelector('.btn-del-queue').addEventListener('click', () => {
      state.socket.emit('remove_from_playlist', { itemId: item.id });
    });

    DOM.playlistItemsList.appendChild(itemEl);
  });
  initLucide();
}

function appendChatMessage(msg) {
  // Ignore action logs (pressed Play, paused, fast-forwarded, connected/disconnected, etc.)
  if (msg.type === 'system' || msg.type === 'action') {
    return;
  }

  const isMe = msg.userId === state.socket.id;
  const msgEl = document.createElement('div');
  msgEl.className = `chat-msg ${isMe ? 'is-me' : ''}`;
  msgEl.innerHTML = `
    <div class="chat-msg-header">
      <span class="chat-author-name">${msg.username}</span>
      <span class="chat-timestamp">${formatChatTime(msg.timestamp)}</span>
    </div>
    <div class="chat-bubble">${escapeHtml(msg.text)}</div>
  `;

  DOM.chatMessages.appendChild(msgEl);
  DOM.chatMessages.scrollTop = DOM.chatMessages.scrollHeight;

  // Unread badge indicator if on another tab
  const activeTab = document.querySelector('.tab-btn.active');
  if (activeTab && activeTab.getAttribute('data-tab') !== 'chatTab') {
    DOM.chatUnreadDot.style.display = 'block';
  }
}

function updateSpeedPillsUI(rate) {
  document.querySelectorAll('.speed-pill-btn').forEach(btn => {
    if (parseFloat(btn.dataset.speed) === rate) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });
  if (DOM.currentSpeedLabel) DOM.currentSpeedLabel.textContent = `${rate}x`;
}

function formatDurationHMS(seconds) {
  if (isNaN(seconds) || seconds <= 0) return '0h 00m 00s';
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  if (hrs > 0) {
    return `${hrs}h ${mins}m ${secs < 10 ? '0' : ''}${secs}s`;
  }
  return `${mins}m ${secs < 10 ? '0' : ''}${secs}s`;
}

function updateVideoMetadataDisplays(url, title) {
  if (title && DOM.displayVideoTitle) {
    DOM.displayVideoTitle.textContent = title;
    document.title = `Watch ${title} — File2Link`;
  }
  if (DOM.metaFormatDisplay) {
    const lower = (url || DOM.cinemaVideo.src || '').toLowerCase();
    let fmt = 'MP4';
    if (lower.includes('.mkv')) fmt = 'MKV';
    else if (lower.includes('.m3u8')) fmt = 'HLS';
    else if (lower.includes('.webm')) fmt = 'WEBM';
    else if (lower.includes('youtube') || lower.includes('youtu.be')) fmt = 'YouTube';
    DOM.metaFormatDisplay.textContent = fmt;
  }
  if (DOM.metaDurationDisplay) {
    const dur = Player.getDuration();
    if (dur && !isNaN(dur) && dur > 0) {
      DOM.metaDurationDisplay.textContent = formatDurationHMS(dur);
    }
  }
  if (DOM.metaResolutionDisplay) {
    if (DOM.cinemaVideo.videoWidth && DOM.cinemaVideo.videoHeight) {
      DOM.metaResolutionDisplay.textContent = `${DOM.cinemaVideo.videoWidth}x${DOM.cinemaVideo.videoHeight}`;
    }
  }
  if (DOM.metaStatusDisplay) {
    DOM.metaStatusDisplay.textContent = 'Ready';
  }
}

function updateHostLockUI() {
  if (DOM.navHostTag) DOM.navHostTag.style.display = state.isHost ? 'inline-block' : 'none';
  if (DOM.hostLockIcon) {
    DOM.hostLockIcon.setAttribute('data-lucide', state.controlsLocked ? 'lock' : 'unlock');
  }
  if (DOM.hostLockedOverlay) {
    DOM.hostLockedOverlay.style.display = (state.controlsLocked && !state.isHost) ? 'flex' : 'none';
  }
  if (DOM.settingLockToggle) {
    DOM.settingLockToggle.checked = state.controlsLocked;
  }
  initLucide();
}

function updateProfileUI() {
  if (DOM.navUserAvatar) DOM.navUserAvatar.textContent = '';
  if (DOM.navUserName) DOM.navUserName.textContent = state.user.username;
  if (DOM.settingsUsernameInput) DOM.settingsUsernameInput.value = state.user.username;
}

function switchWelcomeTab(mode) {
  if (mode === 'watch') {
    if (DOM.tabWatchStreamBtn) DOM.tabWatchStreamBtn.classList.add('active');
    if (DOM.tabStartStreamBtn) DOM.tabStartStreamBtn.classList.remove('active');
    if (DOM.watchStreamForm) DOM.watchStreamForm.style.display = 'flex';
    if (DOM.startStreamForm) DOM.startStreamForm.style.display = 'none';
  } else {
    if (DOM.tabStartStreamBtn) DOM.tabStartStreamBtn.classList.add('active');
    if (DOM.tabWatchStreamBtn) DOM.tabWatchStreamBtn.classList.remove('active');
    if (DOM.startStreamForm) DOM.startStreamForm.style.display = 'flex';
    if (DOM.watchStreamForm) DOM.watchStreamForm.style.display = 'none';
  }
}

function openJoinModal(preferWatchMode = false) {
  if (!DOM.joinModal) return;
  if (DOM.modalUsernameInput) DOM.modalUsernameInput.value = state.user.username;
  if (DOM.createRoomCodeInput) DOM.createRoomCodeInput.value = generateRandomRoomCode();
  if (DOM.joinRoomCodeInput) DOM.joinRoomCodeInput.value = state.roomId || '';

  switchWelcomeTab(preferWatchMode ? 'watch' : 'start');
  DOM.joinModal.style.display = 'flex';
  initLucide();
}

function openMobileConnectModal() {
  if (!DOM.mobileConnectModal) return;
  DOM.mobileConnectModal.style.display = 'flex';

  const mobileJoinUrl = getBestShareUrl(state.roomId);
  if (DOM.mobileLanUrlInput) DOM.mobileLanUrlInput.value = mobileJoinUrl;

  // Render QR Code immediately
  if (window.QRCode && DOM.qrCodeCanvas) {
    QRCode.toCanvas(DOM.qrCodeCanvas, mobileJoinUrl, {
      width: 180,
      margin: 1,
      color: {
        dark: '#0f172a',
        light: '#ffffff'
      }
    }, function (error) {
      if (error) console.error('QR code generation error:', error);
    });
  }

  // In background, refresh network info and update QR code
  fetchNetworkInfo().then(() => {
    const updatedUrl = getBestShareUrl(state.roomId);
    if (DOM.mobileLanUrlInput) DOM.mobileLanUrlInput.value = updatedUrl;
    if (window.QRCode && DOM.qrCodeCanvas) {
      QRCode.toCanvas(DOM.qrCodeCanvas, updatedUrl, {
        width: 180,
        margin: 1,
        color: {
          dark: '#0f172a',
          light: '#ffffff'
        }
      }, () => {});
    }
  });
}

function generateRandomRoomCode() {
  const prefixes = ['cinema', 'movie', 'stream', 'party', 'lounge', 'sync'];
  const p = prefixes[Math.floor(Math.random() * prefixes.length)];
  const num = Math.floor(1000 + Math.random() * 9000);
  return `${p}-${num}`;
}

function openRoomManagerModal() {
  if (!DOM.roomManagerModal) return;
  if (DOM.activeRoomCodeDisplay) DOM.activeRoomCodeDisplay.textContent = state.roomId;
  const shareUrl = getBestShareUrl(state.roomId);
  if (DOM.activeRoomShareUrlInput) DOM.activeRoomShareUrlInput.value = shareUrl;
  if (DOM.switchRoomCodeInput) DOM.switchRoomCodeInput.value = '';
  DOM.roomManagerModal.style.display = 'flex';
  initLucide();
}

function switchRoom(newRoomId) {
  const cleaned = (newRoomId || '').trim().toLowerCase().replace(/[^a-z0-9_-]/g, '');
  if (!cleaned) {
    showToast('Please enter a valid room code.', 'warn');
    return;
  }
  if (cleaned === state.roomId) {
    showToast(`You are already in room "${cleaned}".`, 'info');
    if (DOM.roomManagerModal) DOM.roomManagerModal.style.display = 'none';
    return;
  }

  state.roomId = cleaned;
  if (DOM.displayRoomId) DOM.displayRoomId.textContent = state.roomId;

  const newUrl = `${window.location.protocol}//${window.location.host}${window.location.pathname}?room=${state.roomId}`;
  window.history.pushState({ path: newUrl }, '', newUrl);

  joinCurrentRoom();
  if (DOM.roomManagerModal) DOM.roomManagerModal.style.display = 'none';
  if (DOM.joinModal) DOM.joinModal.style.display = 'none';
  showToast(`Joined room "${state.roomId}"!`, 'success');
}

function updateRoomCodeDisplays(roomId) {
  state.roomId = roomId;
  if (DOM.displayRoomId) DOM.displayRoomId.textContent = roomId;
  if (DOM.currentRoomCodeDisplay) DOM.currentRoomCodeDisplay.textContent = roomId;
  if (DOM.activeRoomCodeDisplay) DOM.activeRoomCodeDisplay.textContent = roomId;
  updateShareLink(roomId);
}

function updateShareLink(roomId) {
  const shareUrl = getBestShareUrl(roomId);
  if (DOM.shareUrlInput) DOM.shareUrlInput.value = shareUrl;
  if (DOM.activeRoomShareUrlInput) DOM.activeRoomShareUrlInput.value = shareUrl;
}

function copyInviteUrl() {
  const url = getBestShareUrl(state.roomId);
  const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  navigator.clipboard.writeText(url).then(() => {
    if (isLocalhost) {
      showToast('📱 Share link copied! Works on phones & other devices on your Wi-Fi.', 'success');
    } else {
      showToast('🎉 Watch party invite link copied! Anyone with the link can join.', 'success');
    }
  }).catch(() => {
    showToast(`Share URL: ${url}`, 'info');
  });
}

function flashCenterAction(iconName) {
  DOM.centerActionIcon.setAttribute('data-lucide', iconName);
  initLucide();
  DOM.centerActionIndicator.classList.add('animate');
  setTimeout(() => {
    DOM.centerActionIndicator.classList.remove('animate');
  }, 450);
}

function showSyncBadge(text) {
  DOM.syncNotificationText.textContent = text;
  DOM.syncNotificationBadge.classList.add('show');
  setTimeout(() => {
    DOM.syncNotificationBadge.classList.remove('show');
  }, 1600);
}

function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span>${message}</span>`;
  DOM.toastCenter.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 250);
  }, 3200);
}

// --- Ambient Canvas Glow Renderer ---
let canvasCtx = null;
function renderAmbientCanvas() {
  if (!canvasCtx) {
    canvasCtx = DOM.ambientCanvas.getContext('2d', { willReadFrequently: true });
    DOM.ambientCanvas.width = 160;
    DOM.ambientCanvas.height = 90;
  }
  try {
    if (DOM.cinemaVideo.videoWidth > 0) {
      canvasCtx.drawImage(DOM.cinemaVideo, 0, 0, 160, 90);
    }
  } catch (e) {}
}

// --- Formatters & Helpers ---
function formatTime(seconds) {
  if (isNaN(seconds) || seconds < 0) return '00:00';
  const s = Math.floor(seconds);
  const mins = Math.floor(s / 60);
  const secs = s % 60;
  const hrs = Math.floor(mins / 60);
  if (hrs > 0) {
    const remMins = mins % 60;
    return `${hrs}:${remMins < 10 ? '0' : ''}${remMins}:${secs < 10 ? '0' : ''}${secs}`;
  }
  return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

function formatChatTime(timestamp) {
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatJoinTime(timestamp) {
  const diffSec = Math.floor((Date.now() - timestamp) / 1000);
  if (diffSec < 60) return 'just now';
  const diffMin = Math.floor(diffSec / 60);
  return `${diffMin}m ago`;
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
