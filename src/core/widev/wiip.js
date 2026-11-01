// src/lib/widev/wiip.js
// wiIp v10.2: Consulta de IP y geolocalización cliente vía ipinfo.io con telemetría de dispositivo y navegador

export const wiIp = (geo) => {
  if (typeof window === 'undefined') return Promise.resolve(null);

  const token = import.meta.env.VITE_WIIP || '';
  const url = token ? `https://ipinfo.io/json?token=${token}` : 'https://ipinfo.io/json';

  return fetch(url)
    .then(r => {
      if (!r.ok) throw new Error('Network error');
      return r.json();
    })
    .then(data => {
      const ua = navigator.userAgent;
      const [lat, lng] = (data.loc || '0,0').split(',').map(Number);
      
      const ipData = {
        ip: data.ip || '127.0.0.1',
        city: data.city || 'Desconocido',
        region: data.region || 'Desconocido',
        country: data.country || 'PE',
        postal: data.postal || '',
        lat,
        lng,
        browser: /Edg/i.test(ua) ? 'Edge' : /Chrome/i.test(ua) ? 'Chrome' : /Firefox/i.test(ua) ? 'Firefox' : /Safari/i.test(ua) && !/Chrome/i.test(ua) ? 'Safari' : 'Otro',
        os: /Windows/i.test(ua) ? 'Windows' : /Android/i.test(ua) ? 'Android' : /iPhone|iPad/i.test(ua) ? 'iOS' : /Mac/i.test(ua) ? 'macOS' : 'Linux',
        device: /Mobile|Android|iPhone|iPad/i.test(ua) ? 'Móvil' : /Tablet|iPad/i.test(ua) ? 'Tablet' : 'Escritorio',
        screen: typeof screen !== 'undefined' ? `${screen.width}×${screen.height}` : '0×0',
        language: navigator.language || 'es',
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
        utcOffset: new Date().getTimezoneOffset() / -60,
        online: navigator.onLine
      };

      if (typeof geo === 'function') return geo(ipData);
      if (geo === 'ciudad') return `${ipData.city}, ${ipData.country}`;
      return geo ? ipData[geo] : ipData;
    })
    .catch((err) => {
      console.error('wiIp error:', err);
      return null;
    });
};