# Orbia — Contexto del Proyecto

## Descripción
Juego móvil de física con esferas numéricas. Stack: **Phaser 3 + Matter.js + Capacitor**. Todo generado en canvas, sin assets externos.

**Mecánica core:** esferas con números rebotan en pantalla → el jugador toca para crear un punto de desvío temporal → hacer colisionar esferas del mismo número suma puntos.

## Plan de desarrollo
Ver `orbia-plan-desarrollo.md` — 9 fases con criterios de validación. Es la fuente de verdad del proyecto.

## REGLA OBLIGATORIA AL INICIAR SESIÓN

**Lo primero que Claude debe hacer al comenzar cualquier conversación en este proyecto — sin excepción, sin importar lo que pregunte el usuario — es:**
1. Listar los archivos en `docs/session-checkpoints/` con Glob
2. Leer el checkpoint más reciente
3. Solo entonces responder al usuario

Sin este paso, las respuestas pueden estar desfasadas con el estado real del proyecto.

## Stack
- `phaser@3` — motor de juego
- Matter.js — física (incluido en Phaser 3, no instalar aparte)
- `vite` — servidor de desarrollo (`npm start` → localhost:5173)
- Capacitor — empaquetado Android/iOS (Fase 8)

## Estructura
```
src/
  main.js           — config Phaser: 390x844px, fondo #1a1a2e, Matter.js gravity y:0
  scenes/
    GameScene.js    — escena principal (toda la lógica del juego)
    MenuScene.js    — menú principal (stub hasta Fase 6)
index.html          — viewport mobile, div#game centrado
```

## Reglas de código
- Nunca usar assets externos — todo con `this.add.graphics()` o canvas nativo
- Cada fase extiende la anterior, no reescribe
- Física: `frictionAir: 0`, `restitution: 1.0` en esferas; velocidad mínima garantizada en `update()`
- Las esferas siempre llevan `label: 'sphere'` en Matter.js para detectar colisiones

## Comandos
```bash
npm start       # Vite dev server en localhost:5173
npm run build   # Build para Capacitor (dist/)
```
