
'use strict';

// Versión de caché
const CACHE_NAME = 'rune-lady-v1';

// Archivos necesarios para funcionar sin conexión
const APP_FILES = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './rune.png',

  // Las 24 cartas rúnicas
  './01_Fehu.png',
  './02_Uruz.png',
  './03_Thurisaz.png',
  './04_Ansuz.png',
  './05_Raidho.png',
  './06_Kenaz.png',
  './07_Gebo.png',
  './08_Wunjo.png',
  './09_Hagalaz.png',
  './10_Nauthiz.png',
  './11_Isa.png',
  './12_Jera.png',
  './13_Eihwaz.png',
  './14_Perthro.png',
  './15_Algiz.png',
  './16_Sowilo.png',
  './17_Tiwaz.png',
  './18_Berkano.png',
  './19_Ehwaz.png',
  './20_Mannaz.png',
  './21_Laguz.png',
  './22_Ingwaz.png',
  './23_Dagaz.png',
  './24_Othala.png'
];

// Instalación
self.addEventListener('install', event => {

  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(APP_FILES))
      .then(() => self.skipWaiting())
  );

});

// Activación y eliminación de cachés antiguas
self.addEventListener('activate', event => {

  event.waitUntil(
    caches.keys().then(keys => {

      return Promise.all(
        keys
          .filter(key =>
            key.startsWith('rune-lady-') &&
            key !== CACHE_NAME
          )
          .map(key => caches.delete(key))
      );

    }).then(() => self.clients.claim())
  );

});

// Gestionar las solicitudes
self.addEventListener('fetch', event => {

  if (event.request.method !== 'GET') {
    return;
  }

  const url = new URL(event.request.url);

  // Solo gestionar archivos del mismo origen
  // y dentro del directorio de esta PWA.
  const scopeURL = new URL(self.registration.scope);

  if (
    url.origin !== scopeURL.origin ||
    !url.pathname.startsWith(scopeURL.pathname)
  ) {
    return;
  }

  // Primero intentar obtener la versión actualizada
  // de las páginas HTML.
  if (event.request.mode === 'navigate') {

    event.respondWith(
      fetch(event.request)
        .then(response => {

          if (response.ok) {
            const copy = response.clone();

            event.waitUntil(
              caches.open(CACHE_NAME)
                .then(cache =>
                  cache.put(event.request, copy)
                )
            );
          }

          return response;
        })
        .catch(async () => {

          return (
            await caches.match(event.request)
          ) || (
            await caches.match('./index.html')
          );

        })
    );

    return;
  }

  // Para imágenes y otros recursos:
  // usar caché primero y red como alternativa.
  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {

        if (cachedResponse) {
          return cachedResponse;
        }

        return fetch(event.request)
          .then(response => {

            if (response.ok) {
              const copy = response.clone();

              event.waitUntil(
                caches.open(CACHE_NAME)
                  .then(cache =>
                    cache.put(event.request, copy)
                  )
              );
            }

            return response;
          });

      })
  );

});
