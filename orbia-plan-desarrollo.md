# Orbia — Plan de Desarrollo por Fases
> Juego móvil de física con esferas numéricas | Stack: Phaser 3 + Matter.js + Capacitor

---

## Contexto del juego

**Concepto:** La pantalla está llena de esferas de colores con números que rebotan libremente. El jugador toca la pantalla para crear un punto de desvío temporal que redirige las trayectorias. El objetivo es hacer colisionar esferas del mismo número (puntos base) o del mismo número Y color (puntos dobles + efecto especial). Cada nivel tiene un objetivo de puntos fijo para avanzar.

**Stack técnico:**
- Phaser 3 con motor de física Matter.js
- Capacitor para empaquetar como APK (Android) / IPA (iOS)
- Sin assets externos — todo generado en canvas con código

---

## Checklist de validación (usar antes de pasar a la siguiente fase)

Al final de cada fase hay una sección `✅ CRITERIOS DE VALIDACIÓN`. **No pasar a la siguiente fase hasta que todos los criterios estén cumplidos.** Si alguno falla, corregir dentro de la misma fase.

---

## FASE 1 — Estructura base del proyecto

**Objetivo:** Tener el proyecto corriendo localmente en el navegador con una escena vacía de Phaser 3.

**Prompt para Claude Code:**

```
Crea un proyecto de juego móvil con Phaser 3 y Matter.js desde cero.

Requisitos:
- Inicializa un proyecto Node.js con package.json
- Instala phaser@3 como dependencia
- Crea un archivo index.html en la raíz que cargue el juego
- Crea src/main.js como punto de entrada de Phaser
- Configura Phaser con:
  - Motor de física: Matter.js
  - Tamaño: 390 x 844 px (proporción iPhone/Android estándar)
  - backgroundColor: #1a1a2e
  - Escena inicial: src/scenes/GameScene.js (vacía por ahora, solo muestra el texto "Orbia" centrado en pantalla)
- Crea un script npm start que levante un servidor local (usar http-server o vite)
- Estructura de carpetas:
  src/
    scenes/
      GameScene.js
      MenuScene.js (vacía por ahora)
    main.js
  index.html
  package.json
```

### ✅ Criterios de validación — Fase 1

- [ ] `npm install` corre sin errores
- [ ] `npm start` levanta servidor local
- [ ] El navegador muestra fondo oscuro con el texto "Orbia" centrado
- [ ] No hay errores en la consola del navegador
- [ ] La estructura de carpetas coincide con lo solicitado

---

## FASE 2 — Esferas con física real

**Objetivo:** Pantalla llena de esferas que rebotan con física Matter.js, con número y color visibles.

**Prompt para Claude Code:**

```
En src/scenes/GameScene.js implementa lo siguiente:

1. ESFERAS:
   - Crear 12 esferas al iniciar la escena
   - Cada esfera: radio 35px, física Matter.js habilitada (círculo)
   - Propiedades físicas: restitution: 0.9, friction: 0, frictionAir: 0.005
   - Las esferas deben rebotar en todos los bordes de la pantalla (crear paredes invisibles con Matter.js: arriba, abajo, izquierda, derecha)
   - Velocidad inicial aleatoria para cada esfera al crearse

2. APARIENCIA (todo generado en canvas, sin imágenes externas):
   - 6 colores posibles: #e74c3c, #3498db, #2ecc71, #f39c12, #9b59b6, #1abc9c
   - 6 números posibles: 1, 2, 3, 4, 5, 6
   - Distribuir las esferas en pares: siempre debe haber exactamente 2 esferas de cada número (12 esferas = 6 pares)
   - Los colores se asignan aleatoriamente (no necesariamente en pares)
   - Dibujar cada esfera como: círculo relleno del color asignado + borde blanco de 3px + número centrado en blanco, bold, 22px

3. RENDERIZADO:
   - Usar Graphics de Phaser para dibujar las esferas (no sprites)
   - Actualizar la posición del gráfico en el método update() sincronizando con el cuerpo de Matter.js
```

### ✅ Criterios de validación — Fase 2

