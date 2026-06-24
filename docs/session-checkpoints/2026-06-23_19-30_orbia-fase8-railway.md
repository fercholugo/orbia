# Checkpoint de Sesion: Orbia — Fase 8 + Deploy Railway

**Fecha**: 2026-06-23 19:30
**Estado general**: EN PROGRESO
**Nivel de contexto**: ROJO

---

## Objetivo Original

Continuar el desarrollo de Orbia siguiendo el plan de 9 fases. Esta sesión cubrió:
1. Corrección del modo Evita (demasiado rápido el game over)
2. Rediseño completo del tercer modo → ahora se llama CAOS
3. Fase 8: empaquetado Capacitor + deploy en Railway

## Contexto del Proyecto

- Juego móvil Phaser 3 + Matter.js (390×844px, fondo #0f0c22)
- 3 modos: Clásico, Secuencia, CAOS (antes "Evita")
- Repositorio GitHub: https://github.com/fercholugo/orbia.git
- Railway: proyecto "orbia" ya desplegado y Online en cuenta ferchogoku@gmail.com
- Servidor local: `npm start` → localhost:5173

## Progreso

### Completado
- [x] Fases 1-7 — completas desde sesión anterior
- [x] Modo CAOS implementado — tap directo para unir pares, swaps aleatorios cada 7s, nuevas esferas cada 10s, combo x1-x5, timer 90s
- [x] Regla de checkpoint en CLAUDE.md — Claude debe leer checkpoint al inicio de cada sesión
- [x] Fase 8 parcial — Capacitor instalado, `npx cap init`, `npx cap add android`, AndroidManifest con portrait forzado, `npx cap sync` OK
- [x] Git inicializado — commit inicial, remote conectado a fercholugo/orbia
- [x] Deploy Railway — proyecto "orbia" Online en Railway (cuenta ferchogoku@gmail.com)

### En Progreso
- [ ] Obtener URL pública de Railway — el servicio está Online pero falta copiar/generar el dominio público

### Pendiente
- [ ] Fase 8 completa — probar APK en dispositivo real (requiere Android Studio)
- [ ] Fase 9 — pulido final: vibración, screen shake, 60fps, memory leaks, README publicación

## Archivos Modificados

| Archivo | Cambio | Estado |
|---------|--------|--------|
| `src/scenes/GameScene.js` | Modo CAOS completo: tap-to-match, chaosTick, sphereSpawn, selectionGfx, comboSystem | Guardado + commiteado |
| `src/scenes/MenuScene.js` | Botón "EVITA" → "CAOS" | Guardado + commiteado |
| `capacitor.config.json` | appId, appName, webDir, android.allowMixedContent, backgroundColor | Guardado + commiteado |
| `android/app/src/main/AndroidManifest.xml` | screenOrientation="portrait" agregado | Guardado + commiteado |
| `package.json` | Capacitor deps + serve dep + script "serve" | Guardado + commiteado |
| `railway.json` | Config deploy: nixpacks builder, startCommand serve dist | Guardado + commiteado |
| `.gitignore` | node_modules, dist, android, ios excluidos | Guardado + commiteado |
| `CLAUDE.md` | Regla obligatoria: leer checkpoint al inicio de sesión | Guardado + commiteado |

## Archivos Relevantes (solo lectura)

- `orbia-plan-desarrollo.md` — Plan completo 9 fases, fuente de verdad
- `docs/session-checkpoints/2026-06-23_17-30_orbia-fases-4-7-modos.md` — Checkpoint anterior

## Decisiones Tomadas

1. **Modo CAOS reemplaza Evita**: el modo "Evita" (esferas que no deben chocar) fue frustrante. Se reemplazó por CAOS: tap directo sobre esferas para unir pares, números intercambian aleatoriamente cada 7s, sin game over, puro score en 90s.
2. **Tap directo en CAOS (no deflector)**: en modo CAOS el input no crea deflector — primer tap selecciona esfera (anillo pulsante), segundo tap en mismo número = match. Deflector solo activo en modos Clásico y Secuencia.
3. **Deploy Railway antes de Android Studio**: usuario no tiene Android Studio instalado, se priorizó Railway para pruebas en móvil via URL pública.
4. **GitHub en fercholugo/orbia**: cuenta personal ferchogoku@gmail.com, repo https://github.com/fercholugo/orbia.git
5. **android/ excluido de git**: carpeta android no commiteada (muy pesada), se regenera con `npx cap add android` + `npx cap sync` localmente.

## Problemas / Bloqueos

- Railway está Online pero falta obtener/generar la URL pública del servicio → pendiente (el usuario está en la pantalla de Railway, necesita hacer click en la tarjeta "orbia" y luego en Settings → Domains para generar la URL).

## Para Reanudar

### Reanudacion:

> Al iniciar la proxima sesion, Claude debe leer este checkpoint antes de
> responder cualquier mensaje. Esto esta definido como regla en CLAUDE.md.

### Siguiente paso exacto:

1. **Verificar URL de Railway**: en Railway, click en tarjeta "orbia" → pestaña "Settings" → sección "Domains" → "Generate Domain" si no hay URL. Compartir URL al usuario para probar en móvil.

2. **Fase 9 — Pulido final**:
   - `navigator.vibrate(50)` en match simple, `navigator.vibrate([50,30,100])` en match perfecto
   - Screen shake (5px, 200ms) en match perfecto — usar `this.cameras.main.shake(200, 0.005)`
   - Revisar 60fps en DevTools
   - Agregar `this.events.on('shutdown', ...)` para limpiar listeners en GameScene
   - Probar APK cuando Android Studio esté instalado

3. **Para subir cambios futuros a Railway**:
   ```bash
   git add .
   git commit -m "descripcion"
   git push origin master
   ```
   Railway auto-deploya al detectar push en master.
