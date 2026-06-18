# EA ViveBook BackOffice

BackOffice administrativo de ViveBook desarrollado con Angular y TypeScript.

Este proyecto permite gestionar desde una interfaz web los modelos principales del sistema, consumir la API REST del Backend, consultar estadisticas de Matomo y administrar datos con una arquitectura visual reutilizable.

## Tabla de contenido

- [Objetivo del proyecto](#objetivo-del-proyecto)
- [Tecnologias principales](#tecnologias-principales)
- [Arquitectura funcional](#arquitectura-funcional)
- [Modelos administrables](#modelos-administrables)
- [Estructura del proyecto](#estructura-del-proyecto)
- [Componentes compartidos](#componentes-compartidos)
- [Configuracion de entorno](#configuracion-de-entorno)
- [Instalacion local](#instalacion-local)
- [Ejecucion en desarrollo](#ejecucion-en-desarrollo)
- [Autenticacion y autorizacion](#autenticacion-y-autorizacion)
- [Listados administrativos](#listados-administrativos)
- [Editores administrativos](#editores-administrativos)
- [Toasts y mensajes](#toasts-y-mensajes)
- [Estadisticas Matomo](#estadisticas-matomo)
- [Docker y despliegue](#docker-y-despliegue)
- [Workflow de GitHub Actions](#workflow-de-github-actions)
- [Calidad de codigo](#calidad-de-codigo)
- [Relacion con el Backend](#relacion-con-el-backend)
- [Resolucion de problemas](#resolucion-de-problemas)

## Objetivo del proyecto

El BackOffice centraliza la administracion interna de ViveBook.

Permite a los administradores:

- Iniciar sesion con credenciales administrativas.
- Consultar estadisticas de ViveBook.
- Listar, buscar y paginar entidades.
- Crear nuevos registros.
- Editar informacion existente.
- Activar o desactivar registros mediante `IsDeleted`.
- Eliminar registros definitivamente cuando el modulo lo permite.
- Gestionar relaciones entre modelos desde formularios avanzados.
- Recibir mensajes visuales de exito, error, aviso o informacion.

La interfaz esta disenada para ser escalable: los listados y formularios comparten componentes base reutilizables, evitando duplicacion por modelo.

## Tecnologias principales

- Angular `21`.
- TypeScript `5.9`.
- RxJS.
- Angular Forms y Reactive Forms.
- Angular CDK.
- Angular Material.
- Angular Router.
- CSS global centralizado.
- Docker multi-stage build.
- Nginx para servir la aplicacion construida.
- ESLint.
- Prettier.
- Husky.
- Vitest configurado como dependencia de desarrollo.

## Arquitectura funcional

El proyecto sigue una organizacion por dominios:

- `Core`: modelos y servicios compartidos.
- `features`: pantallas y componentes de cada modulo.
- `shared`: componentes reutilizables de interfaz.
- `public/env.js`: configuracion runtime usada por el navegador.

El BackOffice consume endpoints administrativos del Backend, normalmente bajo rutas `/admin/...`, y delega la autorizacion real al Backend mediante JWT.

## Modelos administrables

Actualmente el BackOffice gestiona:

- Estadisticas.
- Autor.
- Evento.
- Libreria.
- Libro.
- Post.
- Reserva.
- Reto.
- Usuario.
- Valoracion.

Cada modelo tiene su propia feature, pero comparte piezas comunes para listados, paginacion, formularios y notificaciones.

## Estructura del proyecto

```text
EA_ViveBook_BackOffice/
+-- angular.json
+-- package.json
+-- Dockerfile
+-- nginx.conf
+-- public/
|   +-- env.js
+-- src/
    +-- app/
    |   +-- Core/
    |   |   +-- models/
    |   |   +-- services/
    |   +-- features/
    |   |   +-- auth/
    |   |   +-- autores/
    |   |   +-- eventos/
    |   |   +-- librerias/
    |   |   +-- libros/
    |   |   +-- matomo/
    |   |   +-- posts/
    |   |   +-- reservas/
    |   |   +-- retos/
    |   |   +-- usuarios/
    |   |   +-- valoraciones/
    |   +-- shared/
    |   |   +-- components/
    |   |       +-- admin-editor/
    |   |       +-- admin-list/
    |   |       +-- admin-pagination/
    |   |       +-- toast/
    |   |       +-- topbar/
    |   +-- app.routes.ts
    |   +-- app.config.ts
    +-- environments/
    +-- styles.css
    +-- material-theme.scss
```

## Componentes compartidos

### `AdminListComponent`

Componente reutilizable para listados administrativos.

Responsabilidades:

- Mostrar cabecera de listado.
- Gestionar buscador.
- Seleccionar campo de busqueda.
- Emitir cambios de consulta.
- Integrar paginacion compartida.
- Mostrar boton de creacion cuando aplica.
- Mantener una estructura visual coherente entre modelos.

Usa el modelo:

```text
src/app/Core/models/admin-list.model.ts
```

### `AdminPaginationComponent`

Componente reutilizable de paginacion.

Permite:

- Avanzar una pagina.
- Retroceder una pagina.
- Abrir selector compacto de paginas.
- Seleccionar pagina directa.
- Cambiar cantidad de elementos por pagina.

Opciones de elementos por pagina:

- 5.
- 10.
- 25.
- 50.

### `AdminEditorComponent`

Componente visual compartido para formularios modales administrativos.

Caracteristicas:

- Navegacion lateral por secciones.
- Seccion `General`.
- Secciones adicionales para relaciones o arrays editables.
- Zona principal de edicion.
- Boton de cierre fijo.
- Soporte para formularios largos con scroll interno.

Se utiliza en modelos como Usuario, Libro, Evento, Autor, Post, Valoracion, Reserva, Reto y Libreria.

### `ToastComponent` y `ToastService`

Sistema global de notificaciones.

Tipos soportados:

- `success`.
- `error`.
- `warning`.
- `info`.

El servicio esta en:

```text
src/app/Core/services/toast.service.ts
```

## Configuracion de entorno

La URL del Backend se resuelve en runtime mediante:

```text
public/env.js
```

Contenido local por defecto:

```js
window.__VIVEBOOK_ENV__ = {
  apiUrl: 'http://localhost:1337',
};
```

La aplicacion lee esta configuracion desde:

```text
src/environments/environment.ts
```

Si `env.js` no define valor, se usa:

```text
http://localhost:1337
```

Esto permite:

- Usar `localhost` en desarrollo sin pasos adicionales.
- Inyectar la URL real de produccion al construir la imagen Docker.

## Instalacion local

Requisitos:

- Node.js compatible con Angular 21.
- npm.
- Backend de ViveBook levantado.

Instalar dependencias:

```bash
npm install
```

## Ejecucion en desarrollo

Levantar el servidor de Angular:

```bash
npm run start
```

Equivalente:

```bash
ng serve
```

Abrir:

```text
http://localhost:4200
```

El BackOffice local intentara conectar por defecto con:

```text
http://localhost:1337
```

Tambien existe el script:

```bash
npm run forward
```

que ejecuta Angular en el puerto `9001`.

## Autenticacion y autorizacion

El BackOffice protege las rutas administrativas mediante guard:

```text
src/app/features/auth/guards/auth.guard.ts
```

Rutas publicas:

- `/auth`
- `/auth/signup`
- `/auth/signin` redirige a `/auth`

Rutas protegidas:

- `/matomo`
- `/autores`
- `/eventos`
- `/librerias`
- `/libros`
- `/posts`
- `/reservas`
- `/retos`
- `/usuarios`
- `/valoraciones`

La sesion se gestiona desde:

```text
src/app/Core/services/auth-session.service.ts
```

El sistema contempla:

- Login.
- Registro.
- Logout.
- Persistencia de token.
- Validacion visual de sesion.
- Cierre ante respuestas `401` o `403`.
- Mensaje en login cuando la sesion expiro o fue rechazada.

La autorizacion definitiva depende del Backend y del JWT.

## Listados administrativos

Los listados migrados usan `AdminListComponent`.

Caracteristicas:

- Busqueda por texto.
- Selector de campo de busqueda.
- Paginacion reutilizable.
- Boton de creacion.
- Filas compactas.
- Campos principales por modelo.
- Estado administrativo visible.
- Accion de eliminacion definitiva cuando aplica.

Ejemplos de campos visibles:

- Usuario: nombre, email, rol, ID, estado.
- Libro: titulo, ISBN, autor, ID, estado.
- Evento: titulo, fecha, direccion, ID, estado.
- Libreria: nombre, direccion, ID, estado.
- Post: libro, propietario, precio, estado, ID.
- Valoracion: usuario, libro, puntuacion, ID.
- Reserva: usuario, libro, fechas, estado, ID.
- Reto: nombre, tipo, objetivo, fechas, ID.

## Editores administrativos

Los formularios administrativos usan `AdminEditorComponent`.

Estructura:

- Barra lateral izquierda con secciones.
- Primera seccion siempre `General`.
- Secciones adicionales para relaciones.
- Formulario principal a la derecha.
- Botones de guardar, cancelar y activar/desactivar.

Ejemplos:

- Usuario: General, Libros, Comprados, Alquilados, Favoritos, Wishlist, Preferencias, Seguidos, Notificaciones.
- Libro: General, Autores.
- Evento: General, Participantes.
- Valoracion: General, Usuario, Libro.
- Reserva: General, Usuario, Libro.
- Reto: General y relaciones del modelo.
- Libreria: General y relaciones del modelo.

Cuando una relacion se muestra como lista, cada fila puede eliminarse de la relacion sin borrar necesariamente la entidad relacionada.

## Toasts y mensajes

El sistema de toasts se monta globalmente en la aplicacion.

Debe usarse para comunicar:

- Creacion correcta.
- Actualizacion correcta.
- Eliminacion correcta.
- Errores de Backend.
- Sesion expirada o rechazada.
- Estados informativos.

Ejemplo conceptual:

```ts
this.toastService.success('Usuario actualizado correctamente');
this.toastService.error('No se pudo guardar el usuario');
```

## Estadisticas Matomo

La seccion de estadisticas esta disponible en:

```text
/matomo
```

Internamente consume:

```text
src/app/Core/services/matomo.service.ts
```

La conexion real a Matomo la gestiona el Backend. El BackOffice no debe conectarse directamente a la maquina externa de Matomo ni exponer tokens.

Si Matomo no devuelve datos, puede deberse a:

- Falta de VPN o acceso de red desde Backend.
- Token de Matomo invalido.
- Configuracion incorrecta en variables del Backend.
- Error del servicio externo.

## Docker y despliegue

El proyecto incluye un `Dockerfile` multi-stage.

Fases:

1. Instala dependencias.
2. Construye Angular.
3. Genera `env.js` con la URL publica del Backend.
4. Sirve la aplicacion estatica con Nginx.

Variable de build:

```text
BACKOFFICE_API_URL
```

Ejemplo:

```bash
docker build \
  --build-arg BACKOFFICE_API_URL=https://ea3-api.upc.edu \
  -t vivebook-backoffice-ea:latest .
```

Ejecutar imagen:

```bash
docker run -p 8080:80 vivebook-backoffice-ea:latest
```

Abrir:

```text
http://localhost:8080
```

## Workflow de GitHub Actions

El workflow esta en:

```text
.github/workflows/main.yml
```

Comportamiento:

- Se ejecuta en `main`.
- Construye y publica imagen si el commit empieza por `v`.
- Tambien puede ejecutarse manualmente con `workflow_dispatch`.
- Publica la imagen con etiqueta `latest`.

Imagen resultante:

```text
<DOCKER_HUB_USERNAME>/vivebook-backoffice-ea:latest
```

Variables/secretos necesarios:

| Nombre                    | Tipo                | Uso                         |
| ------------------------- | ------------------- | --------------------------- |
| `DOCKER_HUB_USERNAME`     | Secret              | Usuario Docker Hub.         |
| `DOCKER_HUB_ACCESS_TOKEN` | Secret              | Token de acceso Docker Hub. |
| `BACKOFFICE_API_URL`      | Repository variable | URL publica del Backend.    |

El workflow valida que `BACKOFFICE_API_URL` exista y no apunte a `localhost`.

## Calidad de codigo

Scripts disponibles:

```bash
npm run lint
npm run lint:quiet
npm run lint:fix
npm run format
npm run format:check
npm run build
npm run test
```

El hook de pre-commit ejecuta:

```bash
npm run format
npm run lint
```

Antes de abrir una PR o publicar imagen se recomienda ejecutar:

```bash
npm run format:check
npm run lint
npm run build
```

## Relacion con el Backend

El BackOffice depende del Backend de ViveBook para:

- Autenticacion.
- Autorizacion por JWT.
- CRUD administrativo.
- Busqueda y paginacion.
- Activacion/desactivacion mediante `IsDeleted`.
- Estadisticas Matomo.
- Contrato comun de respuestas.

Servicios principales:

```text
src/app/Core/services/
+-- autores.service.ts
+-- eventos.service.ts
+-- librerias.service.ts
+-- libros.service.ts
+-- matomo.service.ts
+-- posts.service.ts
+-- reservas.service.ts
+-- retos.service.ts
+-- usuarios.service.ts
+-- valoraciones.service.ts
```

Modelos principales:

```text
src/app/Core/models/
+-- autor.model.ts
+-- evento.model.ts
+-- libreria.model.ts
+-- libro.model.ts
+-- post.model.ts
+-- reserva.model.ts
+-- reto.model.ts
+-- usuario.model.ts
+-- valoracion.model.ts
```

## Rutas frontend

| Ruta            | Descripcion              |
| --------------- | ------------------------ |
| `/auth`         | Login.                   |
| `/auth/signup`  | Registro.                |
| `/matomo`       | Estadisticas.            |
| `/autores`      | Gestion de autores.      |
| `/eventos`      | Gestion de eventos.      |
| `/librerias`    | Gestion de librerias.    |
| `/libros`       | Gestion de libros.       |
| `/posts`        | Gestion de posts.        |
| `/reservas`     | Gestion de reservas.     |
| `/retos`        | Gestion de retos.        |
| `/usuarios`     | Gestion de usuarios.     |
| `/valoraciones` | Gestion de valoraciones. |

## Resolucion de problemas

### El BackOffice no conecta con el Backend

Comprobar:

- Que el Backend esta levantado.
- Que `public/env.js` apunta a la URL correcta.
- Que `src/environments/environment.ts` esta leyendo `window.__VIVEBOOK_ENV__`.
- Que CORS esta permitido en el Backend.

En local:

```js
window.__VIVEBOOK_ENV__ = {
  apiUrl: 'http://localhost:1337',
};
```

### En Docker sigue apuntando a localhost

Comprobar que la imagen fue construida con:

```bash
--build-arg BACKOFFICE_API_URL=https://ea3-api.upc.edu
```

Si se usa GitHub Actions, comprobar que existe la repository variable:

```text
BACKOFFICE_API_URL
```

### Login correcto pero vuelve a la pantalla de login

Posibles causas:

- Token no persistido.
- Token expirado.
- Backend devuelve `401` o `403`.
- Rol del usuario no autorizado.

Revisar la respuesta de `/auth` y los interceptores/servicios de sesion.

### Matomo aparece sin datos

Posibles causas:

- Backend no llega a la maquina de Matomo.
- Falta VPN o conectividad.
- Token de Matomo incorrecto.
- Servicio externo caido.
- Backend devuelve error y el BackOffice muestra estado sin datos.

### El build falla por presupuesto CSS

Angular tiene budgets configurados en `angular.json`.

Si un componente supera el limite:

- Mover estilos duplicados a `src/styles.css`.
- Reutilizar clases globales.
- Reducir CSS especifico del componente.

### El pre-commit modifica archivos

El hook ejecuta `npm run format`, por lo que Prettier puede reescribir archivos antes del commit.

Despues de ejecutar el commit, revisar:

```bash
git status
```

## Estado actual

El BackOffice esta preparado para trabajar con el Backend actual de ViveBook:

- Usa rutas administrativas.
- Tiene listados reutilizables.
- Tiene editores modales por secciones.
- Gestiona sesiones rechazadas.
- Integra toasts globales.
- Incluye estadisticas Matomo via Backend.
- Permite construccion Docker con URL de API configurable.

## Mejoras recomendadas

- Ampliar cobertura de tests unitarios para `AdminListComponent`, `AdminEditorComponent` y servicios principales.
- Documentar el contrato exacto de cada endpoint administrativo.
- Anadir pruebas de flujo para login y CRUD administrativo.
- Revisar nombres de proyecto Angular (`mini-spa`) si se quiere alinear con ViveBook.
- Valorar etiquetas versionadas de Docker ademas de `latest` para trazabilidad.
