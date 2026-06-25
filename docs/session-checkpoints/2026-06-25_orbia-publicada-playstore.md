# Checkpoint de Sesion: Orbia publicada en Google Play Store

**Fecha**: 2026-06-25 15:55
**Estado general**: CASI COMPLETO
**Nivel de contexto**: ROJO

---

## Objetivo Original

Publicar Orbia en Google Play Store: generar AAB firmado, completar ficha de Play Store, pasar revisión de Google.

## Contexto del Proyecto

- Juego móvil Phaser 3 + Matter.js (390×844px), 3 modos: Clásico, Secuencia, MATCH
- Repositorio: https://github.com/fercholugo/orbia.git
- Package name final: `io.orbia.game` (cambiado de `com.orbia.game` durante esta sesión)
- Keystore: `orbia-release.jks`, password `orbia2024`, alias `orbia`
- **Orbia YA ESTÁ publicada** en Google Play canal de prueba cerrada (Alpha)
- Email confirmación recibido de Google Play Console a las 15:55

## Progreso

### Completado
- [x] AAB release firmado generado (versionCode 2, io.orbia.game)
- [x] Privacy Policy en español — https://fercholugo.github.io/orbia/public/privacy-policy.html
- [x] GitHub Pages activado en repo fercholugo/orbia
- [x] Feature graphic 1024x500px generado con código
- [x] Ícono 512x512px (hecho en Canva por el usuario)
- [x] Screenshots capturados del emulador
- [x] Ficha de Play Store completa (descripción, categoría, clasificación IARC)
- [x] Clasificación de contenido: PEGI 3 / Everyone (todo No)
- [x] Seguridad de datos: No recopila datos
- [x] 177 países/territorios seleccionados
- [x] Tester configurado: ferchogoku@gmail.com + fernando.lugo@datawifi.co (lista TEST ORBIA)
- [x] Enviado a revisión → **APROBADO Y PUBLICADO** en canal Alpha

### Pendiente
- [ ] Commit de todos los cambios pendientes (ver Archivos Modificados)
- [ ] Solicitar acceso a Producción (requiere prueba cerrada con testers reales)
- [ ] Google Sign-in — feature para próxima actualización
- [ ] Scores online compartibles — feature para próxima actualización
- [ ] Fase 9 (vibración, performance, memory leaks) — pospuesta

## Archivos Modificados

| Archivo | Cambio | Estado |
|---------|--------|--------|
| `capacitor.config.json` | appId cambiado de com.orbia.game a io.orbia.game | Sin commitear |
| `android/app/build.gradle` | applicationId + namespace → io.orbia.game, versionCode 2, signingConfig release | Sin commitear |
| `android/app/src/main/java/io/orbia/game/MainActivity.java` | Nueva carpeta con package io.orbia.game | Sin commitear |
| `public/privacy-policy.html` | Privacy policy en español | Commiteado |
| `public/feature-graphic.html` | Generador del banner 1024x500px | Sin commitear |
| `index.html` | viewport-fit=cover, CSS safe-area padding (sesión anterior) | Sin commitear |
| `src/main.js` | Scale FIT, antialias, zoom DPR (sesión anterior) | Sin commitear |
| `src/scenes/GameScene.js` | Múltiples fixes UI (sesión anterior) | Sin commitear |

## Archivos Relevantes (solo lectura)

- `android/app/build.gradle` — configuración de firma y package name
- `capacitor.config.json` — appId del proyecto

## Decisiones Tomadas

1. **Package name io.orbia.game**: el usuario registró io.orbia.game en Play Console, se cambió el código para coincidir
2. **Canal Alpha (prueba cerrada)**: paso obligatorio antes de producción en Play Store
3. **Google Sign-in y scores online**: pospuestos para próxima actualización
4. **Privacy Policy en GitHub Pages**: gratuito, sin depender de Railway
5. **versionCode 2**: el código 1 fue consumido por un upload fallido con package incorrecto

## Problemas / Bloqueos

- Para llegar a Producción (app pública para todos) se requiere completar prueba cerrada con al menos 12 testers durante 14 días — esto es un requisito de Google para nuevos desarrolladores

## Para Reanudar

### Reanudacion:

> Al iniciar la proxima sesion, Claude debe leer este checkpoint antes de
> responder cualquier mensaje. Esto esta definido como regla en CLAUDE.md.

### Siguiente paso exacto:

**1. Commitear todos los cambios pendientes:**
```
git add capacitor.config.json android/app/build.gradle public/feature-graphic.html
git add android/app/src/main/java/io/orbia/game/MainActivity.java
git add index.html src/main.js src/scenes/GameScene.js
git commit -m "Publicación Play Store: package io.orbia.game, privacy policy, feature graphic"
git push origin master
```

**2. Para pasar a Producción:**
- Necesita 12 testers reales que descarguen y usen la app durante 14 días
- Ir a Play Console → Prueba cerrada → Testers → agregar emails
- Compartir el link de opt-in con los testers

**3. Próximas features (siguiente sesión de desarrollo):**
- Google Sign-in con Firebase Auth
- Leaderboard online con scores
- Fase 9: vibración háptica, optimización de performance
