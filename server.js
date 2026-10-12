const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');

const app = express();
app.set('trust proxy', 1);

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  },
  pingTimeout: 60000,
  pingInterval: 25000,
  transports: ['websocket', 'polling']
});

const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// In-memory room storage
const rooms = new Map();

// Default stream state when no stream is loaded
const DEFAULT_STREAM = {
  url: '',
  videoType: 'html5',
  title: 'No Stream Loaded',
  isPlaying: false,
  currentTime: 0,
  playbackRate: 1.0,
  lastUpdated: Date.now()
};

function getOrCreateRoom(roomId, initialName) {
  if (!rooms.has(roomId)) {
    rooms.set(roomId, {
      id: roomId,
      name: initialName || `Room #${roomId}`,
      createdAt: Date.now(),
      hostId: null,
      controlsLocked: false,
      videoState: { ...DEFAULT_STREAM, lastUpdated: Date.now() },
      users: new Map(),
      playlist: [
        {
          id: 'demo-1',
          url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
          videoType: 'html5',
          title: 'Big Buck Bunny (Classic Animation)'
        },
        {
          id: 'demo-2',
          url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
          videoType: 'html5',
          title: 'Tears of Steel (Sci-Fi VFX Open Movie)'
        },
        {
          id: 'demo-3',
          url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
          videoType: 'html5',
          title: "Elephants Dream (3D CGI Short)"
        },
        {
          id: 'demo-4',
          url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
          videoType: 'hls',
          title: 'Big Buck Bunny (HLS Adaptive Live Stream .m3u8)'
        },
        {
          id: 'demo-5',
          url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
          videoType: 'youtube',
          title: 'Rick Astley - Never Gonna Give You Up (YouTube)'
        }
      ],
      chatHistory: []
    });
  }
  return rooms.get(roomId);
}

function calculateCurrentTime(videoState) {
  if (!videoState.isPlaying) {
    return videoState.currentTime;
  }
  const elapsedSec = (Date.now() - videoState.lastUpdated) / 1000;
  return videoState.currentTime + (elapsedSec * (videoState.playbackRate || 1.0));
}

function getRoomSnapshot(room) {
  const currentCalculatedTime = calculateCurrentTime(room.videoState);
  const userList = Array.from(room.users.values()).map(u => ({
    id: u.id,
    username: u.username,
    avatar: u.avatar,
    deviceType: u.deviceType,
    ping: u.ping || 0,
    isHost: u.id === room.hostId,
    joinedAt: u.joinedAt
  }));

  return {
    roomId: room.id,
    name: room.name,
    hostId: room.hostId,
    controlsLocked: room.controlsLocked,
    connectedDevicesCount: room.users.size,
    users: userList,
    videoState: {
      ...room.videoState,
      currentTime: currentCalculatedTime,
      serverTime: Date.now()
    },
    playlist: room.playlist,
    chatHistory: room.chatHistory.slice(-50)
  };
}

function getGlobalLiveStats() {
  const activeRooms = Array.from(rooms.values()).filter(r => r.users.size > 0);
  const totalLiveUsers = io.engine ? io.engine.clientsCount : (io.sockets && io.sockets.sockets ? io.sockets.sockets.size : 0);
  return {
    totalUsers: totalLiveUsers,
    activeRoomsCount: activeRooms.length
  };
}

function broadcastGlobalLiveStats() {
  io.emit('global_live_stats', getGlobalLiveStats());
}

// API endpoint to inspect active rooms and live stats
app.get('/api/rooms', (req, res) => {
  const roomList = Array.from(rooms.values()).map(r => ({
    id: r.id,
    name: r.name,
    userCount: r.users.size,
    currentVideo: r.videoState.title,
    isPlaying: r.videoState.isPlaying
  }));
  const stats = getGlobalLiveStats();
  res.json({
    success: true,
    rooms: roomList,
    totalUsers: stats.totalUsers,
    activeRoomsCount: stats.activeRoomsCount
  });
});

