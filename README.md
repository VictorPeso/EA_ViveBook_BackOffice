# EA ViveBook BackOffice

BackOffice desarrollado con **Angular** para la gestión de **Libros**, **Autores** y **Usuarios**, conectado a una **API REST** en `http://localhost:1337`.

El proyecto permite:

- listar elementos no eliminados de cada categoría
- crear nuevos elementos
- editar elementos existentes
- realizar borrado lógico mediante `IsDeleted: true`
- navegar entre secciones desde una topbar
- paginar resultados en bloques de 5 elementos

---

## Tecnologías utilizadas

- **Angular**
- **TypeScript**
- **RxJS**
- **Reactive Forms**
- **REST API**
- **SCSS/CSS**
- **JOI** en backend para validación

---

## Instalación

Para instalar las dependencias del proyecto:

```bash
npm install
```

---

## Ejecución en desarrollo

Para iniciar la aplicación en local:

```bash
ng serve
```

Después, abre el navegador en la URL habitual de Angular:

```text
http://localhost:4200
```

---

## Requisitos previos

Antes de arrancar el frontend, asegúrate de que:

- Node.js y npm están instalados
- la API REST está en ejecución en:

```text
http://localhost:1337
```

---

## Funcionalidades principales

### Libros

- listado de libros no eliminados
- creación de libros
- edición de libros
- asociación de autores
- borrado lógico con `IsDeleted`

### Autores

- listado de autores no eliminados
- creación de autores
- edición de autores
- borrado lógico con `IsDeleted`

### Usuarios

- listado de usuarios no eliminados
- creación de usuarios
- edición de usuarios
- asociación de libros
- borrado lógico con `IsDeleted`

---

## Comportamiento de la interfaz

Cada sección del BackOffice sigue la misma estructura:

- **columna izquierda**: formulario de creación/edición
- **columna derecha**: listado paginado de elementos
- **topbar fija**: navegación entre Libros, Autores y Usuarios

Además:

- al seleccionar un elemento de la lista, sus datos se cargan en el formulario
- al crear uno nuevo, el formulario entra en modo creación
- el borrado no hace `DELETE`; realiza un `PUT` actualizando `IsDeleted: true`

---

## Validación

El frontend está adaptado a las reglas de validación del backend definidas con **JOI**.

### Reglas principales

#### Libro

- `isbn`: obligatorio en creación
- `title`: obligatorio en creación
- `authors`: opcional
- `IsDeleted`: opcional

#### Autor

- `fullName`: obligatorio en creación
- `IsDeleted`: opcional

#### Usuario

- `name`: obligatorio en creación
- `email`: obligatorio en creación
- `password`: obligatorio en creación
- `password`: mínimo 6 caracteres
- `libros`: opcional
- `IsDeleted`: opcional

---

## Estructura del proyecto

```text
src/
└── app/
    ├── core/
    │   ├── models/
    │   │   ├── autor.model.ts
    │   │   ├── libro.model.ts
    │   │   └── usuario.model.ts
    │   └── services/
    │       ├── autores.service.ts
    │       ├── libros.service.ts
    │       └── usuarios.service.ts
    │
    ├── features/
    │   ├── autores/
    │   │   ├── components/
    │   │   │   ├── autor-form/
    │   │   │   │   ├── autor-form.component.ts
    │   │   │   │   ├── autor-form.component.html
    │   │   │   │   └── autor-form.component.css
    │   │   │   └── autores-list/
    │   │   │       ├── autores-list.component.ts
    │   │   │       ├── autores-list.component.html
    │   │   │       └── autores-list.component.css
    │   │   └── pages/
    │   │       └── autores-page/
    │   │           ├── autores-page.component.ts
    │   │           ├── autores-page.component.html
    │   │           └── autores-page.component.css
    │   │
    │   ├── libros/
    │   │   ├── components/
    │   │   │   ├── libro-form/
    │   │   │   │   ├── libro-form.component.ts
    │   │   │   │   ├── libro-form.component.html
    │   │   │   │   └── libro-form.component.css
    │   │   │   └── libros-list/
    │   │   │       ├── libros-list.component.ts
    │   │   │       ├── libros-list.component.html
    │   │   │       └── libros-list.component.css
    │   │   └── pages/
    │   │       └── libros-page/
    │   │           ├── libros-page.component.ts
    │   │           ├── libros-page.component.html
    │   │           └── libros-page.component.css
    │   │
    │   └── usuarios/
    │       ├── components/
    │       │   ├── usuario-form/
    │       │   │   ├── usuario-form.component.ts
    │       │   │   ├── usuario-form.component.html
    │       │   │   └── usuario-form.component.css
    │       │   └── usuarios-list/
    │       │       ├── usuarios-list.component.ts
    │       │       ├── usuarios-list.component.html
    │       │       └── usuarios-list.component.css
    │       └── pages/
    │           └── usuarios-page/
    │               ├── usuarios-page.component.ts
    │               ├── usuarios-page.component.html
    │               └── usuarios-page.component.css
    │
    ├── shared/
    │   └── components/
    │       └── topbar/
    │           ├── topbar.component.ts
    │           ├── topbar.component.html
    │           └── topbar.component.css
    │
    ├── app.component.ts
    ├── app.component.html
    ├── app.component.css
    ├── app.config.ts
    └── app.routes.ts
```

---

## Rutas principales del frontend

- `/libros`
- `/autores`
- `/usuarios`

---

## Conexión con backend

Los servicios Angular están preparados para consumir la API REST en:

```text
http://localhost:1337
```

### Endpoints usados

#### Libros

- `GET /libros`
- `GET /libros/all`
- `GET /libros/:libroId`
- `POST /libros`
- `PUT /libros/:libroId`

#### Autores

- `GET /autores`
- `GET /autores/all`
- `GET /autores/:autorId`
- `POST /autores`
- `PUT /autores/:autorId`

#### Usuarios

- `GET /usuarios`
- `GET /usuarios/all`
- `GET /usuarios/:usuarioId`
- `POST /usuarios`
- `PUT /usuarios/:usuarioId`

---

## Paginación

Actualmente la paginación se realiza en frontend:

- 5 elementos por página
- navegación mediante botones de anterior y siguiente
- separación por categorías

Esto permite mantener la lógica simple mientras el volumen de datos siga siendo razonable.

---

## Borrado lógico

El sistema no elimina físicamente los registros desde el frontend.

En su lugar, cuando se pulsa el botón de borrar:

- se envía un `PUT`
- se actualiza el campo:

```json
{
  "IsDeleted": true
}
```

Después, el elemento deja de aparecer en los listados normales, ya que estos usan los endpoints que filtran por elementos no eliminados.

---

## Posibles mejoras futuras

- paginación real desde backend
- búsqueda y filtros por campos
- ordenación por columnas
- mensajes de error más detallados
- gestión de autenticación y autorización
- ocultar passwords en los listados de usuarios
- mejoras visuales responsive adicionales

---

## Notas

- El proyecto está pensado como BackOffice profesional y funcional.
- La lógica está organizada por dominio (`libros`, `autores`, `usuarios`) para facilitar mantenimiento y escalabilidad.
- Los formularios están sincronizados con la validación JOI del backend.

---

## Autor

Proyecto desarrollado para la gestión BackOffice de ViveBook.
