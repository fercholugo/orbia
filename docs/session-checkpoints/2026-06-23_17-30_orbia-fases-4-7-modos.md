# Checkpoint de Sesion: Orbia — Fases 4-7 completas + 3 modos de juego

**Fecha**: 2026-06-23 17:30
**Estado general**: EN PROGRESO
**Nivel de contexto**: ROJO

---

## Objetivo Original

Construir el juego móvil Orbia desde cero siguiendo el plan de 9 fases en `orbia-plan-desarrollo.md`. Stack: Phaser 3 + Matter.js + Capacitor. Esta sesión completó Fases 4-7, mejoras visuales, y dos modos de juego adicionales.

## Contexto del Proyecto

- Juego de física: esferas numéricas rebotan en pantalla (390×844px, fondo #0f0c22)
- El jugador toca la pantalla para crear un punto de desvío que dirige esferas hacia su par
- Match válido SOLO si: ventana de 1.5s desde el click AND al menos una esfera tocó el deflector
- Servidor corriendo en `http://localhost:5173` con Vite
- 3 modos: Clásico, Secuencia, Evita

## Progreso

### Completado
- [x] Fase 1 — Estructura base: Vite + Phaser 3 + carpetas
- [x] Fase 2 — Esferas con física Matter.js: 12 esferas, colores, números en pares, rebote
- [x] Fase 3 — Mecánica de desvío: punto estático, ondas, anillo pulsante, fade 1.5s
- [x] Fase 4 — Colisiones y puntuación: match simple (100pts) y perfecto (250pts), texto flotante, reposición
- [x] Fase 5 — Niveles y victoria: barra de progreso, VictoryScene, localStorage, progresión dificultad
- [x] Fase 6 — Menú y UI: MenuScene completo, pausa, overlay instrucciones, fade entre escenas
- [x] Fase 7 — Sonido Web Audio API: SoundManager.js con 5 sonidos procedurales, botón mute
- [x] Mejoras visuales: esferas 3D (glow, sombra, especular), fondo morado #0f0c22, partículas flotantes, panel UI superior, confeti mejorado
- [x] Modo Secuencia: orden aleatorio al inicio, panel inferior con indicadores, solo cuenta el número en turno
- [x] Modo Evita: 3 vidas, timer 90s, countdown 3-2-1 de gracia, game over overlay

### En Progreso
- [ ] Ajustes finos de los modos (usuario probando, puede haber bugs menores)

### Pendiente
- [ ] Fase 8 — Empaquetado Capacitor para Android (APK)
- [ ] Fase 9 — Pulido final: 60fps, vibración, screen shake, versión, game over timer

## Archivos Modificados

| Archivo | Cambio | Estado |
|---------|--------|--------|
| `src/scenes/GameScene.js` | Reescritura completa: Fases 4-7, 3 modos, efectos visuales 3D | Guardado |
| `src/scenes/MenuScene.js` | 3 botones de modo (Clásico/Secuencia/Evita), partículas, mute | Guardado |
| `src/scenes/VictoryScene.js` | Recibe `mode` en data, confeti mejorado con formas mixtas | Guardado |
| `src/audio/SoundManager.js` | Nuevo archivo: 5 sonidos procedurales Web Audio API | Guardado |
| `src/main.js` | Registra VictoryScene, escena inicial = MenuScene, fondo #0f0c22 | Guardado |
| `index.html` | theme-color y body bg actualizados a #0f0c22 | Guardado |

## Archivos Relevantes (solo lectura)

- `orbia-plan-desarrollo.md` — Plan completo de 9 fases. Fuente de verdad del proyecto.
- `docs/session-checkpoints/2026-06-23_16-00_orbia-fases-1-2-3.md` — Checkpoint anterior

## Decisiones Tomadas

1. **Match window de 1.5s por click**: el match solo es válido los 1.5s tras el click del jugador, no por esfera individual durante 3s. Más control para el jugador.
2. **Fondo #0f0c22**: morado oscuro en lugar de azul oscuro #1a1a2e — más elegante.
3. **Esferas 3D**: outer glow + drop shadow + sombra perimetral con stroke grueso + zona difusa amplia + un solo punto especular nítido (sin capas múltiples).
4. **Modo Evita con countdown 3-2-1**: gracia de ~3.6s al inicio para que las esferas se separen antes de activar penalizaciones.
5. **Modo Evita scoring**: +10pts por deflexión activa + 5pts/segundo sobrevivido. Pierde vida solo cuando esferas del mismo número se tocan (no cancelable con deflector).
6. **Modo Secuencia**: 200pts por match en orden. Completar los 6 pares en secuencia = nivel completado (no depende de targetScore).
7. **Continuar guarda nivel+1**: al completar nivel N, localStorage guarda N+1 para que Continuar arranque en el siguiente nivel.
8. **SoundManager con throttle 100ms en rebote pared**: evita saturación de audio.

## Problemas / Bloqueos

- El modo Evita arrancaba sin gracia y el jugador perdía vidas antes de poder jugar → **Resuelto**: countdown 3-2-1.
- El botón Continuar mostraba el nivel completado en lugar del siguiente → **Resuelto**: guarda `level + 1`.

## Para Reanudar

### Reanudacion automatica:

> El hook SessionStart cargará este checkpoint automáticamente al iniciar
> la próxima sesión de Claude Code en este proyecto. No se necesita ninguna
> instrucción manual.

### Siguiente paso exacto:

Continuar con **Fase 8 — Empaquetado Capacitor para Android**:
1. `npm install @capacitor/core @capacitor/cli @capacitor/android`
2. `npx cap init "Orbia" "com.orbia.game" --web-dir dist`
3. Agregar script `"build": "vite build"` si no existe
4. `npx cap add android`
5. Configurar `capacitor.config.json`: appId, appName, webDir, android.allowMixedContent
6. En `index.html`: meta viewport ya está configurado
7. Documentar pasos en README.md
8. Luego Fase 9: vibración, screen shake, 60fps check, memory leaks
