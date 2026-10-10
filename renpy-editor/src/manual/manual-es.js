// Ren'Py EDITOR — Manual de uso (español)
(window.MANUALS = window.MANUALS || {}).es = {
  title: 'Manual de Ren\'Py EDITOR',
  search: 'Buscar en el manual',
  contents: 'Contenido',
  noResults: 'No hay ninguna sección que contenga ese texto.',
  html: `
<section id="intro">
  <h2>Bienvenida</h2>
  <p>Ren'Py EDITOR es un editor visual para crear novelas visuales con <a href="https://www.renpy.org" target="_blank" rel="noopener">Ren'Py</a>. En lugar de escribir todo el código a mano, construyes cada escena con <strong>bloques</strong> (diálogos, cambios de fondo, personajes que entran y salen, decisiones…) y el editor escribe el código de Ren'Py por ti. El código siempre está a la vista si lo quieres, y puedes editarlo directamente.</p>
  <p>El editor trabaja sobre los archivos de tu proyecto de Ren'Py: lo que guardas aquí es un proyecto normal que puedes abrir también con el launcher de Ren'Py o con cualquier editor de texto.</p>
  <div class="man-note"><strong>Palabras de código.</strong> Los nombres que vienen del código de Ren'Py (<code>label</code>, <code>jump</code>, <code>call</code>, <code>Solid</code>…) se mantienen igual en todos los idiomas, para que coincidan con lo que verás en el código.</div>
</section>

<section id="start">
  <h2>Primeros pasos</h2>
  <h3>Lo que necesitas</h3>
  <p>Para <strong>probar el juego</strong>, <strong>crear proyectos nuevos</strong> y <strong>compilar</strong> hace falta tener Ren'Py (el SDK) en el ordenador. Si el editor no lo encuentra, te ofrece tres opciones:</p>
  <ul>
    <li><strong>Descargar e instalar automáticamente:</strong> descarga la última versión desde renpy.org (unos 160 MB), comprueba que el archivo no está dañado y la instala en la carpeta que elijas.</li>
    <li><strong>Ir a la web de Ren'Py</strong> para descargarlo tú.</li>
    <li><strong>Ya lo tengo instalado:</strong> eliges el archivo <code>renpy.exe</code> de tu instalación.</li>
  </ul>
  <p>Puedes cambiarlo cuando quieras en <a href="#settings">Ajustes</a> → Ren'Py → <em>Cambiar o instalar</em>.</p>
  <h3>La pantalla principal</h3>
  <ul>
    <li><strong>Barra lateral (izquierda):</strong> las secciones del editor (<em>Mapa, Escenas, Declaraciones, Menú principal, Interfaz del juego</em>), las acciones del proyecto (<em>Abrir carpeta del proyecto, Nuevo proyecto, Ajustes del juego, Compilar juego</em>) y, abajo, <em>Iniciar juego</em>, este <em>Manual</em> y los <em>Ajustes</em> del editor. Debajo aparece la carpeta del proyecto abierto.</li>
    <li><strong>Cabecera:</strong> el archivo <code>.rpy</code> activo, el <em>Label destino</em>, el menú <em>Mostrar</em> para elegir qué paneles ver, <em>Limpiar todo</em> y <em>Guardar en archivo</em>.</li>
    <li><strong>Zona de trabajo:</strong> la lista de archivos, la paleta de bloques, la lista de bloques de la escena, la vista previa de la escena y la vista previa del código.</li>
  </ul>
  <div class="man-tip"><strong>Consejo:</strong> pulsa <kbd>F1</kbd> en cualquier momento para abrir este manual.</div>
</section>

<section id="projects">
  <h2>Proyectos</h2>
  <h3>Abrir un proyecto</h3>
  <p>Pulsa <strong>Abrir carpeta del proyecto</strong> y elige la carpeta de tu juego (la que contiene la carpeta <code>game</code>) o directamente la carpeta <code>game</code>. El editor recuerda el último proyecto y lo abre solo la próxima vez.</p>
  <p>Al abrirlo, el editor prepara lo que necesita si no existe: las carpetas <code>audio</code>, <code>images/characters</code>, <code>images/backgrounds</code>, <code>images/scenes</code> e <code>images/expressions</code>, y los archivos donde guarda las declaraciones (<code>characters.rpy</code>, <code>backgrounds.rpy</code>, <code>scenes.rpy</code>, <code>expressions.rpy</code>, <code>animations.rpy</code>, <code>positions.rpy</code> y <code>audio.rpy</code>). No toca tus otros archivos.</p>
  <p>Si tienes imágenes declaradas en carpetas con otro nombre (por ejemplo <code>personajes</code> en lugar de <code>characters</code>), el editor te pregunta si quieres moverlas a las carpetas en inglés y actualizar las rutas en los <code>.rpy</code>. Puedes decir que no.</p>
  <h3>Crear un proyecto nuevo</h3>
  <p>Pulsa <strong>Nuevo proyecto</strong>, escribe un nombre, elige la <strong>resolución</strong> (1920×1080 es un buen término medio) y los <strong>colores de la interfaz</strong> del juego. El proyecto se crea con Ren'Py en tu <em>carpeta de proyectos</em> (si no la tienes definida, el editor te la pide) y se abre automáticamente.</p>
  <h3>Cambios desde fuera del editor</h3>
  <p>Si editas un <code>.rpy</code> con otro programa (o lo cambia Claude, ver <a href="#claude">Conexión con Claude</a>), el editor lo detecta y recarga los datos del proyecto.</p>
</section>

<section id="declarations">
  <h2>Declaraciones: personajes, imágenes y más</h2>
  <p>La ventana <strong>Declaraciones</strong> reúne todo lo que la historia usa: personajes, sus imágenes, fondos… Lo que añades aquí aparece luego en los selectores de los bloques. Tiene estas pestañas:</p>
  <ul>
    <li><strong>Personajes:</strong> cada personaje tiene un <em>nombre no visible</em> (el que se usa en el código, solo letras), el <em>nombre visible en la historia</em>, el color del nombre y la etiqueta de sus expresiones.</li>
    <li><strong>Sprites:</strong> las imágenes de cada personaje, organizadas por tipo (por ejemplo, el uniforme o la ropa). Se nombran como <code>personaje_tipo_identificación</code> (ej. <code>Ryu_hunter_1</code>). Puedes añadir imágenes sueltas o <em>Importar carpeta</em> para añadir muchas de una vez.</li>
    <li><strong>Expresiones:</strong> las caras laterales (side images) que acompañan al diálogo.</li>
    <li><strong>Fondos</strong> y <strong>Escenas:</strong> los fondos de cada lugar y las ilustraciones (CG) de momentos concretos.</li>
    <li><strong>Animaciones</strong> y <strong>Posiciones:</strong> los <code>transform</code> y las posiciones que puedes usar al mostrar personajes.</li>
  </ul>
  <p>Al eliminar algo, el editor te pregunta si quieres borrar también el archivo de imagen o conservarlo.</p>
</section>

<section id="scenes">
  <h2>Escenas: el editor de bloques</h2>
  <p>Es la sección principal. Una escena es un <code>label</code> de Ren'Py, y su contenido es una lista de bloques.</p>
  <h3>Archivos y label destino</h3>
  <ul>
    <li>En el panel <strong>Archivos</strong> eliges el archivo <code>.rpy</code> activo. Con <strong>+</strong> creas un archivo nuevo.</li>
    <li>En <strong>Label destino</strong> eliges qué label quieres editar: el editor carga sus bloques. Si eliges <em>— Al final del archivo —</em>, lo que guardes se añadirá al final del archivo como algo nuevo.</li>
  </ul>
  <h3>Añadir y organizar bloques</h3>
  <p>La paleta <strong>Añadir bloque</strong> agrupa los bloques por colores: <em>Texto, Escena, Flujo, Audio, Avanzado</em> (y <em>Parche</em> si lo has activado). Al pulsar uno se abre su formulario; el bloque nuevo se coloca <strong>debajo del bloque seleccionado</strong>.</p>
  <p>Haz clic en un bloque para seleccionarlo: aparecen sus acciones (<em>Editar, Duplicar debajo, Duplicar al final, Subir, Bajar, Eliminar</em>) y la vista previa muestra la escena en ese momento. Doble clic para editarlo. También puedes arrastrar los bloques para reordenarlos.</p>
  <table>
    <tr><th>Tecla</th><th>Acción</th></tr>
    <tr><td><kbd>↑</kbd> <kbd>↓</kbd></td><td>Seleccionar el bloque anterior o siguiente</td></tr>
    <tr><td><kbd>Alt</kbd> + <kbd>↑</kbd> <kbd>↓</kbd></td><td>Subir o bajar el bloque</td></tr>
    <tr><td><kbd>Intro</kbd></td><td>Editar el bloque</td></tr>
    <tr><td><kbd>Supr</kbd></td><td>Eliminar el bloque (pide confirmación)</td></tr>
  </table>
  <h3>Guardar</h3>
  <p><strong>Guardar en archivo</strong> escribe los bloques en el archivo activo: si hay un label destino, <strong>sustituye todo su contenido</strong> (te lo confirma antes); si no, lo añade al final. <strong>Limpiar todo</strong> vacía la lista de bloques sin tocar el archivo.</p>
  <p>Si tienes cambios sin guardar y cambias de label o de archivo, el editor te avisa antes de descartarlos.</p>
  <h3>Paneles</h3>
  <p>Con <strong>Mostrar</strong> eliges qué paneles ver: <em>Archivos, Bloques, Vista previa</em> y <em>Código</em>. Puedes cambiar el tamaño de los paneles arrastrando sus bordes; un doble clic en el borde devuelve el tamaño inicial. El editor recuerda tu distribución.</p>
</section>

<section id="blocks">
  <h2>Tipos de bloque</h2>
  <h3>Texto</h3>
  <ul>
    <li><strong>Diálogo:</strong> lo que dice un personaje. Puedes elegir una <em>expresión</em> lateral para ese momento y marcarlo como <em>pensamiento</em> (se muestra en cursiva y entre &lt;&lt; &gt;&gt;).</li>
    <li><strong>Narración:</strong> texto del narrador, sin nombre.</li>
  </ul>
  <h3>Escena</h3>
  <ul>
    <li><strong>Cambio de escena:</strong> pone un fondo o una ilustración (<code>scene</code>) y quita a todos los personajes. Puedes añadir una transición (<code>with</code>) y desenfocar la imagen.</li>
    <li><strong>Mostrar sprite:</strong> hace aparecer a un personaje (<code>show</code>). Eliges la imagen, la posición o animación (<code>at</code>), la transición, si va detrás de otra imagen (<code>behind</code>), si se voltea (<code>xflip</code>) o se desenfoca.</li>
    <li><strong>Mostrar varios:</strong> varios personajes a la vez, con una transición conjunta.</li>
    <li><strong>Ocultar sprite</strong> y <strong>Ocultar varios:</strong> quitan personajes de la pantalla (<code>hide</code>). El editor te propone los que están en pantalla según los bloques anteriores.</li>
    <li><strong>Solid:</strong> una capa de color sólido (por ejemplo, para un fundido a negro o un tinte), con su opacidad.</li>
  </ul>
  <h3>Flujo</h3>
  <ul>
    <li><strong>Decisión:</strong> un menú de opciones (<code>menu</code>). Cada opción puede saltar a un label (<code>jump</code>), llamarlo (<code>call</code>), ejecutar código o contener sus propios bloques. Puedes mostrar a un personaje junto a las opciones y colocarlas a la izquierda como un bocadillo de pensamiento.</li>
    <li><strong>Condición:</strong> bloques que solo se ejecutan si se cumple una condición (<code>if</code>), con <code>elif</code> y <code>else</code> opcionales. Ejemplo: <code>amistad &gt;= 3 and not ya_confeso</code>.</li>
    <li><strong>Jump:</strong> salta a otro label y no vuelve.</li>
    <li><strong>Call:</strong> va a otro label y, cuando este termina con <code>return</code>, vuelve aquí. Útil para partes que se repiten en varios sitios.</li>
    <li><strong>Label:</strong> crea un label nuevo, a continuación o al final del archivo.</li>
    <li><strong>Pausa:</strong> espera unos segundos o, si lo dejas vacío, hasta que el jugador haga clic.</li>
  </ul>
  <h3>Audio</h3>
  <ul>
    <li><strong>Música:</strong> reproducir (<code>play</code>), poner en cola (<code>queue</code>) o parar (<code>stop</code>) la música, en bucle o no. Puedes escuchar los archivos de <code>game/audio</code> antes de elegir.</li>
  </ul>
  <h3>Avanzado</h3>
  <ul>
    <li><strong>Comentario:</strong> una nota para ti que no aparece en el juego.</li>
    <li><strong>Código libre:</strong> cualquier código de Ren'Py que no tenga un bloque propio.</li>
  </ul>
  <h3>Bloques dentro de bloques</h3>
  <p>Las opciones de una <em>Decisión</em> y las ramas de una <em>Condición</em> pueden contener otros bloques. En su formulario tienes una fila de botones para añadirlos y una lista donde editarlos, reordenarlos o eliminarlos.</p>
</section>

<section id="preview">
  <h2>Vista previa de la escena y del código</h2>
  <h3>Vista previa de la escena</h3>
  <p>Muestra cómo se ve la escena en el bloque seleccionado: fondo, personajes en su posición, caja de diálogo con el nombre y el texto, o las opciones de una decisión. Usa la resolución, colores, fuentes y tamaños de tu <code>gui.rpy</code>, así que se parece mucho a lo que verás en el juego. No reproduce transiciones ni animaciones.</p>
  <p>Arrastra el borde inferior para hacerla más alta o más baja.</p>
  <h3>Vista previa del código</h3>
  <p>Muestra el código de Ren'Py que generan tus bloques. Puedes <strong>editarlo directamente</strong>: los bloques se actualizan con lo que escribas. <kbd>Ctrl</kbd>+<kbd>Z</kbd> deshace y <kbd>Ctrl</kbd>+<kbd>Y</kbd> rehace. <em>Copiar código</em> lo copia al portapapeles y <em>Exportar</em> lo guarda en un archivo aparte.</p>
  <div class="man-tip"><strong>Corrector ortográfico:</strong> si lo activas en Ajustes, los textos de la historia muestran las erratas subrayadas. Haz clic derecho sobre una palabra para ver sugerencias o añadirla al diccionario.</div>
</section>

<section id="map">
  <h2>Mapa de la historia</h2>
  <p>El <strong>Mapa</strong> muestra todas las escenas (labels) como tarjetas conectadas, para ver de un vistazo cómo avanza la historia y a dónde lleva cada decisión.</p>
  <ul>
    <li>Cada tarjeta muestra el nombre del label, una miniatura de su fondo, un resumen (su primera línea o el comentario escrito tras <code>label nombre:</code>), cuántos personajes y decisiones tiene y su tamaño.</li>
    <li>Las líneas indican <strong>Jump</strong> (continua), <strong>Call</strong> (discontinua) y <strong>Decisión</strong>, con el texto de la opción y la condición si la hay.</li>
    <li>Insignias: <strong>INICIO</strong> (el label <code>start</code>), <strong>FINAL</strong> (termina el juego), <strong>NO EXISTE</strong> (hay saltos a un label que aún no has escrito) y <strong>SIN CONEXIÓN</strong> (nada lleva a esa escena). Las escenas con contenido del parche llevan la marca <em>parche</em>.</li>
    <li>Los labels con parámetros (rutinas de ayuda) no se muestran, para no llenar el mapa.</li>
  </ul>
  <h3>Moverse por el mapa</h3>
  <p>Arrastra para desplazarte y usa la rueda del ratón (o los botones <em>Acercar, Alejar</em> y <em>Ajustar</em>) para el zoom.</p>
  <h3>Panel lateral</h3>
  <ul>
    <li><strong>Escena:</strong> al hacer clic en una tarjeta ves su archivo, a qué escenas lleva y desde cuáles se llega, sus personajes y sus decisiones con lo que hace cada opción. <em>Abrir para editar</em> la carga en el editor de escenas.</li>
    <li><strong>Variables:</strong> las variables de la historia, su valor inicial, dónde cambian y dónde se consultan. Al hacer clic en una, el mapa resalta esas escenas. Si una variable no tiene valor inicial, el editor te recomienda añadir <code>default</code>.</li>
  </ul>
</section>

<section id="main-menu">
  <h2>Menú principal</h2>
  <p>Diseña el menú principal del juego sin escribir código. Activa <strong>Usar menú personalizado</strong> y ajusta:</p>
  <ul>
    <li><strong>Fondo:</strong> el original del proyecto, un color, una imagen, un GIF animado (el editor extrae sus fotogramas, porque Ren'Py no reproduce GIF) o un vídeo (recomendado WebM).</li>
    <li><strong>Capa superior:</strong> el panel lateral oscuro del menú original y un oscurecimiento del fondo.</li>
    <li><strong>Título</strong> y <strong>versión:</strong> texto, tamaño, fuente, color, contorno y posición.</li>
    <li><strong>Botones:</strong> cuáles se muestran (Empezar, Cargar, Opciones, Acerca de, Ayuda, Salir), disposición vertical u horizontal, alineación, separación, colores y fondo. Cada botón puede ser de texto, de imagen o de texto con imagen de fondo, y puede tener una <em>posición propia</em>.</li>
    <li><strong>Música</strong> del menú, de la carpeta <code>game/audio</code>.</li>
  </ul>
  <p>En la vista previa puedes <strong>arrastrar</strong> el título y los botones para colocarlos. <em>Guardar</em> lo escribe en el proyecto, <em>Probar en Ren'Py</em> abre el juego, <em>Restablecer</em> vuelve a los valores iniciales y <em>Cancelar cambios</em> descarta lo que no hayas guardado.</p>
  <h3>Fuentes</h3>
  <p>Las fuentes se copian dentro del juego, así que solo se ofrecen las que tienen una <strong>licencia libre</strong> que permite distribuirlas. La mayoría de las fuentes del sistema (Arial, Calibri…) no lo permiten. Usa <em>Fuentes libres (Google Fonts)</em> para conseguir más.</p>
</section>

<section id="gui">
  <h2>Interfaz del juego</h2>
  <p>Cambia el aspecto de la interfaz del juego (lo que define <code>gui.rpy</code>) viendo el resultado al momento. La vista previa tiene tres pestañas: <strong>Diálogo</strong>, <strong>Elección</strong> y <strong>Menú del juego</strong>; los ajustes de la izquierda se filtran según la pestaña.</p>
  <ul>
    <li><strong>Texto general:</strong> fuentes y tamaños del diálogo, de los nombres y de los menús; colores; color de acento; <em>velocidad del texto</em> (letras por segundo; 0 = todo de golpe).</li>
    <li><strong>Caja de diálogo</strong> y <strong>Nombre del personaje:</strong> altura, posición y ancho del texto, alineación y la caja del nombre.</li>
    <li><strong>Botones de elección</strong> y <strong>Menús del juego:</strong> tamaños, colores normal, al pasar el ratón y seleccionado, y fondos.</li>
  </ul>
  <p>Para cada imagen (caja de diálogo, caja del nombre, botones, fondo de los menús) eliges entre <strong>Actual</strong> (la que ya tiene el proyecto), <strong>Imagen propia</strong> o <strong>Color y forma</strong> (el editor la genera con el color, opacidad, esquinas redondeadas y margen que elijas). Antes de sustituir una imagen por primera vez, guarda la original en <code>gui/editor_backup</code>.</p>
  <p>En la vista previa puedes <strong>arrastrar</strong> la caja de diálogo, el nombre y los botones para moverlos y cambiar su tamaño.</p>
  <h3>Fuentes de Google</h3>
  <p><em>Fuentes de Google…</em> abre un catálogo de fuentes con licencia SIL Open Font License, que puedes usar y distribuir con tu juego. Al añadir una, se descarga en la carpeta <code>fonts</code> del proyecto junto con su licencia. También puedes añadir una fuente desde un archivo.</p>
  <p><em>Guardar</em> escribe solo los valores que has cambiado; <em>Cancelar cambios</em> descarta lo que no hayas guardado.</p>
</section>

<section id="game-settings">
  <h2>Ajustes del juego</h2>
  <h3>General</h3>
  <ul>
    <li><strong>Nombre del juego</strong> y <strong>Versión</strong> (<code>config.name</code> y <code>config.version</code>).</li>
    <li><strong>Nombre de los archivos</strong> (<code>build.name</code>): sin espacios ni acentos; se usa para los archivos que crea la compilación. Sigue al nombre del juego hasta que lo cambias a mano.</li>
    <li><strong>Icono del juego:</strong> elige una imagen (mejor cuadrada, de 512×512 o más) y el editor crea el icono de la ventana y los iconos de Windows (<code>icon.ico</code>) y Mac (<code>icon.icns</code>).</li>
  </ul>
  <p>La carpeta de las partidas guardadas no cambia al cambiar el nombre, para que los jugadores no pierdan sus partidas al actualizar el juego.</p>
  <h3>Parche</h3>
  <p>Ver <a href="#patch">Parches</a>.</p>
</section>

<section id="build">
  <h2>Compilar el juego</h2>
  <p><strong>Compilar juego</strong> crea los archivos que otras personas pueden descargar y jugar sin tener Ren'Py. Elige los sistemas:</p>
  <ul>
    <li><strong>Windows</strong> (.zip), <strong>Linux</strong> (.tar.bz2) y <strong>Mac</strong> (aplicación comprimida en .zip).</li>
    <li><strong>Windows y Linux juntos:</strong> un solo .zip para los dos.</li>
    <li><strong>Para tiendas (itch.io, Steam…):</strong> un .zip con los tres sistemas, preparado para subirlo a una tienda.</li>
  </ul>
  <p>Elige la carpeta de destino y pulsa <em>Compilar</em>. Verás el progreso; puedes ocultar el diálogo mientras tanto (te avisará al terminar) o pararlo. Al acabar, <em>Abrir carpeta</em> te lleva a los archivos.</p>
  <p>Si tu novela tiene un parche, aquí eliges además qué versión compilar (ver <a href="#patch">Parches</a>).</p>
  <h3>Probar el juego</h3>
  <p><strong>Iniciar juego</strong>, en la barra lateral, abre tu novela con Ren'Py tal como está guardada. Si hay errores en el código, Ren'Py los mostrará al arrancar.</p>
</section>

<section id="patch">
  <h2>Parches</h2>
  <p>Algunas novelas se publican en tiendas como Steam sin parte de su contenido, y el autor ofrece ese contenido en su web como un <strong>parche</strong> que los jugadores añaden al juego. El editor lo prepara todo por ti.</p>
  <h3>1. Activar el parche</h3>
  <p>En <strong>Ajustes del juego → Parche</strong>, activa <em>Esta novela tiene un parche</em>, ponle nombre y escribe las instrucciones para los jugadores (se incluyen en el parche como un archivo de texto). A la derecha ves qué incluye el parche y los posibles problemas.</p>
  <h3>2. Marcar el contenido del parche</h3>
  <ul>
    <li><strong>Bloque «Contenido del parche»</strong> (grupo <em>Parche</em> de la paleta). Tiene dos partes:
      <ul>
        <li><strong>Con parche:</strong> los bloques que solo ve quien tiene el parche. Se guardan aparte, en <code>game/patch/</code>.</li>
        <li><strong>Sin parche:</strong> lo que ve quien juega sin él (por ejemplo, en Steam). Puede quedarse vacío: entonces la historia sigue sin más.</li>
      </ul>
      Para guardar contenido del parche, la escena tiene que tener un <em>Label destino</em>.</li>
    <li><strong>Imágenes:</strong> con <em>Elegir imágenes del parche…</em> marcas las que solo van en el parche. El editor las mueve a <code>images/patch/</code> junto con su declaración. Desmarcarlas las devuelve al juego.</li>
  </ul>
  <p>En la vista previa de la escena aparece el selector <strong>Sin parche / Con parche</strong> para ver las dos versiones, y en el mapa las escenas con contenido del parche llevan su marca.</p>
  <h3>3. Compilar</h3>
  <p>En <strong>Compilar juego</strong> eliges:</p>
  <ul>
    <li><strong>Juego sin parche + parche aparte:</strong> para Steam. El juego sale sin el contenido del parche (ni siquiera bloqueado) y el parche en un .zip aparte, con su contenido empaquetado y sin código legible, más las instrucciones.</li>
    <li><strong>Versión completa:</strong> todo en un mismo juego, para tu web o itch.io.</li>
    <li><strong>Solo el juego sin parche:</strong> para subir una actualización cuando el parche no ha cambiado.</li>
  </ul>
  <p>Antes de compilar, el editor comprueba que nada del juego depende del parche: por ejemplo, una imagen del parche que también se usa en una escena normal o un salto a una escena que solo existe en el parche.</p>
  <h3>Para los jugadores</h3>
  <p>Instalar el parche consiste en descomprimir el .zip dentro de la carpeta del juego (donde está el ejecutable). El juego lo detecta solo. En Mac, la carpeta del juego está dentro de la aplicación; si publicas para Mac, explícalo en las instrucciones.</p>
  <div class="man-note"><strong>Normas de las tiendas:</strong> antes de publicar en Steam u otra tienda, revisa sus normas sobre contenido que se añade fuera de la tienda.</div>
</section>

<section id="settings">
  <h2>Ajustes del editor</h2>
  <ul>
    <li><strong>Tema:</strong> <em>Oscuro, Claro, OLED</em> o <em>Personalizado</em>. Con el personalizado, <em>Editar colores</em> abre un editor donde eliges los colores de la interfaz y del código; los cambios se ven al momento. <em>Restablecer colores</em> vuelve a los iniciales y <em>Cancelar</em> descarta los cambios.</li>
    <li><strong>Idioma:</strong> español, inglés, alemán, francés, italiano, portugués, ruso, chino simplificado, chino tradicional y japonés.</li>
    <li><strong>Corrector ortográfico:</strong> los idiomas en los que se revisan los textos de la historia.</li>
    <li><strong>Ren'Py:</strong> qué instalación se usa, y el botón para cambiarla o instalar otra.</li>
    <li><strong>Carpeta de proyectos:</strong> dónde se crean los proyectos nuevos.</li>
    <li><strong>Conexión con Claude:</strong> ver la sección siguiente.</li>
  </ul>
</section>

<section id="claude">
  <h2>Conexión con Claude</h2>
  <p>Si usas <strong>Claude Code</strong> o <strong>Claude Desktop</strong>, puedes conectarlo al editor para pedirle cosas sobre tu novela con tus palabras: «¿qué decisiones hay en el día 2?», «enséñame cómo se ve el principio de esta escena», «añade una opción nueva en esta decisión»… Funciona con tu propia cuenta de Claude, mientras el editor está abierto.</p>
  <h3>Activarla</h3>
  <ol>
    <li>En <strong>Ajustes → Conexión con Claude</strong>, marca <em>Activar conexión</em>. Viene desactivada.</li>
    <li><strong>Claude Code:</strong> pulsa <em>Copiar comando</em> y ejecútalo una vez en una terminal.</li>
    <li><strong>Claude Desktop:</strong> pulsa <em>Añadir a Claude Desktop</em> (el editor guarda antes una copia de su configuración) y reinicia Claude Desktop.</li>
  </ol>
  <p>El estado indica si Claude está conectado y cuántas consultas ha hecho. La conexión solo acepta programas de tu propio ordenador que tengan la clave. <em>Nueva clave</em> invalida la anterior (tendrás que volver a ejecutar el comando de Claude Code) y <em>Puerto</em> te deja cambiarlo si otro programa usa el mismo.</p>
  <h3>Qué puede hacer Claude</h3>
  <ul>
    <li><strong>Consultar:</strong> el proyecto, el mapa de la historia, el código de cualquier label o archivo, los personajes, las imágenes y el audio, las variables, los ajustes de la interfaz y una revisión de errores (saltos a labels que no existen, imágenes o audios que faltan…).</li>
    <li><strong>Cambiar:</strong> escribir o editar labels y archivos, añadir personajes, fondos, ilustraciones y variables, y cambiar la interfaz o el nombre y la versión del juego.</li>
    <li><strong>Ver y enseñar:</strong> obtener una imagen de cualquier momento de una escena, abrir un label en el editor o en el mapa e iniciar el juego.</li>
  </ul>
  <h3>Cambios de Claude y deshacer</h3>
  <p>Antes de cada cambio, el editor guarda una copia de los archivos afectados y lo apunta en <strong>Cambios de Claude</strong> (en la misma sección de Ajustes). Desde ahí puedes <strong>deshacer</strong> cualquier cambio; si el archivo se modificó después, te avisa antes. Cada vez que Claude cambia algo aparece un aviso, y si cambia el label que tienes abierto, el editor lo recarga (o te pregunta qué versión quieres si tenías cambios sin guardar).</p>
</section>

<section id="files">
  <h2>Qué archivos crea el editor</h2>
  <table>
    <tr><th>Archivo o carpeta</th><th>Para qué sirve</th></tr>
    <tr><td><code>characters.rpy</code>, <code>backgrounds.rpy</code>, <code>scenes.rpy</code>, <code>expressions.rpy</code></td><td>Declaraciones de personajes e imágenes</td></tr>
    <tr><td><code>animations.rpy</code>, <code>positions.rpy</code>, <code>audio.rpy</code></td><td>Animaciones, posiciones y audio</td></tr>
    <tr><td><code>gui/main_menu_custom/</code> y su <code>.rpy</code></td><td>El menú principal personalizado</td></tr>
    <tr><td><code>gui/editor_backup/</code></td><td>Las imágenes originales de la interfaz antes de cambiarlas</td></tr>
    <tr><td><code>fonts/</code></td><td>Las fuentes que añades, con su licencia</td></tr>
    <tr><td><code>patch_support.rpy</code>, <code>patch/</code>, <code>images/patch/</code></td><td>El parche (si lo activas)</td></tr>
    <tr><td><code>.renpy-editor/</code> (junto a <code>game</code>)</td><td>Ajustes del parche y las copias de los cambios de Claude. No va en el juego.</td></tr>
  </table>
</section>

<section id="report">
  <h2>Reportar un problema o sugerir algo</h2>
  <p>Si algo no funciona o echas algo en falta, pulsa <strong>Reportar o sugerir</strong> en la barra lateral. Tu mensaje le llega directamente al autor del editor.</p>
  <ul>
    <li>Elige si es <strong>un problema</strong> o <strong>una sugerencia</strong>, ponle un título y cuéntalo con detalle. En un problema ayuda mucho explicar qué hacías, qué esperabas y qué pasó.</li>
    <li><strong>Tu correo</strong> es opcional: solo sirve para poder contestarte.</li>
    <li><strong>Adjuntar datos técnicos</strong> añade la versión del editor, el sistema y el idioma. Antes de enviar ves exactamente qué se incluye; tu novela y tus archivos nunca se envían.</li>
  </ul>
  <p>Si no hay conexión, puedes <em>Copiar el mensaje</em> para enviarlo de otra forma.</p>
</section>

<section id="troubleshooting">
  <h2>Problemas frecuentes</h2>
  <dl>
    <dt>«Ren'Py es necesario» o el juego no se inicia</dt>
    <dd>Comprueba en Ajustes → Ren'Py que la ruta apunta a tu <code>renpy.exe</code>, o usa <em>Cambiar o instalar</em>.</dd>
    <dt>Un personaje o fondo no aparece en los selectores</dt>
    <dd>Tiene que estar declarado en la ventana <a href="#declarations">Declaraciones</a> (o en los archivos de declaraciones del editor).</dd>
    <dt>La vista previa muestra un recuadro con el nombre de una imagen</dt>
    <dd>Esa imagen no está declarada o su archivo no existe. El mapa y la revisión de Claude también te ayudan a encontrar estos casos.</dd>
    <dt>No encuentro una fuente instalada</dt>
    <dd>Solo se muestran las fuentes con licencia libre, porque se copian dentro del juego. Busca una parecida en Fuentes de Google.</dd>
    <dt>He perdido cambios de un label</dt>
    <dd>Guardar en archivo sustituye el contenido del label destino. Si el cambio lo hizo Claude, puedes deshacerlo en <em>Cambios de Claude</em>.</dd>
  </dl>
</section>
`
};