- [ ] 12 esferas aparecen en pantalla al cargar
- [ ] Todas rebotan en los 4 bordes sin escapar de la pantalla
- [ ] Cada esfera muestra su número claramente visible
- [ ] Se distinguen los colores correctamente
- [ ] El rebote se ve natural (no demasiado rígido ni demasiado lento)
- [ ] No hay esferas que se superpongan de forma permanente al inicio
- [ ] No hay errores en consola

---

## FASE 3 — Mecánica de desvío (interacción del jugador)

**Objetivo:** El jugador toca la pantalla y aparece un punto de desvío que redirige las esferas que lo tocan.

**Prompt para Claude Code:**

```
En GameScene.js agrega la mecánica de interacción del jugador:

1. PUNTO DE DESVÍO:
   - Al hacer click/tap en la pantalla, crear un punto de desvío en esa posición
   - El punto de desvío dura exactamente 1.5 segundos y luego desaparece
   - Solo puede existir 1 punto de desvío a la vez (el nuevo reemplaza al anterior)
   - Visualización del punto: círculo blanco semitransparente de radio 20px con un anillo exterior pulsante
   - Animación de desaparición: el punto hace fade out en los últimos 0.3 segundos

2. FÍSICA DEL DESVÍO:
   - El punto de desvío es un cuerpo circular estático en Matter.js (isStatic: true, restitution: 1.2)
   - Las esferas que colisionen con él rebotan con un poco más de fuerza que un rebote normal
   - Al desaparecer el punto, eliminar el cuerpo físico de Matter.js también

3. FEEDBACK VISUAL:
   - Al crear el punto mostrar una pequeña animación de "ondas" expandiéndose
   - El punto debe ser claramente visible sobre las esferas

4. MOBILE READY:
   - Manejar tanto input.on('pointerdown') para touch como para click de mouse
```

### ✅ Criterios de validación — Fase 3

- [ ] Al hacer click/tap aparece el punto de desvío en la posición correcta
- [ ] Las esferas rebotan al tocar el punto
- [ ] El punto desaparece después de 1.5 segundos
- [ ] Solo existe un punto a la vez
- [ ] El fade out es visible y suave
- [ ] La mecánica se siente responsiva (sin delay perceptible)
- [ ] Funciona con click de mouse en el navegador

---

## FASE 4 — Sistema de colisiones y puntuación

**Objetivo:** Detectar colisiones entre esferas del mismo número, sumar puntos y mostrar el score.

**Prompt para Claude Code:**

```
En GameScene.js implementa el sistema de puntuación:

1. DETECCIÓN DE COLISIONES ENTRE ESFERAS:
   - Usar el evento 'collisionstart' de Matter.js para detectar cuando dos esferas chocan entre sí
   - Evaluar cada colisión:
     a) Mismo número + mismo color → MATCH PERFECTO: +250 puntos
     b) Mismo número + distinto color → MATCH SIMPLE: +100 puntos
     c) Números distintos → sin puntos, las esferas siguen rebotando normalmente

2. EFECTO VISUAL AL HACER MATCH:
   - MATCH SIMPLE: las dos esferas hacen flash blanco por 0.2 segundos y desaparecen con scale down
   - MATCH PERFECTO: explosión de partículas del color de las esferas (al menos 12 partículas que salen en todas direcciones y hacen fade), las esferas desaparecen
   - En ambos casos: mostrar el texto del puntaje (+100 o +250) flotando hacia arriba y desvaneciéndose en 1 segundo, en la posición de la colisión

3. REPOSICIÓN DE ESFERAS:
   - Cuando un par es eliminado, después de 2 segundos aparece un nuevo par de esferas de reemplazo (mismo número, colores aleatorios) en posición aleatoria en el borde de la pantalla
   - Siempre mantener entre 10 y 14 esferas en pantalla

4. UI DE PUNTUACIÓN:
   - Score actual: esquina superior derecha, texto blanco bold 28px
   - Formato: "Score: 1250"
   - El score actualiza inmediatamente al hacer match

5. SISTEMA DE PUNTAJE:
   - Crear una variable global `currentScore` inicializada en 0
   - Crear una variable `targetScore` para el objetivo del nivel (inicializar en 1000 para el nivel 1)
```

### ✅ Criterios de validación — Fase 4

