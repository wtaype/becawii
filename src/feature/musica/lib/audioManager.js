// src/feature/musica/lib/audioManager.js
// 🎵 Gestor de Audio Global Persistente para Clayda (BecaWii 2026)
// Cero Dependencias · Offline First · Compatible con Astro ClientRouter e Inmune a Intercambios de DOM
// Soporte Completo para MediaSession API (Notificaciones de Celular/Windows con Prev, Next, Play/Pause)
// Integración con widev.js: savels/getls (duración infinita), Mensaje (toasts feedback)

import playlistData from '../../../semillas/playlist.json' with { type: 'json' };
import { app } from '../../../wii.js';
import { savels, getls } from '../../../core/widev/storage.js';
import { Mensaje } from '../../../core/widev/mensajes.js';

class AudioManager {
  constructor() {
    this.playlist = playlistData || [];
    this.currentIndex = 0;
    this.isPlaying = false;
    this.isShuffle = false;
    this.repeatMode = 'all'; // 'off' | 'all' | 'one'
    this.volume = 0.85;
    this.favorites = new Set();
    this.bgAudioEnabled = true;
    this.sleepTimerTimeout = null;
    this.listeners = new Set();
    this.isInitialized = false;

    // Recuperar preferencias persistentes usando savels / getls con duración infinita (null)
    if (typeof localStorage !== 'undefined') {
      try {
        const savedLikes = getls('musicaLikes');
        if (Array.isArray(savedLikes)) {
          this.favorites = new Set(savedLikes);
        }

        const savedIndex = getls('becawii_last_track_idx');
        if (savedIndex !== null && !isNaN(savedIndex) && Number(savedIndex) >= 0 && Number(savedIndex) < this.playlist.length) {
          this.currentIndex = Number(savedIndex);
        }

        const savedRepeat = getls('becawii_repeat_mode');
        if (savedRepeat === 'off' || savedRepeat === 'all' || savedRepeat === 'one') {
          this.repeatMode = savedRepeat;
        }

        const savedVol = getls('becawii_audio_volume');
        if (savedVol !== null && !isNaN(savedVol)) {
          this.volume = Math.max(0, Math.min(1, Number(savedVol)));
        }

        const savedSync = getls('becawii_bg_audio');
        if (savedSync !== null) {
          this.bgAudioEnabled = Boolean(savedSync);
        }
      } catch (e) {
        console.warn('AudioManager: aviso leyendo storage inicial', e);
      }
    }

    // Instancia persistente en memoria global del navegador (nunca se destruye al navegar)
    if (typeof window !== 'undefined') {
      if (!window.__becawiiNativeAudio) {
        window.__becawiiNativeAudio = new Audio();
        window.__becawiiNativeAudio.preload = 'metadata';
      }
      this.audio = window.__becawiiNativeAudio;
      this.audio.volume = this.volume;
      this._inicializarEventosAudio();
    } else {
      this.audio = null;
    }
  }

  _inicializarEventosAudio() {
    if (!this.audio || this.isInitialized) return;
    this.isInitialized = true;

    // Escuchadores de eventos nativos
    this.audio.addEventListener('play', () => {
      this.isPlaying = true;
      this.actualizarMediaSession();
      this.notificar('playState', { isPlaying: true });
    });

    this.audio.addEventListener('pause', () => {
      this.isPlaying = false;
      this.actualizarMediaSession();
      this.notificar('playState', { isPlaying: false });
    });

    this.audio.addEventListener('timeupdate', () => {
      if (!this.audio || !this.audio.duration) return;
      this.notificar('timeUpdate', {
        currentTime: this.audio.currentTime,
        duration: this.audio.duration,
        progressPct: (this.audio.currentTime / this.audio.duration) * 100
      });
    });

    this.audio.addEventListener('ended', () => {
      if (this.repeatMode === 'one') {
        this.audio.currentTime = 0;
        this.reproducir();
      } else {
        const isLast = this.currentIndex === this.playlist.length - 1;
        if (isLast && this.repeatMode === 'off' && !this.isShuffle) {
          this.pausar();
          this.audio.currentTime = 0;
        } else {
          this.siguiente();
        }
      }
    });

    this.audio.addEventListener('error', (e) => {
      console.warn('Error en reproducción de audio:', e);
    });

    // Configurar pista inicial sin disparar autoplay forzado
    if (!this.audio.src && this.playlist[this.currentIndex]) {
      this.audio.src = this.playlist[this.currentIndex].audioUrl;
      this.audio.load();
    }

    this.actualizarMediaSession();
  }

