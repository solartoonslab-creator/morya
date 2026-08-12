const PLAYLIST_ID = "PLe_rRZETnxv8";
let player = null;
let ready = false;
let timer = null;
let userStarted = false;

const $ = id => document.getElementById(id);

const fmt = s => {
  s = Math.max(0, Math.floor(s || 0));
  const m = Math.floor(s / 60);
  const sec = String(s % 60).padStart(2, "0");
  return `${m}:${sec}`;
};

function onYouTubeIframeAPIReady() {
  player = new YT.Player("youtube-player", {
    width: "200",
    height: "200",
    playerVars: {
      playsinline: 1,
      controls: 0,
      rel: 0,
      iv_load_policy: 3,
      enablejsapi: 1,
      origin: location.origin
    },
    events: {
      onReady: () => {
        ready = true;
        player.setVolume(75);
        player.unMute();

        // Load the complete playlist into the API player.
        player.cuePlaylist({
          listType: "playlist",
          list: PLAYLIST_ID,
          index: 0
        });

        startTimer();
        updateMeta();
      },

      onStateChange: onStateChange,

      onAutoplayBlocked: () => {
        $("trackTitle").textContent = "Tap Play to start";
        $("artist").textContent = "Ganpati Bappa playlist";
        $("play").textContent = "▶";
      },

      onError: () => {
        // Try the next item instead of stopping at a non-embeddable/unavailable video.
        $("artist").textContent = "Loading next song…";
        try { player.nextVideo(); } catch (_) {}
      }
    }
  });
}

function onStateChange(e) {
  const playing = e.data === YT.PlayerState.PLAYING;
  const ended = e.data === YT.PlayerState.ENDED;
  const cued = e.data === YT.PlayerState.CUED;

  $("play").textContent = playing ? "❚❚" : "▶";

  if (cued) updateMeta();

  if (ended && userStarted) {
    // Keep moving through the playlist.
    setTimeout(() => {
      try { player.nextVideo(); } catch (_) {}
    }, 150);
  }

  if (playing) updateMeta();
}

function updateMeta() {
  if (!player || !ready) return;

  const d = player.getVideoData ? player.getVideoData() : {};
  if (d && d.title) $("trackTitle").textContent = d.title;
  if (d && d.author) $("artist").textContent = d.author;

  const duration = player.getDuration ? player.getDuration() : 0;
  if (duration) $("duration").textContent = fmt(duration);
}

function startTimer() {
  clearInterval(timer);
  timer = setInterval(() => {
    if (!player || !ready) return;

    const cur = player.getCurrentTime ? player.getCurrentTime() : 0;
    const dur = player.getDuration ? player.getDuration() : 0;

    $("current").textContent = fmt(cur);
    $("duration").textContent = fmt(dur);

    if (dur > 0 && !$("progress").matches(":active")) {
      $("progress").value = (cur / dur) * 100;
    }

    updateMeta();
  }, 700);
}

$("play").onclick = () => {
  if (!player || !ready) return;

  userStarted = true;
  player.unMute();
  player.setVolume(Number($("volume").value));

  const state = player.getPlayerState();

  if (state === YT.PlayerState.PLAYING) {
    player.pauseVideo();
    return;
  }

  // If the playlist is only cued, explicitly start item 0.
  if (
    state === YT.PlayerState.CUED ||
    state === YT.PlayerState.UNSTARTED ||
    state === -1
  ) {
    player.playVideoAt(0);
  } else {
    player.playVideo();
  }
};

$("prev").onclick = () => {
  if (!player || !ready) return;
  userStarted = true;
  player.previousVideo();
};

$("next").onclick = () => {
  if (!player || !ready) return;
  userStarted = true;
  player.nextVideo();
};

$("mute").onclick = () => {
  if (!player || !ready) return;

  if (player.isMuted()) {
    player.unMute();
    $("mute").textContent = "🔊";
  } else {
    player.mute();
    $("mute").textContent = "🔇";
  }
};

$("volume").oninput = e => {
  if (!player || !ready) return;

  player.unMute();
  player.setVolume(Number(e.target.value));
  $("mute").textContent = Number(e.target.value) === 0 ? "🔇" : "🔊";
};

$("progress").oninput = e => {
  if (!player || !ready) return;

  const dur = player.getDuration();
  if (dur) {
    player.seekTo((Number(e.target.value) / 100) * dur, true);
  }
};

function updateClock() {
  const now = new Date();
  $("clock").textContent =
    now.toLocaleTimeString([], {hour: "numeric", minute: "2-digit"});
}

updateClock();
setInterval(updateClock, 1000);