- [ ] Las colisiones de mismo número se detectan correctamente
- [ ] Match simple suma 100 puntos al score visible
- [ ] Match perfecto suma 250 puntos al score visible
- [ ] Las esferas emparejadas desaparecen con animación
- [ ] Las partículas se ven bien en el match perfecto
- [ ] El texto flotante de puntos aparece y desaparece correctamente
- [ ] Nuevas esferas aparecen para reemplazar las eliminadas
- [ ] El conteo de esferas se mantiene entre 10 y 14
- [ ] No hay errores de colisión en consola (colisiones con paredes no deben generar puntos)

---

## FASE 5 — Sistema de niveles y condición de victoria

**Objetivo:** Implementar niveles con objetivo de puntos, pantalla de victoria y progresión de dificultad.

**Prompt para Claude Code:**

```
En GameScene.js y crear src/scenes/VictoryScene.js:

1. BARRA DE PROGRESO DEL NIVEL:
   - Mostrar una barra de progreso horizontal en la parte superior de la pantalla (debajo del score)
   - La barra va de 0% a 100% representando currentScore / targetScore
   - Color de la barra: degradado de #3498db a #2ecc71
   - Al lado de la barra: texto "Nivel X" donde X es el nivel actual
   - Objetivo visible: "Meta: 1000 pts"

2. CONDICIÓN DE VICTORIA:
   - Cuando currentScore >= targetScore:
     a) Detener la física (pausar el mundo de Matter.js)
     b) Mostrar animación de celebración: lluvia de partículas de colores por 2 segundos
     c) Después de 2 segundos, transicionar a VictoryScene

3. VICTORIA SCENE (src/scenes/VictoryScene.js):
   - Fondo oscuro con efecto de estrellas o partículas sutiles
   - Texto grande "¡Nivel Completado!" centrado
   - Mostrar el score obtenido
   - Botón "Siguiente Nivel" que lleva al siguiente nivel
   - Botón "Menú" que lleva a MenuScene

4. PROGRESIÓN DE DIFICULTAD:
   - Nivel 1: targetScore = 1000, 12 esferas, velocidad base 3
   - Nivel 2: targetScore = 1500, 14 esferas, velocidad base 3.5
   - Nivel 3: targetScore = 2000, 16 esferas, velocidad base 4
   - Nivel 4+: targetScore += 500 por nivel, esferas += 2 (máx 20), velocidad += 0.3 (máx 6)
   - Pasar el número de nivel como dato a GameScene: this.scene.start('GameScene', { level: nextLevel })

5. PERSISTENCIA BÁSICA:
   - Guardar en localStorage: nivel máximo alcanzado y score más alto
```

### ✅ Criterios de validación — Fase 5

- [ ] La barra de progreso se llena a medida que sube el score
- [ ] Al llegar al objetivo se detiene el juego y aparece la celebración
- [ ] La transición a VictoryScene funciona
- [ ] Los botones de VictoryScene funcionan correctamente
- [ ] El nivel 2 tiene más esferas y son más rápidas que el nivel 1
- [ ] El nivel máximo y score máximo persisten al recargar la página (localStorage)
- [ ] No hay bugs al pasar del nivel 1 al 2 al 3

---

## FASE 6 — Menú principal y UI completa

**Objetivo:** Pantalla de inicio profesional, instrucciones y flujo completo del juego.

**Prompt para Claude Code:**

```
Implementar src/scenes/MenuScene.js completo y pulir la UI general:

1. MENU SCENE:
   - Logo/título "ORBIA" con efecto visual (texto grande con glow o sombra de color)
   - Subtítulo pequeño: "Conecta las esferas"
   - 3 esferas decorativas rebotando en el fondo (animación ambient, sin física real, solo tweens)
   - Botón "JUGAR" (comienza desde nivel 1 o desde el nivel máximo guardado)
   - Botón "CONTINUAR" (visible solo si hay progreso guardado, inicia en el nivel máximo)
   - Botón "CÓMO JUGAR" que muestra un overlay con instrucciones

2. OVERLAY DE INSTRUCCIONES:
   - Fondo semitransparente oscuro sobre el menú
   - Instrucciones en 3 pasos con íconos simples dibujados en canvas:
     1. "Las esferas rebotan solas"
     2. "Toca la pantalla para desviarlas"
     3. "Haz chocar las del mismo número"
   - Nota: "¡Mismo color = puntos dobles!"
   - Botón "Entendido" para cerrar el overlay

3. MEJORAS DE UI EN GAME SCENE:
   - Botón de pausa (ícono ⏸) esquina superior izquierda
   - Al pausar: overlay semitransparente con opciones "Continuar" y "Menú"
   - Contador del nivel visible en la UI durante el juego

4. TRANSICIONES:
   - Fade in/out de 300ms entre todas las escenas
   - Registrar todas las escenas en src/main.js: MenuScene, GameScene, VictoryScene
```