  /**
   * Conecta o verifica el audio global (Mantiene compatibilidad con Principal.astro)
   */
  conectarElementoAudio(audioEl) {
    if (!this.isInitialized && typeof window !== 'undefined') {
      if (!window.__becawiiNativeAudio) {
        window.__becawiiNativeAudio = audioEl || new Audio();
      }
      this.audio = window.__becawiiNativeAudio;
      this.audio.volume = this.volume;
      this._inicializarEventosAudio();
    }
  }

  getPistaActual() {
    return this.playlist[this.currentIndex] || null;
  }

  /**
   * Sincroniza la barra de notificación del sistema (Android / Windows SMTC / iOS)
   * con título, artista, app Becawii y arte oficial de diosesamor.png
   */
  actualizarMediaSession() {
    if (typeof navigator === 'undefined' || !('mediaSession' in navigator)) return;
    const pista = this.getPistaActual();
    if (!pista) return;

    try {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: pista.titulo,
        artist: pista.artista,
        album: `${app} 2026 • Música de Paz`,
        artwork: [
          { src: '/diosesamor.png', sizes: '512x512', type: 'image/png' },
          { src: '/smile.avif', sizes: '256x256', type: 'image/avif' }
        ]
      });

      navigator.mediaSession.playbackState = this.isPlaying ? 'playing' : 'paused';

