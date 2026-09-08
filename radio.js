/* =========================================================
   ROXTHAL RADIO — MÓDULO DINÁMICO
   Directorio: Radio Browser
   ========================================================= */

(function () {
  'use strict';

  const GENRES = [
    { name: 'Rock', icon: '🎸', tag: 'rock' },
    { name: 'Metal', icon: '🤘', tag: 'metal' },
    { name: 'Pop', icon: '🎤', tag: 'pop' },
    { name: 'Jazz', icon: '🎷', tag: 'jazz' },
    { name: 'Blues', icon: '🎺', tag: 'blues' },
    { name: 'Electrónica', icon: '🎛️', tag: 'electronic' },
    { name: 'Ambient / Lo-Fi', icon: '🌙', tag: 'ambient' },
    { name: 'Funk / Soul', icon: '🕺', tag: 'funk' },
    { name: 'Rock Nacional', icon: '🇦🇷', tag: 'argentina' },
    { name: 'Latino', icon: '🌎', tag: 'latin' },
    { name: '8-bit / Chiptune', icon: '🎮', tag: 'chiptune' },
    { name: 'Clásica', icon: '🎻', tag: 'classical' },
    { name: 'Reggae', icon: '🌴', tag: 'reggae' },
    { name: 'Punk', icon: '🔥', tag: 'punk' },
    { name: 'Indie / Alternativo', icon: '🎧', tag: 'indie' }
  ];

  const API_HOSTS = [
    'https://de1.api.radio-browser.info',
    'https://nl1.api.radio-browser.info',
    'https://at1.api.radio-browser.info'
  ];

  let stations = [];
  let selectedGenre = null;
  let currentStation = null;
  let currentIndex = -1;

  const audio = () => document.getElementById('roxRadioAudio');
  const genresBox = () => document.getElementById('roxRadioGenres');
  const stationsBox = () => document.getElementById('roxRadioStations');
  const statusBox = () => document.getElementById('roxRadioStatus');
  const searchBox = () => document.getElementById('roxRadioSearch');

  function escapeHTML(value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function countryFlag(country) {
    const flags = {
      Argentina: '🇦🇷',
      'United States': '🇺🇸',
      USA: '🇺🇸',
      Canada: '🇨🇦',
      Mexico: '🇲🇽',
      Brazil: '🇧🇷',
      Spain: '🇪🇸',
      France: '🇫🇷',
      Germany: '🇩🇪',
      Italy: '🇮🇹',
      Japan: '🇯🇵',
      Australia: '🇦🇺',
      'United Kingdom': '🇬🇧'
    };

    return flags[country] || '🌎';
  }

  function setStatus(text, type) {
    const box = statusBox();
    if (!box) return;

    box.textContent = text;
    box.className = 'rox-radio-status' + (type ? ' ' + type : '');
  }

  function renderGenres() {
    const box = genresBox();
    if (!box) return;

    box.innerHTML = GENRES.map((genre, index) => `
      <button
        type="button"
        class="rox-radio-genre ${index === 0 ? 'active' : ''}"
        data-radio-genre="${escapeHTML(genre.tag)}"
      >
        <span>${genre.icon}</span>
        <strong>${escapeHTML(genre.name)}</strong>
      </button>
    `).join('');

    box.querySelectorAll('[data-radio-genre]').forEach(button => {
      button.addEventListener('click', () => {
        box.querySelectorAll('.rox-radio-genre')
          .forEach(item => item.classList.remove('active'));

        button.classList.add('active');

        selectedGenre = GENRES.find(
          genre => genre.tag === button.dataset.radioGenre
        );

        loadStations(selectedGenre);
      });
    });
  }

  async function fetchFromRadioBrowser(tag) {
    let lastError = null;

    for (const host of API_HOSTS) {
      try {
        const url =
          host +
          '/json/stations/search?' +
          new URLSearchParams({
            tag: tag,
            hidebroken: 'true',
            is_https: 'true',
            limit: '40',
            order: 'votes',
            reverse: 'true'
          });

        const response = await fetch(url, {
          method: 'GET',
          headers: {
            Accept: 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error('HTTP ' + response.status);
        }

        const data = await response.json();

        if (Array.isArray(data)) {
          return data;
        }

      } catch (error) {
        lastError = error;
      }
    }

    throw lastError || new Error('No se pudo conectar con Radio Browser');
  }

  function cleanStations(data) {
    const seen = new Set();

    return (data || [])
      .filter(station => {
        const url = station.url_resolved || station.url;

        if (!url) return false;

        const key =
          String(station.stationuuid || '') +
          '|' +
          String(url);

        if (seen.has(key)) return false;

        seen.add(key);
        return true;
      })
      .map(station => ({
        id: station.stationuuid,
        name: station.name || 'Emisora sin nombre',
        country: station.country || '',
        language: station.language || '',
        tags: station.tags || '',
        stream: station.url_resolved || station.url,
        homepage: station.homepage || '',
        favicon: station.favicon || '',
        votes: Number(station.votes || 0)
      }))
      .filter(station => station.stream);
  }

  function renderStations(list) {
    const box = stationsBox();
    if (!box) return;

    if (!list.length) {
      box.innerHTML = `
        <div class="rox-radio-empty">
          <div>📻</div>
          <strong>No encontramos emisoras para este estilo.</strong>
          <span>Prueba otro género.</span>
        </div>
      `;
      return;
    }

    box.innerHTML = list.map((station, index) => `
      <article class="rox-radio-station">
        <div class="rox-radio-station-logo">
          ${
            station.favicon
              ? `<img src="${escapeHTML(station.favicon)}"
                     alt=""
                     loading="lazy"
                     onerror="this.style.display='none'">`
              : '📻'
          }
        </div>

        <div class="rox-radio-station-info">
          <strong>${escapeHTML(station.name)}</strong>

          <span>
            ${countryFlag(station.country)}
            ${escapeHTML(station.country || 'Internacional')}
          </span>

          <small>
            ${escapeHTML(
              station.tags
                ? station.tags.split(',').slice(0, 3).join(' · ')
                : 'Radio'
            )}
          </small>
        </div>

        <button
          type="button"
          class="rox-radio-play"
          data-radio-play="${index}"
          aria-label="Reproducir ${escapeHTML(station.name)}"
        >
          ▶
        </button>
      </article>
    `).join('');

    box.querySelectorAll('[data-radio-play]').forEach(button => {
      button.addEventListener('click', () => {
        const index = Number(button.dataset.radioPlay);
        playStation(list[index]);
      });
    });
  }

  async function loadStations(genre) {
    if (!genre) return;

    const title = document.getElementById('roxRadioStationsTitle');

    if (title) {
      title.textContent = 'Emisoras · ' + genre.name;
    }

    setStatus('🔎 Buscando emisoras disponibles...', 'loading');

    if (stationsBox()) {
      stationsBox().innerHTML = '';
    }

    try {
      const data = await fetchFromRadioBrowser(genre.tag);

      stations = cleanStations(data);

      setStatus(
        stations.length
          ? '📻 ' + stations.length + ' emisoras encontradas'
          : 'No encontramos emisoras activas para este estilo.',
        stations.length ? 'ok' : 'warning'
      );

      renderStations(stations);

    } catch (error) {
      console.error('RoXThal Radio:', error);

      setStatus(
        '⚠️ No se pudo conectar con el directorio de emisoras. Puedes volver a intentarlo.',
        'error'
      );

      stationsBox().innerHTML = `
        <div class="rox-radio-empty">
          <div>📡</div>
          <strong>Directorio temporalmente no disponible</strong>
          <span>Comprueba tu conexión y vuelve a elegir el estilo.</span>
        </div>
      `;
    }
  }

  function playStation(station) {
    if (!station || !station.stream) return;

    const player = audio();
    if (!player) return;

    currentStation = station;

    player.pause();
    player.src = station.stream;
    player.load();

    player.play()
      .then(() => {
        updatePlayer();
      })
      .catch(error => {
        console.error('Error reproduciendo emisora:', error);

        setStatus(
          '⚠️ Esta emisora no pudo iniciar la reproducción. Prueba otra.',
          'error'
        );
      });

    updatePlayer();
  }

  function updatePlayer() {
    const name = document.getElementById('roxRadioNowPlaying');
    const genre = document.getElementById('roxRadioNowGenre');

    if (name) {
      name.textContent =
        currentStation?.name || 'Ninguna emisora seleccionada';
    }

    if (genre) {
      genre.textContent =
        currentStation
          ? (
              currentStation.country
                ? countryFlag(currentStation.country) + ' ' + currentStation.country
                : 'Radio internacional'
            )
          : 'Selecciona una emisora';
    }

    const playButton =
      document.getElementById('roxRadioPlayPause');

    const player = audio();

    if (playButton && player) {
      playButton.textContent =
        player.paused ? '▶' : '❚❚';
    }
  }

  function installPlayerEvents() {
    const player = audio();
    const playButton =
      document.getElementById('roxRadioPlayPause');

    const stopButton =
      document.getElementById('roxRadioStop');

    if (!player) return;

    player.addEventListener('play', updatePlayer);
    player.addEventListener('pause', updatePlayer);
    player.addEventListener('error', () => {
      setStatus(
        '⚠️ Error de reproducción. Prueba otra emisora.',
        'error'
      );
      updatePlayer();
    });

    if (playButton) {
      playButton.addEventListener('click', () => {
        if (!currentStation) {
          setStatus(
            'Selecciona primero una emisora.',
            'warning'
          );
          return;
        }

        if (player.paused) {
          player.play().catch(() => {});
        } else {
          player.pause();
        }
      });
    }

    if (stopButton) {
      stopButton.addEventListener('click', () => {
        player.pause();
        player.removeAttribute('src');
        player.load();

        currentStation = null;
        updatePlayer();
      });
    }
  }

  function installSearch() {
    const input = searchBox();
    if (!input) return;

    input.addEventListener('input', () => {
      const term = input.value.trim().toLowerCase();

      if (!term) {
        renderStations(stations);
        return;
      }

      const filtered = stations.filter(station =>
        (
          station.name +
          ' ' +
          station.country +
          ' ' +
          station.tags +
          ' ' +
          station.language
        ).toLowerCase().includes(term)
      );

      renderStations(filtered);
    });
  }

  function injectStyles() {
    if (document.getElementById('roxthal-radio-styles')) return;

    const style = document.createElement('style');
    style.id = 'roxthal-radio-styles';

    style.textContent = `
      #roxRadioApp{
        display:grid;
        gap:18px;
      }

      .rox-radio-hero{
        display:flex;
        align-items:center;
        justify-content:space-between;
        gap:20px;
        padding:24px;
        border:1px solid var(--border);
        border-radius:20px;
        background:
          radial-gradient(circle at 90% 20%,rgba(242,196,0,.18),transparent 35%),
          linear-gradient(145deg,#181818,#0d0d0d);
      }

      .rox-radio-kicker{
        color:var(--yellow);
        font-size:10px;
        font-weight:900;
        letter-spacing:3px;
      }

      .rox-radio-hero h3{
        font-size:clamp(27px,5vw,42px);
        margin:7px 0;
      }

      .rox-radio-hero p{
        color:var(--muted);
        font-size:14px;
      }

      .rox-radio-wave{
        color:var(--yellow);
        font-size:30px;
        letter-spacing:8px;
        white-space:nowrap;
        animation:roxRadioPulse 1.8s ease-in-out infinite;
      }

      @keyframes roxRadioPulse{
        0%,100%{opacity:.55;transform:scale(.96)}
        50%{opacity:1;transform:scale(1.04)}
      }

      .rox-radio-search input{
        width:100%;
        min-height:48px;
        padding:0 16px;
        border-radius:12px;
        border:1px solid var(--border);
        background:#0b0b0b;
        color:var(--text);
        outline:none;
      }

      .rox-radio-search input:focus{
        border-color:var(--yellow);
      }

      .rox-radio-section-title{
        display:flex;
        align-items:center;
        gap:10px;
        margin-top:5px;
      }

      .rox-radio-section-title span{
        font-size:21px;
      }

      .rox-radio-section-title h3{
        font-size:20px;
      }

      .rox-radio-genres{
        display:grid;
        grid-template-columns:repeat(5,1fr);
        gap:10px;
      }

      .rox-radio-genre{
        min-height:82px;
        padding:10px;
        border:1px solid var(--border);
        border-radius:15px;
        background:var(--surface);
        color:var(--text);
        display:flex;
        flex-direction:column;
        justify-content:center;
        align-items:center;
        gap:6px;
        transition:.2s ease;
      }

      .rox-radio-genre span{
        font-size:25px;
      }

      .rox-radio-genre strong{
        font-size:11px;
        text-align:center;
      }

      .rox-radio-genre:hover{
        transform:translateY(-2px);
        border-color:var(--yellow);
      }

      .rox-radio-genre.active{
        background:var(--yellow);
        color:#080808;
        border-color:var(--yellow);
      }

      .rox-radio-status{
        padding:13px 15px;
        border:1px solid var(--border);
        border-radius:12px;
        background:var(--surface);
        color:var(--muted);
        font-size:13px;
      }

      .rox-radio-status.ok{
        border-color:#215f3c;
        color:#8de2ae;
      }

      .rox-radio-status.warning{
        border-color:#6b5a16;
        color:#f2d66b;
      }

      .rox-radio-status.error{
        border-color:#6d1b1f;
        color:#ff8b8f;
      }

      .rox-radio-stations{
        display:grid;
        grid-template-columns:repeat(2,1fr);
        gap:12px;
      }

      .rox-radio-station{
        display:grid;
        grid-template-columns:58px 1fr 45px;
        align-items:center;
        gap:12px;
        padding:13px;
        border:1px solid var(--border);
        border-radius:15px;
        background:linear-gradient(145deg,var(--surface2),var(--surface));
        transition:.2s ease;
      }

      .rox-radio-station:hover{
        border-color:#555;
        transform:translateY(-1px);
      }

      .rox-radio-station-logo{
        width:58px;
        height:58px;
        display:flex;
        align-items:center;
        justify-content:center;
        overflow:hidden;
        border-radius:12px;
        background:#080808;
        font-size:25px;
      }

      .rox-radio-station-logo img{
        width:100%;
        height:100%;
        object-fit:cover;
      }

      .rox-radio-station-info{
        min-width:0;
        display:grid;
        gap:3px;
      }

      .rox-radio-station-info strong{
        font-size:14px;
        white-space:nowrap;
        overflow:hidden;
        text-overflow:ellipsis;
      }

      .rox-radio-station-info span{
        font-size:11px;
        color:var(--muted);
      }

      .rox-radio-station-info small{
        color:#777;
        font-size:10px;
        white-space:nowrap;
        overflow:hidden;
        text-overflow:ellipsis;
      }

      .rox-radio-play{
        width:45px;
        height:45px;
        border-radius:50%;
        border:1px solid var(--yellow);
        background:var(--yellow);
        color:#080808;
        font-weight:900;
      }

      .rox-radio-play:hover{
        transform:scale(1.05);
      }

      .rox-radio-empty{
        grid-column:1/-1;
        padding:42px 20px;
        border:1px dashed var(--border);
        border-radius:16px;
        text-align:center;
        display:grid;
        gap:7px;
        color:var(--muted);
      }

      .rox-radio-empty div{
        font-size:32px;
      }

      .rox-radio-empty strong{
        color:var(--text);
      }

      .rox-radio-player{
        position:sticky;
        bottom:10px;
        z-index:50;
        display:flex;
        align-items:center;
        justify-content:space-between;
        gap:15px;
        padding:15px;
        border:1px solid #3b3b3b;
        border-radius:17px;
        background:rgba(12,12,12,.96);
        backdrop-filter:blur(15px);
        box-shadow:0 15px 40px rgba(0,0,0,.45);
      }

      .rox-radio-player-info{
        min-width:0;
        display:grid;
        gap:3px;
      }

      .rox-radio-playing{
        color:var(--yellow);
        font-size:9px;
        font-weight:900;
        letter-spacing:1.5px;
      }

      #roxRadioNowPlaying{
        font-size:15px;
        white-space:nowrap;
        overflow:hidden;
        text-overflow:ellipsis;
      }

      #roxRadioNowGenre{
        color:var(--muted);
        font-size:11px;
      }

      .rox-radio-controls{
        display:flex;
        gap:8px;
        flex-shrink:0;
      }

      .rox-radio-control{
        width:43px;
        height:43px;
        border:1px solid var(--border);
        border-radius:50%;
        background:var(--surface);
        color:var(--text);
        font-weight:900;
      }

      .rox-radio-control:first-child{
        background:var(--yellow);
        color:#080808;
        border-color:var(--yellow);
      }

      @media(max-width:900px){
        .rox-radio-genres{
          grid-template-columns:repeat(3,1fr);
        }

        .rox-radio-stations{
          grid-template-columns:1fr;
        }
      }

      @media(max-width:600px){
        .rox-radio-hero{
          padding:20px;
        }

        .rox-radio-wave{
          display:none;
        }

        .rox-radio-genres{
          grid-template-columns:repeat(2,1fr);
        }

        .rox-radio-station{
          grid-template-columns:50px 1fr 42px;
        }

        .rox-radio-station-logo{
          width:50px;
          height:50px;
        }

        .rox-radio-play{
          width:42px;
          height:42px;
        }
      }
    `;

    document.head.appendChild(style);
  }

  function initRadio() {
    if (!document.getElementById('radio')) return;

    injectStyles();
    renderGenres();
    installPlayerEvents();
    installSearch();

    selectedGenre = GENRES[0];

    const firstGenre = genresBox()?.querySelector('[data-radio-genre]');
    if (firstGenre) {
      firstGenre.click();
    }
  }

  /*
    Sobrescribimos loadRadio para que el sistema existente
    de RoXThal siga funcionando sin modificar la navegación.
  */
  window.loadRadio = function () {
    initRadio();
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initRadio);
  } else {
    initRadio();
  }

})();