### ✅ Criterios de validación — Fase 6

- [ ] El menú principal se ve limpio y profesional
- [ ] Las esferas decorativas del menú se mueven suavemente
- [ ] El overlay de instrucciones abre y cierra correctamente
- [ ] El botón "Continuar" solo aparece cuando hay progreso guardado
- [ ] La pausa funciona y el juego se reanuda correctamente
- [ ] Las transiciones entre escenas tienen fade
- [ ] El flujo completo funciona: Menú → Juego → Victoria → Menú

---

## FASE 7 — Sonido y efectos de audio

**Objetivo:** Agregar efectos de sonido que refuercen el feedback del juego.

**Prompt para Claude Code:**

```
Agregar sonidos al juego usando la Web Audio API nativa (sin librerías externas):

1. Crear src/audio/SoundManager.js:
   - Usar AudioContext de la Web Audio API
   - Generar todos los sonidos proceduralmente (sin archivos de audio externos)
   - Sonidos a crear:
     a) rebote_pared: tono corto grave (80ms, frecuencia 120hz, forma de onda: sine)
     b) match_simple: tono ascendente de 2 notas (150ms, C4 → E4)
     c) match_perfecto: acorde brillante de 3 notas + decay (400ms, C5+E5+G5)
     d) nivel_completado: fanfarria corta de 5 notas ascendentes (800ms)
     e) aparicion_esfera: tono suave corto (100ms, frecuencia 440hz, forma: triangle)

2. Integrar SoundManager en GameScene:
   - Reproducir rebote_pared cuando una esfera choca con los bordes (limitar a 1 vez cada 100ms para no saturar)
   - Reproducir match_simple en match de número
   - Reproducir match_perfecto en match de número + color
   - Reproducir nivel_completado al completar el nivel
   - Reproducir aparicion_esfera al crear nueva esfera

3. Control de volumen:
   - Botón de mute/unmute en el menú principal (ícono de speaker)
   - Guardar preferencia de mute en localStorage
   - Si está muteado, no reproducir ningún sonido
```

### ✅ Criterios de validación — Fase 7

- [ ] Los 5 tipos de sonido suenan correctamente
- [ ] Los sonidos no se superponen de forma molesta (especialmente el rebote)
- [ ] El match perfecto suena claramente diferente al simple
- [ ] El botón mute/unmute funciona
- [ ] La preferencia de mute persiste al recargar
- [ ] No hay errores de AudioContext en consola

---

## FASE 8 — Empaquetado con Capacitor para Android

**Objetivo:** Generar un APK funcional instalable en Android.

**Prompt para Claude Code:**

```
Configurar Capacitor para exportar el juego como app Android:

1. INSTALACIÓN:
   - npm install @capacitor/core @capacitor/cli @capacitor/android
   - npx cap init "Orbia" "com.orbia.game" --web-dir dist
   - Crear script npm build en package.json que compile el juego a la carpeta dist/ (usar vite build o copiar archivos)

2. CONFIGURACIÓN (capacitor.config.ts o .json):
   - appId: "com.orbia.game"
   - appName: "Orbia"
   - webDir: "dist"
   - android.allowMixedContent: true

3. CONFIGURACIÓN ANDROID:
   - npx cap add android
   - Configurar android/app/src/main/res/ con íconos básicos (generar placeholder 512x512 con canvas y convertir)
   - En android/app/src/main/AndroidManifest.xml: orientación portrait forzada

4. INSTRUCCIONES DE BUILD:
   - Documentar en README.md los pasos exactos:
     1. npm run build
     2. npx cap sync
     3. npx cap open android (requiere Android Studio)
     4. En Android Studio: Build → Generate Signed Bundle/APK

5. AJUSTES MOBILE:
   - En index.html: agregar meta viewport correcto para mobile
   - Deshabilitar zoom con pinch en el juego
   - Agregar meta theme-color para la barra de estado de Android
```