      // Acciones nativas en notificación móvil, teclado y lockscreen
      navigator.mediaSession.setActionHandler('play', () => {
        this.reproducir();
      });
      navigator.mediaSession.setActionHandler('pause', () => {
        this.pausar();
      });
      navigator.mediaSession.setActionHandler('previoustrack', () => {
        this.anterior();
      });
      navigator.mediaSession.setActionHandler('nexttrack', () => {
        this.siguiente();
      });
      navigator.mediaSession.setActionHandler('seekto', (details) => {
        if (details.seekTime !== null && details.seekTime !== undefined) {
          this.seek(details.seekTime);
        }
      });
      navigator.mediaSession.setActionHandler('seekbackward', (details) => {
        const skip = details.seekOffset || 10;
        this.seek(Math.max((this.audio?.currentTime || 0) - skip, 0));
      });
      navigator.mediaSession.setActionHandler('seekforward', (details) => {
        const skip = details.seekOffset || 10;
        this.seek(Math.min((this.audio?.currentTime || 0) + skip, this.audio?.duration || 0));
      });
    } catch (e) {
      console.warn('MediaSession aviso:', e);
    }
  }

  /**
   * Suscribe un componente a cambios en el reproductor
   */
  suscribir(callback) {
    if (typeof callback === 'function') {
      this.listeners.add(callback);
      try {
        callback('init', this.getEstado());
      } catch (e) {
        console.error('Error en callback de audio:', e);
      }
    }
    return () => this.listeners.delete(callback);
  }

  notificar(evento, datos) {
    const estado = this.getEstado();
    this.listeners.forEach((cb) => {
      try {
        cb(evento, datos, estado);
      } catch (e) {
        console.error('Error notificando a listener de audio:', e);
      }
    });
  }

  getEstado() {
    const pistaActual = this.getPistaActual();
    return {
      pista: pistaActual,
      indice: this.currentIndex,
      isPlaying: this.isPlaying,
      isShuffle: this.isShuffle,
      repeatMode: this.repeatMode,
      isRepeat: this.repeatMode !== 'off',
      volume: this.volume,
      favorites: Array.from(this.favorites),
      totalFavorites: this.favorites.size,
      isCurrentFavorite: pistaActual ? this.esFavorito(pistaActual.id) : false,
      bgAudioEnabled: this.bgAudioEnabled,
      currentTime: this.audio ? this.audio.currentTime : 0,
      duration: this.audio && !isNaN(this.audio.duration) ? this.audio.duration : 0
    };
  }

  cargarPista(index, autoPlay = false) {
    if (index < 0 || index >= this.playlist.length) return;
    this.currentIndex = index;
    const pista = this.playlist[index];

    // Persistir índice con savels (horas = null -> infinito)
    savels('becawii_last_track_idx', index, null);

    if (this.audio) {
      this.audio.src = pista.audioUrl;
      this.audio.load();
      if (autoPlay) {
        this.reproducir();
      }
    }

    this.actualizarMediaSession();
    this.notificar('trackChange', { pista, indice: index });
  }

  reproducir() {
    if (!this.audio) return Promise.resolve();
    if (!this.audio.src && this.playlist[this.currentIndex]) {
      this.audio.src = this.playlist[this.currentIndex].audioUrl;
    }

    return this.audio.play().then(() => {
      this.isPlaying = true;
      this.actualizarMediaSession();
      this.notificar('playState', { isPlaying: true });
    }).catch((err) => {
      console.warn('Reproducción de audio bloqueada o pospuesta:', err);
      this.isPlaying = false;
      this.actualizarMediaSession();
      this.notificar('playState', { isPlaying: false });
    });
  }

  pausar() {
    if (!this.audio) return;
    this.audio.pause();
    this.isPlaying = false;
    this.actualizarMediaSession();
    this.notificar('playState', { isPlaying: false });
  }

  togglePlay() {
    if (this.isPlaying) {
      this.pausar();
    } else {
      this.reproducir();
    }
  }

  siguiente() {
    let sig = this.currentIndex + 1;
    if (this.isShuffle) {
      sig = Math.floor(Math.random() * this.playlist.length);
    } else if (sig >= this.playlist.length) {
      sig = 0;
    }
    this.cargarPista(sig, true);
  }

  anterior() {
    let prev = this.currentIndex - 1;
    if (prev < 0) prev = this.playlist.length - 1;
    this.cargarPista(prev, true);
  }

  toggleShuffle() {
    this.isShuffle = !this.isShuffle;
    Mensaje(this.isShuffle ? 'Modo aleatorio activado 🔀' : 'Modo secuencial activado ➡', 'info');
    this.notificar('shuffleChange', { isShuffle: this.isShuffle });
    return this.isShuffle;
  }

  /**
   * Cicla entre 3 modos de repetición: 'off' -> 'all' -> 'one'
   */
  cycleRepeatMode() {
    if (this.repeatMode === 'off') {
      this.repeatMode = 'all';
      Mensaje('Repetir lista completa 🔁', 'info');
    } else if (this.repeatMode === 'all') {
      this.repeatMode = 'one';
      Mensaje('Repitiendo esta canción 🔂', 'info');
    } else {
      this.repeatMode = 'off';
      Mensaje('Repetición desactivada ➡', 'info');
    }
    savels('becawii_repeat_mode', this.repeatMode, null);
    this.notificar('repeatChange', { repeatMode: this.repeatMode });
    return this.repeatMode;
  }

  setVolume(vol) {
    this.volume = Math.max(0, Math.min(1, Number(vol)));
    if (this.audio) {
      this.audio.volume = this.volume;
    }
    savels('becawii_audio_volume', this.volume, null);
    this.notificar('volumeChange', { volume: this.volume });
    return this.volume;
  }

  getFavoritos() {
    return Array.from(this.favorites);
  }

  esFavorito(trackId) {
    if (!trackId) return false;
    return this.favorites.has(String(trackId));
  }

  toggleFavorito(trackId = null) {
    const id = trackId ? String(trackId) : this.getPistaActual()?.id;
    if (!id) return false;

    let isFav = false;
    if (this.favorites.has(id)) {
      this.favorites.delete(id);
      isFav = false;
      Mensaje('Eliminada de tus favoritas', 'info');
    } else {
      this.favorites.add(id);
      isFav = true;
      Mensaje('¡Agregada a tus favoritas! ❤️', 'success');
    }

    // Persistencia infinita (horas = null) con savels
    savels('musicaLikes', Array.from(this.favorites), null);

    this.notificar('favoriteChange', {
      trackId: id,
      isFavorite: isFav,
      totalFavorites: this.favorites.size
    });

    return isFav;
  }

  toggleBgSync() {
    this.bgAudioEnabled = !this.bgAudioEnabled;
    savels('becawii_bg_audio', this.bgAudioEnabled, null);
    Mensaje(this.bgAudioEnabled ? 'Música en simulador activada 🎧' : 'Música en simulador pausada', 'info');
    this.notificar('syncChange', { bgAudioEnabled: this.bgAudioEnabled });
    return this.bgAudioEnabled;
  }

  seek(segundos) {
    if (this.audio && !isNaN(this.audio.duration)) {
      this.audio.currentTime = Math.max(0, Math.min(this.audio.duration, segundos));
    }
  }

  setSleepTimer(minutos, onComplete) {
    if (this.sleepTimerTimeout) {
      clearTimeout(this.sleepTimerTimeout);
      this.sleepTimerTimeout = null;
    }
    if (minutos <= 0) return;

    this.sleepTimerTimeout = setTimeout(() => {
      this.pausar();
      if (typeof onComplete === 'function') onComplete();
    }, minutos * 60 * 1000);
  }
}

// Instancia única (Singleton) compartida a nivel de aplicación
export const audioManager = (function() {
  if (typeof window !== 'undefined') {
    if (!window.__becawiiAudioManager) {
      window.__becawiiAudioManager = new AudioManager();
    }
    return window.__becawiiAudioManager;
  }
  return new AudioManager();
})();
