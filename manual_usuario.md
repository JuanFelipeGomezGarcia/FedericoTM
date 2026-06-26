# Manual de Usuario
## Sistema de Gestión de Torneos de Tenis de Mesa
### Fundación Federico

---

> **Cómo usar este manual:**
> A lo largo del documento encontrarás marcadores `[📸 PANTALLAZO: ...]` que te indican exactamente qué captura de pantalla colocar en ese punto.

---

## Tabla de Contenidos

1. [Acceso y Navegación General](#1-acceso-y-navegación-general)
2. [Página de Inicio (Home)](#2-página-de-inicio-home)
3. [Vista de un Torneo](#3-vista-de-un-torneo)
4. [Panel de Control de Mesas](#4-panel-de-control-de-mesas)
5. [Vista de Categoría – Secuencias (Round Robin)](#5-vista-de-categoría--secuencias-round-robin)
6. [Vista de Llaves (Eliminación Directa)](#6-vista-de-llaves-eliminación-directa)
7. [Panel de Administrador](#7-panel-de-administrador)
8. [Crear un Nuevo Torneo (Flujo Paso a Paso)](#8-crear-un-nuevo-torneo-flujo-paso-a-paso)
9. [Modo Día y Modo Noche](#9-modo-día-y-modo-noche)
10. [Tecnologías Utilizadas](#10-tecnologías-utilizadas)

---

## 1. Acceso y Navegación General

El sistema es una **aplicación web** accesible desde cualquier dispositivo con navegador (celular, tablet, computador). No requiere instalación.

### Roles de usuario

Existen **dos tipos de usuarios**:

| Rol | Descripción | Acceso |
|-----|-------------|--------|
| **Público / Visitante** | Cualquier persona que ingresa a la web | Puede ver torneos, categorías, resultados y estado de mesas |
| **Administrador** | Usuario con credenciales de acceso | Puede crear torneos, ingresar resultados, asignar mesas y gestionar todo el torneo |

### Cómo ingresar como Administrador

1. Desde cualquier página, busca el botón **"Panel Admin"** en la esquina superior derecha del encabezado.
2. Haz clic en él. Si no has iniciado sesión, se mostrará una pantalla de inicio de sesión.
3. Ingresa el nombre de usuario y contraseña proporcionados por el administrador del sistema.
4. Al autenticarte correctamente, verás el **Panel de Administrador** con acceso completo.

`[📸 PANTALLAZO: Encabezado de la página de inicio mostrando el logo, el botón de cambio de tema y el botón "Panel Admin" resaltado en cian]`

---

## 2. Página de Inicio (Home)

Al abrir la aplicación, lo primero que ves es la **página de inicio**.

`[📸 PANTALLAZO: Vista completa de la página de inicio con el fondo animado de fotos de tenis de mesa, el título "Torneos de Tenis de Mesa" y las tarjetas de torneos]`

### 2.1 Encabezado

- **Logo de la Fundación Federico** – ubicado a la izquierda. En pantallas grandes se muestra con animación al pasar el cursor.
- **Botón de Tema** (ícono de sol/luna) – cambia entre modo claro y modo oscuro. El sistema recuerda tu preferencia.
- **Botón "Panel Admin"** – acceso exclusivo para administradores.

### 2.2 Sección Hero (Presentación)

La parte superior de la página muestra:

- Un **fondo animado** con fotos de tenis de mesa que se desplazan en carrusel horizontal, creando un efecto visual dinámico.
- El **título principal** del sistema.
- Una **descripción** de la misión de la Fundación Federico.
- El **logo oficial** en grande (visible solo en pantallas de escritorio).

### 2.3 Sección de Torneos

Debajo del hero se listan todos los torneos organizados en dos grupos:

#### Torneos "En Curso" 🟢
- Aparecen primero, con un indicador **verde parpadeante** que señala que está activo.
- Cada tarjeta muestra:
  - Ícono de trofeo
  - **Badge verde** con texto "En curso" y un punto animado
  - **Nombre del torneo**
  - **Fecha** del torneo
  - Botón-enlace **"Ver campeonato"** con flecha a la derecha

`[📸 PANTALLAZO: Sección "En Curso" con una o más tarjetas de torneos activos, resaltando el badge verde y el nombre del torneo]`

#### Torneos "Finalizados" ⚪
- Aparecen debajo, con un **badge gris** que indica que terminaron.
- Tienen la misma estructura de tarjeta pero con estilo visual apagado.

`[📸 PANTALLAZO: Sección "Finalizados" con tarjetas de torneos pasados]`

**Al hacer clic en cualquier tarjeta**, se navega a la vista detallada de ese torneo.

### 2.4 Estado de carga

Si la página está cargando los torneos desde el servidor, aparece un **indicador de carga giratorio** en color cian en el centro de la pantalla. Desaparece automáticamente cuando los datos están listos.

### 2.5 Pie de Página (Footer)

El footer contiene:

- **Logo de la Fundación** en grande
- Frase institucional en cursiva
- **Botón "Dona Ahora ❤️"** – abre WhatsApp con un mensaje predefinido para hacer donaciones
- **Información de contacto:**
  - Dirección: Calle 47 # 29-69 Oficina 202, Bucaramanga, Santander
  - Correo: contacto@fundacionfederico.com
  - Teléfono: +57 318 209 9130
- **Redes sociales:** iconos con enlaces a Facebook, Instagram y X (Twitter)
- **Copyright** al fondo

`[📸 PANTALLAZO: Vista del footer con el logo, los datos de contacto y los íconos de redes sociales]`

---

## 3. Vista de un Torneo

Al hacer clic en un torneo, se abre la **página del torneo** con toda su información.

`[📸 PANTALLAZO: Vista completa de la página de un torneo activo, mostrando el encabezado, el menú de mesas arriba y las categorías en grilla]`

### 3.1 Encabezado de la Página del Torneo

- **Logo** de la Fundación (con enlace de regreso al inicio o al panel admin)
- **Botón de regreso** – "Panel Admin" si eres admin, o "Inicio" si eres visitante
- **Botón de Tema** (sol/luna)

### 3.2 Sección Hero del Torneo

Justo debajo del encabezado aparece:

- **Enlace de migas de pan** – muestra "← Panel Admin" o "← Todos los torneos" para regresar fácilmente
- **Nombre del torneo** en grande
- **Fecha** del torneo con ícono de calendario
- **Estado:**
  - 🟢 **"En curso"** – punto verde parpadeante, el torneo está activo
  - ⚪ **"Finalizado"** – ícono de reloj, el torneo ha terminado
- **Estadísticas del torneo** (3 contadores en fila):
  - Total de categorías
  - Categorías finalizadas
  - Categorías en progreso

`[📸 PANTALLAZO: Sección hero del torneo mostrando el nombre, fecha, badge de estado y los 3 contadores]`

### 3.3 Lista de Categorías

Las categorías del torneo se muestran en una **grilla de tarjetas**. Cada tarjeta de categoría muestra:

- Ícono de capas (Layers)
- **Badge de estado:** "Activa" (verde) o "Finalizada" (gris)
- **Nombre de la categoría** (ej: "Masculino A", "Femenino Sub-18")
- Información de configuración:
  - Jugadores por grupo
  - Clasificados por grupo
  - Total de jugadores inscritos
- Enlace **"Ver secuencias"** con flecha

`[📸 PANTALLAZO: Grilla de 2-3 tarjetas de categorías, mostrando una activa y una finalizada para comparar los estados]`

**Al hacer clic en una categoría**, se entra a la vista de secuencias de ese grupo.

---

## 4. Panel de Control de Mesas

El **menú de mesas** es uno de los elementos más importantes del sistema. Aparece en tres lugares:

1. En la **página del torneo** (debajo del encabezado)
2. En la **página de secuencias** de cada categoría
3. En la **página de llaves** de cada categoría

Es una **barra horizontal fija en la parte superior** de la pantalla (sticky), lo que significa que siempre es visible aunque se haga scroll hacia abajo.

`[📸 PANTALLAZO: Barra de mesas completa, mostrando algunas libres (verde) y algunas ocupadas (rojo) con los nombres de los jugadores]`

### 4.1 Cómo funciona visualmente

- Si hay **muchas mesas**, el menú se puede desplazar horizontalmente:
  - **Con el mouse**: haz clic y arrastra hacia la izquierda o derecha (drag-to-scroll). El cursor cambia a una "mano" para indicar que puedes arrastrar.
  - **Con teclas**: usa las flechas del teclado o el scroll horizontal del touchpad.

- Cada **tarjeta de mesa** muestra:
  - El número de mesa (ej: "MESA 1", "MESA 2")
  - Un **badge de color** que indica el estado:
    - 🟢 **Verde** con texto "Libre" – la mesa está disponible
    - 🔴 **Rojo** con los nombres de los jugadores – la mesa está en uso

- Cuando una mesa está **ocupada**, se muestra:
  - Nombre del Jugador 1
  - "VS"
  - Nombre del Jugador 2
  - La categoría y grupo donde se está jugando (en letra pequeña)

- El menú **se actualiza automáticamente** cada 10 segundos sin necesidad de recargar la página.

`[📸 PANTALLAZO: Acercamiento (zoom) a dos tarjetas de mesa: una verde "Libre" y una roja con dos nombres de jugadores y el nombre del grupo]`

### 4.2 Diferencias entre Admin y Visitante

| Acción | Visitante | Admin |
|--------|-----------|-------|
| Ver estado de las mesas | ✅ Sí | ✅ Sí |
| Asignar un partido a una mesa | ❌ No | ✅ Sí |
| Liberar una mesa manualmente | ❌ No | ✅ Sí |

---

## 5. Vista de Categoría – Secuencias (Round Robin)

Esta es la **pantalla principal de gestión de partidos**. Se accede haciendo clic en una categoría desde la vista del torneo.

`[📸 PANTALLAZO: Vista general completa de la página de secuencias, mostrando el menú de mesas arriba, los grupos con sus tablas de resultados y la tabla de posiciones]`

### 5.1 Encabezado

- **Logo** con enlace de regreso
- **Nombre de la categoría** y del torneo
- **Botón "← Torneo"** para volver atrás
- **Botón "🏆 Generar Llaves"** (solo visible para admins cuando todas las secuencias están completas) – genera el bracket de eliminación directa

### 5.2 Menú de Mesas

Justo debajo del encabezado aparece el **Panel de Mesas** (descrito en la sección 4). Es fijo en pantalla para que siempre puedas ver el estado de las mesas mientras gestionas los partidos.

### 5.3 Grupos y Tabla de Resultados (Round Robin)

Cada **grupo** se muestra en una sección separada. Un grupo contiene:

#### Tabla de Resultados (Crossfield)

Una **tabla cruzada** donde cada fila es un jugador y cada columna es otro jugador del mismo grupo:

- La **diagonal** (intersección de un jugador consigo mismo) aparece bloqueada y sombreada.
- Las celdas de **intersección** entre dos jugadores muestran el resultado del partido entre ellos.
- Los resultados se muestran en formato de **sets**, por ejemplo `3-1` (Jugador A ganó 3 sets, Jugador B ganó 1).

`[📸 PANTALLAZO: Tabla crossfield de un grupo con algunos resultados ingresados y otros pendientes. Mostrar el formato "3-1" en una celda]`

#### Cómo ingresar un resultado (Solo Admin)

1. **Haz clic** en la celda vacía de la intersección entre dos jugadores.
2. Aparecerá un campo de texto en esa celda.
3. Escribe el resultado **desde la perspectiva del jugador de esa fila** (ej: si estás en la fila de "Juan" y jugó contra "María", escribe cuántos sets ganó Juan primero, luego cuántos ganó María: `3-2`).
4. Presiona **Enter** o haz clic fuera del campo para guardar.
5. El sistema actualiza automáticamente la tabla de posiciones.
6. Si el partido tenía una **mesa asignada**, esta se libera automáticamente al guardar el resultado.

`[📸 PANTALLAZO: Celda de resultado en modo edición (con el campo de texto activo) y otra celda ya guardada con el resultado]`

#### Selector de Mesa (Solo Admin)

En cada fila de partido que aún no tiene resultado, aparece un **selector desplegable de mesas** a la derecha:

- Muestra todas las mesas disponibles del torneo.
- Las mesas ya ocupadas aparecen como "(Ocup)" y están deshabilitadas para no asignar dos partidos a la misma mesa.
- Al seleccionar una mesa, el partido queda **asignado a esa mesa** y el menú de mesas de arriba se actualiza inmediatamente mostrando los nombres de los jugadores en esa mesa.
- Para **desasignar** un partido de su mesa, selecciona la opción "Mesa —" (primera opción del desplegable).

`[📸 PANTALLAZO: Selector de mesa desplegable en una fila de partido, mostrando las opciones disponibles y marcadas como ocupadas]`

#### Asignación de mesa para visitantes

Los visitantes (no admins) **no ven el selector**. En su lugar, si un partido tiene una mesa asignada, ven una pequeña etiqueta que indica el número de mesa donde se está jugando ese partido.

### 5.4 Tabla de Posiciones (Standings)

Debajo de cada tabla de resultados aparece la **tabla de posiciones** del grupo, con columnas:

| POS | Jugador | PJ | G | P | SG | SP | DIF |
|-----|---------|----|----|----|----|-----|-----|
| 1 | Nombre | Partidos Jugados | Ganados | Perdidos | Sets Ganados | Sets Perdidos | Diferencia |

- Los jugadores se ordenan automáticamente por puntos (victorias) y por diferencia de sets.
- Los jugadores que clasifican a la siguiente ronda aparecen **resaltados** (con borde dorado o cian).
- Los jugadores que **no clasifican** aparecen con menor opacidad visual.

`[📸 PANTALLAZO: Tabla de posiciones de un grupo con 4 jugadores, mostrando los 2 primeros resaltados como clasificados]`

### 5.5 Desempate Manual (Solo Admin)

Si dos o más jugadores terminan **empatados** en posiciones y sets, el sistema muestra un botón de **"Resolver Desempate"** en la tabla de posiciones del grupo.

1. Haz clic en el botón.
2. Aparecerá un panel lateral con los jugadores empatados.
3. Usa los **botones de flecha ↑↓** para reordenar manualmente quién clasifica.
4. Haz clic en **"Guardar Desempate"** para confirmar el orden.

`[📸 PANTALLAZO: Panel de desempate abierto con los jugadores empatados y las flechas para reordenarlos]`

### 5.6 Gestión de Jugadores (Solo Admin)

En cada grupo, los administradores pueden gestionar los jugadores:

#### Renombrar un jugador
- Haz clic en el **ícono de lápiz** ✏️ junto al nombre del jugador.
- Edita el nombre en el campo que aparece.
- Presiona **Enter** o el botón de confirmar para guardar.

#### Eliminar un jugador
- Haz clic en el **ícono de basurero** 🗑️ junto al nombre del jugador.
- Aparecerá una confirmación: *"¿Eliminar este jugador del grupo? Se borrarán sus partidos."*
- Confirma para eliminar. Esta acción es **irreversible**.

#### Agregar un jugador
- Al final de cada grupo hay un **botón "+ Agregar jugador"**.
- Haz clic en él, escribe el nombre del nuevo jugador y confirma.
- El sistema generará automáticamente los partidos necesarios para el nuevo jugador contra todos los demás del grupo.

`[📸 PANTALLAZO: Fila de un jugador en el grupo con los íconos de lápiz y basurero visibles, y el botón "Agregar jugador" al final]`

### 5.7 Secuencias de Partidos (Rondas)

Además de la tabla cruzada, el sistema muestra las **rondas de partidos** organizadas cronológicamente usando el **algoritmo de Berger**. Cada ronda muestra:

- Número de ronda
- Cada partido con los números de posición de los jugadores (ej: 1 vs 4, 2 vs 3)
- Los nombres completos de los jugadores
- Si el partido ya tiene resultado, aparece con un **✓ verde**
- Si el partido está pendiente y hay mesas disponibles, aparece el **selector de mesa** (admin) o el número de mesa asignada (visitante)

`[📸 PANTALLAZO: Sección de rondas mostrando la Ronda 1 y Ronda 2 con partidos en diferentes estados: completado (✓ verde), en mesa asignada y pendiente]`

---

## 6. Vista de Llaves (Eliminación Directa)

Una vez que todas las secuencias de una categoría están completas, el administrador puede **generar las llaves de eliminación directa**. Se accede desde el botón "🏆 Generar Llaves" en la página de secuencias, o directamente desde la tarjeta de la categoría si las llaves ya existen.

`[📸 PANTALLAZO: Vista general de las llaves de eliminación, mostrando el bracket completo con los jugadores ubicados en cada enfrentamiento]`

### 6.1 Encabezado

- **Logo** y botones de navegación (igual que en la vista de secuencias)
- Si el torneo no está finalizado, puede mostrar botones adicionales de gestión

### 6.2 Menú de Mesas

El mismo **menú de mesas** fijo aparece en la parte superior, con la misma funcionalidad descrita en la sección 4.

### 6.3 El Bracket

El bracket de eliminación directa se muestra como un **árbol visual de partidos**:

- Cada **"caja" de partido** contiene dos jugadores enfrentados.
- El **ganador avanza** automáticamente a la siguiente ronda al ser registrado.
- Las rondas están etiquetadas: Ronda 1, Cuartos de Final, Semifinal, Final.
- Los partidos completados muestran el ganador **resaltado en cian** y el perdedor en gris.

`[📸 PANTALLAZO: Bracket de eliminación directa con algunas rondas completadas, mostrando ganadores resaltados y los partidos pendientes]`

### 6.4 Registrar Ganador (Solo Admin)

Para registrar el resultado de un partido en las llaves:

1. Haz clic en uno de los dos jugadores del partido.
2. Aparecerá un **modal de confirmación** que pregunta "¿Confirmar a [Nombre] como ganador?"
3. Haz clic en **"Confirmar"** para registrar.
4. El jugador ganador avanza automáticamente al siguiente partido.
5. Si el partido tenía una **mesa asignada**, esta se libera automáticamente.

`[📸 PANTALLAZO: Modal de confirmación de ganador abierto, mostrando el nombre del jugador y los botones "Cancelar" y "Confirmar"]`

### 6.5 Asignar Mesa en las Llaves (Solo Admin)

En cada partido pendiente de las llaves, aparece un **selector de mesa** igual al de las secuencias. Funciona de la misma manera:
- Selecciona la mesa deseada del desplegable.
- La mesa se marca como ocupada inmediatamente en el menú superior.
- Al confirmar el ganador, la mesa se libera automáticamente.

### 6.6 Arrastrar y Reordenar Jugadores (Solo Admin)

Antes de que los partidos comiencen, el administrador puede **reorganizar los jugadores** del bracket arrastrándolos:

1. Haz clic y mantén presionado sobre un jugador.
2. Arrástralo a otra posición en el bracket.
3. Suéltalo para intercambiar su posición con el jugador destino.

Esto es útil para ajustar el orden del bracket según criterios adicionales.

`[📸 PANTALLAZO: Bracket con el cursor en modo arrastre sobre un jugador, mostrando la interfaz de drag and drop activa]`

### 6.7 Agregar Jugador Extra (Solo Admin)

Si un jugador no aparece en el bracket (por ejemplo, un wildcard), hay un botón **"+ Agregar jugador"** en la parte superior. Al hacer clic:

1. Se abre un modal con un campo de texto.
2. Escribe el nombre completo del jugador.
3. Presiona **"Confirmar"**.
4. El jugador aparece en la primera posición disponible del bracket.

### 6.8 Cuadro de Honor (Ranking Final)

Cuando **todos los partidos del bracket están completados**, el sistema muestra automáticamente el **Cuadro de Honor** al final de la página con:

- 🥇 **1er puesto** – en el centro, con mayor tamaño y color dorado
- 🥈 **2do puesto** – a la izquierda, en gris plata
- 🥉 **3er puesto** – a la derecha, en bronce
- Los demás clasificados en orden

`[📸 PANTALLAZO: Cuadro de Honor completo mostrando el podio con los tres primeros lugares y sus iconos de trofeo/medalla]`

---

## 7. Panel de Administrador

Accesible desde el botón "Panel Admin" en la esquina superior derecha del home.

`[📸 PANTALLAZO: Dashboard del admin con las estadísticas en la parte superior y la lista de torneos debajo]`

### 7.1 Login de Administrador

Si no hay sesión activa, se redirige a la pantalla de login. Ingresa:
- **Usuario** y **Contraseña** proporcionados por el sistema
- Haz clic en **"Iniciar Sesión"**

Una vez autenticado, el sistema guarda la sesión en el navegador. No necesitas hacer login nuevamente a menos que cierres sesión.

`[📸 PANTALLAZO: Pantalla de login del administrador con los campos de usuario, contraseña y el botón de ingreso]`

### 7.2 Dashboard Principal

El dashboard tiene tres secciones:

#### Barra lateral (Sidebar)
- Logo de la Fundación
- Enlace **"Dashboard"** (resaltado cuando estás en esa sección)
- Botón **"Cerrar Sesión"** para salir del panel admin

#### Estadísticas Rápidas
Tres tarjetas en la parte superior muestran:
- **Total** de torneos creados (en cian)
- **En curso** – torneos activos actualmente (en verde)
- **Finalizados** – torneos concluidos (en gris)

`[📸 PANTALLAZO: Las tres tarjetas de estadísticas resaltadas: Total, En curso, Finalizados]`

#### Lista de Torneos
Una tabla con todos los torneos que muestra:
- Ícono de trofeo + **nombre** del torneo
- **Fecha**
- **Badge de estado** (En curso / Finalizado)
- Botón **"Ver"** – abre la vista pública del torneo
- Botón **🗑️ (basurero)** – elimina el torneo con todo su contenido

> ⚠️ **Advertencia:** Eliminar un torneo borra **todos** sus datos permanentemente: categorías, grupos, jugadores, partidos y resultados. Esta acción **no se puede deshacer**.

Al hacer clic en el ícono de basurero, aparece un cuadro de confirmación: *"¿Eliminar este torneo y todos sus datos?"*

`[📸 PANTALLAZO: Lista de torneos en el admin con las columnas de nombre, fecha, estado y los botones "Ver" y el basurero]`

---

## 8. Crear un Nuevo Torneo (Flujo Paso a Paso)

Desde el Dashboard del admin, haz clic en el botón **"+ Nuevo Torneo"** en la esquina superior derecha.

### Paso 1: Datos del Torneo

Se muestra un formulario con indicador de progreso "1 → 2":

`[📸 PANTALLAZO: Formulario del Paso 1 con los 3 campos: Nombre, Fecha y Mesas Disponibles, y el indicador de progreso]`

#### Campos del formulario:

| Campo | Descripción | Ejemplo |
|-------|-------------|---------|
| **Nombre del torneo** | Nombre descriptivo del torneo | "Torneo Navidad 2025" |
| **Fecha** | Fecha de realización (selector de calendario) | 25/12/2025 |
| **Mesas Disponibles** | Número de mesas físicas en el recinto (0–50) | 8 |

- El campo **Mesas Disponibles** define cuántas mesas aparecerán en el menú de mesas para todos los usuarios. Si un torneo no tiene mesas (valor 0), el menú de mesas no aparecerá.

- Haz clic en **"Continuar — Agregar Categorías"** para pasar al siguiente paso.

### Paso 2: Agregar Categorías

El indicador de progreso cambia: el paso 1 muestra un ✓ verde y el paso 2 queda activo.

`[📸 PANTALLAZO: Paso 2 con el formulario de categoría y la lista de categorías ya agregadas encima]`

#### Formulario de Nueva Categoría:

| Campo | Descripción | Ejemplo |
|-------|-------------|---------|
| **Nombre de la categoría** | Nombre de la división | "Masculino A", "Femenino", "Sub-18" |
| **Jugadores por grupo** | Cuántos jugadores habrá en cada grupo | 4 |
| **Clasificados por grupo** | Cuántos avanzan a las llaves | 2 |
| **Participantes** | Lista de jugadores (uno por línea, en orden de nivel) | Juan García |

- El campo **Participantes** acepta múltiples líneas. Escribe **un jugador por línea**, ordenados de mejor a peor nivel (el primero es el mejor sembrado). El contador en la esquina muestra cuántos jugadores llevas.
- Haz clic en **"Agregar Categoría"** para guardarla y continuar añadiendo más.
- Las categorías ya guardadas aparecen arriba con un ✓ verde y su resumen (nombre, jugadores, grupos).

#### Finalizar y Publicar

Una vez que hayas agregado al menos una categoría:
- Aparece una tarjeta azul con el mensaje *"¿Listo para publicar el torneo?"*
- Haz clic en **"Crear Torneo"** para publicarlo.
- El sistema te redirige automáticamente a la página del torneo recién creado.

> **Nota:** El torneo se crea en la base de datos al completar el Paso 1. El Paso 2 permite añadir categorías. Si sales sin finalizar, el torneo ya existe pero sin categorías.

`[📸 PANTALLAZO: Panel azul de "¿Listo para publicar?" con el botón "Crear Torneo" y la lista de categorías agregadas encima]`

---

## 9. Modo Día y Modo Noche

El sistema soporta dos temas visuales que se adaptan automáticamente o puedes cambiar manualmente:

`[📸 PANTALLAZO: La misma vista (ej: página de secuencias) en los dos modos: izquierda en modo noche (oscuro), derecha en modo día (claro)]`

### Cómo cambiar el tema

- Haz clic en el **botón de sol ☀️ / luna 🌙** en la esquina superior derecha de cualquier página.
- El tema cambia instantáneamente sin recargar la página.
- Tu preferencia se guarda y se mantiene entre visitas.

### Características del Modo Noche (predeterminado)

- Fondo **negro/gris oscuro** (#0a0a0a y variantes)
- Textos en **blanco y grises claros**
- Acentos en **cian** (#06b6d4)
- Bordes con baja opacidad, efecto **glassmorphism**
- Ideal para ambientes de torneo con poca luz

### Características del Modo Día

- Fondo **blanco/gris claro**
- Textos en **negro y grises oscuros**
- Los mismos acentos cian
- Bordes y sombras más definidos
- Ideal para ambientes con mucha luz natural

Todos los elementos del sistema (menú de mesas, tablas de resultados, brackets, formularios) respetan completamente el tema seleccionado.

---

## 10. Tecnologías Utilizadas

El sistema fue desarrollado con tecnologías modernas de alto rendimiento:

### Frontend (Interfaz de Usuario)

| Tecnología | Versión | Uso |
|-----------|---------|-----|
| **Next.js** | 14.2.3 | Framework principal de React para la aplicación web |
| **React** | 18 | Librería de componentes de interfaz de usuario |
| **TypeScript** | 5 | JavaScript tipado para mayor seguridad y mantenibilidad |
| **Tailwind CSS** | 3 | Sistema de utilidades CSS para el diseño visual |
| **Lucide React** | – | Íconos modernos en SVG (trofeo, calendario, flecha, etc.) |
| **@dnd-kit/core** | – | Librería de drag and drop para el reordenamiento del bracket |

### Backend (Servidor y API)

| Tecnología | Uso |
|-----------|-----|
| **Next.js App Router** | API Routes – endpoints REST integrados en el mismo proyecto |
| **PostgreSQL** | Base de datos relacional para almacenar torneos, categorías, jugadores y resultados |
| **node-postgres (pg)** | Librería de conexión a PostgreSQL desde Node.js |
| **JSON Web Tokens (JWT)** | Autenticación segura del administrador |

### Infraestructura y Despliegue

| Tecnología | Uso |
|-----------|-----|
| **Azure** | Plataforma cloud donde está desplegada la aplicación |
| **GitHub** | Control de versiones y repositorio del código fuente |
| **Git** | Sistema de control de versiones |

### Algoritmos Implementados

| Algoritmo | Descripción |
|-----------|-------------|
| **Algoritmo de Berger** | Genera automáticamente el calendario de partidos Round Robin de forma equilibrada, distribuyendo los enfrentamientos en el menor número de rondas posible |
| **Sistema de sembrados** | Los jugadores son sembrados por nivel para equilibrar los grupos según el orden ingresado al crear la categoría |

---

*Manual elaborado para la Fundación Federico – Sistema de Gestión de Torneos de Tenis de Mesa*
*Versión 1.0 – 2026*