### ✅ Criterios de validación — Fase 8

- [ ] `npm run build` genera la carpeta dist/ sin errores
- [ ] `npx cap sync` corre sin errores
- [ ] La carpeta android/ fue creada correctamente
- [ ] El proyecto abre en Android Studio sin errores de configuración
- [ ] El APK de debug se puede instalar en un dispositivo Android
- [ ] El juego se ve correctamente en pantalla de celular (sin elementos cortados)
- [ ] La orientación se mantiene en portrait
- [ ] El touch funciona correctamente en el dispositivo físico

---

## FASE 9 — Pulido final y preparación para publicación

**Objetivo:** Detalles finales de calidad antes de subir a Google Play.

**Prompt para Claude Code:**

```
Pulido final del juego para publicación:

1. PERFORMANCE:
   - Revisar que el juego corre a 60fps estables en dispositivos mid-range
   - Limitar la cantidad de partículas activas simultáneas a máximo 50
   - Destruir objetos Phaser correctamente cuando se eliminan esferas (evitar memory leaks)
   - Agregar en GameScene: this.events.on('shutdown', () => { limpiar listeners y cuerpos físicos })

2. GAME FEEL:
   - Agregar vibración corta al hacer match: navigator.vibrate(50) para match simple, navigator.vibrate([50,30,100]) para match perfecto
   - Screen shake suave (5px, 200ms) al hacer match perfecto
   - Las esferas nuevas aparecen con scale from 0 to 1 en 300ms (tween de entrada)

3. INFORMACIÓN DE VERSIÓN:
   - Agregar versión "v1.0.0" en el menú principal en letra pequeña esquina inferior
   - Crear archivo VERSION en la raíz con el número de versión

4. PANTALLA DE GAME OVER (si se quiere agregar):
   - Agregar un timer de 90 segundos al nivel (opcional, solo si la partida puede quedar estancada)
   - Si el tiempo se acaba antes de llegar al objetivo: mostrar pantalla de "Tiempo agotado" con opción de reintentar

5. CHECKLIST DE PUBLICACIÓN (documentar en README.md):
   - Cambiar versionCode y versionName en android/app/build.gradle
   - Generar keystore para firma: keytool -genkey -v -keystore orbia.keystore ...
   - Build release en Android Studio
   - Assets requeridos para Google Play: ícono 512x512, screenshots, descripción
```

### ✅ Criterios de validación — Fase 9

- [ ] El juego corre fluido en un dispositivo real (sin drops de frames notorios)
- [ ] La vibración funciona en Android
- [ ] El screen shake del match perfecto se siente satisfactorio
- [ ] Las esferas nuevas aparecen con animación de entrada
- [ ] No hay memory leaks al jugar varios niveles seguidos (monitorear con DevTools)
- [ ] El README tiene los pasos de publicación documentados
- [ ] El APK release (no debug) se genera y instala correctamente

---

## Resumen de fases

| Fase | Descripción | Resultado esperado |
|------|-------------|-------------------|
| 1 | Estructura base | Proyecto corriendo en navegador |
| 2 | Esferas con física | 12 esferas rebotando en pantalla |
| 3 | Mecánica de desvío | El jugador puede interactuar |
| 4 | Colisiones y puntuación | El juego tiene objetivo y puntaje |
| 5 | Sistema de niveles | Progresión funcional completa |
| 6 | Menú y UI completa | Flujo de juego end-to-end |
| 7 | Sonido | Feedback auditivo del juego |
| 8 | Empaquetado Android | APK instalable en celular |
| 9 | Pulido y publicación | Listo para Google Play |

---

## Notas importantes para Claude Code

- Usar siempre **Phaser 3** (no Phaser 2 ni Phaser CE)
- La física es **Matter.js** (viene incluida en Phaser 3, no instalar aparte)
- **Nunca usar assets externos** — todo se dibuja con Graphics de Phaser o canvas nativo
- Cada fase debe ser **autosuficiente**: el código de la fase anterior no se reescribe, solo se extiende
- Si algo de una fase anterior falla, **corregirlo antes de continuar**
- Mantener los archivos organizados en la estructura de carpetas definida en Fase 1