// API endpoint to get network IP or cloud URL for mobile and remote connections
app.get('/api/network-info', (req, res) => {
  const host = req.headers['x-forwarded-host'] || req.headers.host || '';
  const proto = req.headers['x-forwarded-proto'] || req.protocol || 'http';
  const isCloud = Boolean(
    process.env.RENDER || 
    process.env.RENDER_EXTERNAL_URL || 
    (host && !host.includes('localhost') && !host.includes('127.0.0.1'))
  );

  const publicUrl = process.env.RENDER_EXTERNAL_URL || (isCloud && host ? `${proto}://${host}` : null);

  const os = require('os');
  const interfaces = os.networkInterfaces();
  const addresses = [];

  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      // IPv4 and not internal loopback
      if (iface.family === 'IPv4' && !iface.internal) {
        addresses.push(iface.address);
      }
    }
  }

  res.json({
    success: true,
    isCloud,
    port: PORT,
    localIps: addresses,
    recommendedUrl: publicUrl || (addresses.length > 0 ? `http://${addresses[0]}:${PORT}` : `http://localhost:${PORT}`)
  });
});

io.on('connection', (socket) => {
  let currentRoomId = null;

  // Send initial real live stats to connected client and update all clients
  socket.emit('global_live_stats', getGlobalLiveStats());
  broadcastGlobalLiveStats();

  // Latency ping-pong
  socket.on('latency_ping', (clientTimestamp) => {
    socket.emit('latency_pong', {
      clientTimestamp,
      serverTimestamp: Date.now()
    });
  });

  // Client updates its recorded ping
  socket.on('update_ping', ({ ping }) => {
    if (currentRoomId && rooms.has(currentRoomId)) {
      const room = rooms.get(currentRoomId);
      if (room.users.has(socket.id)) {
        room.users.get(socket.id).ping = ping;
        io.to(currentRoomId).emit('user_ping_updated', {
          userId: socket.id,
          ping
        });
      }
    }
  });

  // Join or create room
  socket.on('join_room', ({ roomId, username, avatar, deviceType, initialVideo }) => {
    const cleanRoomId = (roomId || 'cinema-lounge').trim().toLowerCase().replace(/[^a-z0-9_-]/g, '');
    const validRoomId = cleanRoomId || 'cinema-lounge';

    // If socket was in another room, leave first
    if (currentRoomId && currentRoomId !== validRoomId) {
      leaveCurrentRoom();
    }

    currentRoomId = validRoomId;
    socket.join(validRoomId);

    const isNewRoom = !rooms.has(validRoomId);
    const room = getOrCreateRoom(validRoomId);

    // If room has no host, this user becomes the host
    if (!room.hostId || !room.users.has(room.hostId)) {
      room.hostId = socket.id;
    }

    // If initial video is provided by room creator, update video state
    if (initialVideo && initialVideo.url && (isNewRoom || room.hostId === socket.id)) {
      room.videoState.url = initialVideo.url;
      room.videoState.videoType = initialVideo.videoType || 'html5';
      room.videoState.title = initialVideo.title || 'Stream Media';
      room.videoState.currentTime = 0;
      room.videoState.isPlaying = false;
      room.videoState.playbackRate = 1.0;
      room.videoState.lastUpdated = Date.now();
    }

    const userData = {
      id: socket.id,
      username: (username || `Viewer #${Math.floor(1000 + Math.random() * 9000)}`).trim().slice(0, 24),
      avatar: '',
      deviceType: deviceType || 'Desktop',
      ping: 0,
      joinedAt: Date.now()
    };

    room.users.set(socket.id, userData);

    // Send full room snapshot to joining user
    socket.emit('room_joined_state', getRoomSnapshot(room));

    // Broadcast updated user count & list to everyone in the room
    const userList = Array.from(room.users.values()).map(u => ({
      id: u.id,
      username: u.username,
      avatar: u.avatar,
      deviceType: u.deviceType,
      ping: u.ping || 0,
      isHost: u.id === room.hostId,
      joinedAt: u.joinedAt
    }));

    io.to(validRoomId).emit('room_users_updated', {
      connectedDevicesCount: room.users.size,
      users: userList,
      hostId: room.hostId
    });

    broadcastGlobalLiveStats();
  });

  // Action Synchronization (play, pause, seek, playbackRate, change_video)
  socket.on('sync_action', (actionData) => {
    if (!currentRoomId || !rooms.has(currentRoomId)) return;
    const room = rooms.get(currentRoomId);
    const user = room.users.get(socket.id);
    if (!user) return;

    // Check host lock permission
    if (room.controlsLocked && room.hostId !== socket.id) {
      socket.emit('action_rejected', {
        reason: 'Controls are currently locked by the Room Host.'
      });
      return;
    }

    const { action, time, rate, url, videoType, title } = actionData;
    const now = Date.now();

    switch (action) {
      case 'play':
        room.videoState.isPlaying = true;
        if (typeof time === 'number') {
          room.videoState.currentTime = Math.max(0, time);
        }
        room.videoState.lastUpdated = now;
        break;

      case 'pause':
        room.videoState.isPlaying = false;
        if (typeof time === 'number') {
          room.videoState.currentTime = Math.max(0, time);
        }
        room.videoState.lastUpdated = now;
        break;

      case 'seek':
        if (typeof time === 'number') {
          room.videoState.currentTime = Math.max(0, time);
        }
        room.videoState.lastUpdated = now;
        break;

      case 'fast_forward':
      case 'rewind':
        if (typeof time === 'number') {
          room.videoState.currentTime = Math.max(0, time);
        }
        room.videoState.lastUpdated = now;
        break;

      case 'rate_change':
        if (typeof rate === 'number' && rate >= 0.25 && rate <= 3.0) {
          // Update current calculated time before changing rate
          room.videoState.currentTime = calculateCurrentTime(room.videoState);
          room.videoState.playbackRate = rate;
          room.videoState.lastUpdated = now;
        }
        break;

      case 'change_video':
        if (url) {
          room.videoState.url = url;
          room.videoState.videoType = videoType || 'html5';
          room.videoState.title = title || 'Stream Media';
          room.videoState.currentTime = 0;
          room.videoState.isPlaying = true;
          room.videoState.playbackRate = 1.0;
          room.videoState.lastUpdated = now;
        }
        break;

      default:
        break;
    }

    // Broadcast synchronization event to all connected devices in the room
    io.to(currentRoomId).emit('room_sync_action', {
      action,
      senderId: socket.id,
      senderName: user.username,
      videoState: {
        ...room.videoState,
        currentTime: room.videoState.currentTime,
        serverTime: now
      },
      timestamp: now
    });
  });

  // Client requests immediate re-synchronization (e.g., drift correction button)
  socket.on('request_resync', () => {
    if (currentRoomId && rooms.has(currentRoomId)) {
      const room = rooms.get(currentRoomId);
      const currentTime = calculateCurrentTime(room.videoState);
      socket.emit('room_sync_action', {
        action: 'force_resync',
        senderId: 'server',
        videoState: {
          ...room.videoState,
          currentTime,
          serverTime: Date.now()
        },
        timestamp: Date.now()
      });
    }
  });

  // Chat message
  socket.on('send_chat', ({ text }) => {
    if (!currentRoomId || !rooms.has(currentRoomId) || !text) return;
    const room = rooms.get(currentRoomId);
    const user = room.users.get(socket.id);
    if (!user) return;

    const cleanText = text.trim().slice(0, 500);
    if (!cleanText) return;

    const chatMsg = {
      id: `chat-${Date.now()}-${Math.random()}`,
      type: 'user',
      userId: socket.id,
      username: user.username,
      avatar: user.avatar,
      text: cleanText,
      timestamp: Date.now()
    };

    room.chatHistory.push(chatMsg);
    if (room.chatHistory.length > 100) room.chatHistory.shift();

    io.to(currentRoomId).emit('chat_message', chatMsg);
  });

  // User typing status
  socket.on('user_typing', ({ isTyping }) => {
    if (!currentRoomId || !rooms.has(currentRoomId)) return;
    const room = rooms.get(currentRoomId);
    const user = room.users.get(socket.id);
    if (!user) return;
    socket.to(currentRoomId).emit('user_typing', {
      userId: socket.id,
      username: user.username,
      isTyping: !!isTyping
    });
  });

  // Live Floating Reaction
  socket.on('send_reaction', ({ emoji }) => {
    if (!currentRoomId || !rooms.has(currentRoomId) || !emoji) return;
    const room = rooms.get(currentRoomId);
    const user = room.users.get(socket.id);
    if (!user) return;

    io.to(currentRoomId).emit('room_reaction', {
      emoji,
      userId: socket.id,
      username: user.username,
      avatar: user.avatar,
      id: `rx-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`
    });
  });

  // Playlist management
  socket.on('add_to_playlist', ({ url, videoType, title }) => {
    if (!currentRoomId || !rooms.has(currentRoomId) || !url) return;
    const room = rooms.get(currentRoomId);
    const item = {
      id: `pl-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      url,
      videoType: videoType || 'html5',
      title: title || 'Queued Stream'
    };
    room.playlist.push(item);
    io.to(currentRoomId).emit('playlist_updated', room.playlist);
  });

  socket.on('remove_from_playlist', ({ itemId }) => {
    if (!currentRoomId || !rooms.has(currentRoomId)) return;
    const room = rooms.get(currentRoomId);
    room.playlist = room.playlist.filter(i => i.id !== itemId);
    io.to(currentRoomId).emit('playlist_updated', room.playlist);
  });

  // Host lock controls toggle
  socket.on('toggle_controls_lock', () => {
    if (!currentRoomId || !rooms.has(currentRoomId)) return;
    const room = rooms.get(currentRoomId);
    if (room.hostId !== socket.id) return;

    room.controlsLocked = !room.controlsLocked;
    io.to(currentRoomId).emit('controls_lock_changed', {
      controlsLocked: room.controlsLocked,
      hostName: room.users.get(socket.id)?.username || 'Host'
    });
  });

  // Leave room event
  socket.on('leave_room', () => {
    leaveCurrentRoom();
  });

  // Disconnect & cleanup
  socket.on('disconnect', () => {
    leaveCurrentRoom();
    broadcastGlobalLiveStats();
  });

  function leaveCurrentRoom() {
    if (!currentRoomId || !rooms.has(currentRoomId)) return;
    const room = rooms.get(currentRoomId);
    const user = room.users.get(socket.id);

    room.users.delete(socket.id);
    socket.leave(currentRoomId);

    // If host left, elect new host if users remain
    if (room.hostId === socket.id) {
      const remainingUserIds = Array.from(room.users.keys());
      if (remainingUserIds.length > 0) {
        room.hostId = remainingUserIds[0];
        const newHost = room.users.get(room.hostId);
        io.to(currentRoomId).emit('host_changed', {
          newHostId: room.hostId,
          newHostName: newHost.username
        });
      } else {
        room.hostId = null;
      }
    }

    // Clean up empty rooms after 15 minutes of inactivity
    if (room.users.size === 0) {
      setTimeout(() => {
        if (rooms.has(currentRoomId) && rooms.get(currentRoomId).users.size === 0) {
          rooms.delete(currentRoomId);
        }
      }, 15 * 60 * 1000);
    } else {
      const userList = Array.from(room.users.values()).map(u => ({
        id: u.id,
        username: u.username,
        avatar: u.avatar,
        deviceType: u.deviceType,
        ping: u.ping || 0,
        isHost: u.id === room.hostId,
        joinedAt: u.joinedAt
      }));

      io.to(currentRoomId).emit('room_users_updated', {
        connectedDevicesCount: room.users.size,
        users: userList,
        hostId: room.hostId
      });
    }

    currentRoomId = null;
    broadcastGlobalLiveStats();
  }
});

function formatTime(seconds) {
  if (isNaN(seconds) || seconds < 0) return '00:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const hrs = Math.floor(mins / 60);
  if (hrs > 0) {
    const remMins = mins % 60;
    return `${hrs}:${remMins < 10 ? '0' : ''}${remMins}:${secs < 10 ? '0' : ''}${secs}`;
  }
  return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

server.listen(PORT, '0.0.0.0', () => {
  const os = require('os');
  const interfaces = os.networkInterfaces();
  let localIp = 'localhost';
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        localIp = iface.address;
        break;
      }
    }
  }
  console.log(`🎬 SyncCinema Server is running!`);
  console.log(`💻 Local PC Web:   http://localhost:${PORT}`);
  console.log(`📱 Mobile / LAN:   http://${localIp}:${PORT}`);
});
