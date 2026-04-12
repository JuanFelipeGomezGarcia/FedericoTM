# Federico TM - Gestión de Torneos de Tenis de Mesa

Aplicación web completa para la gestión de torneos de tenis de mesa con round robin y eliminación directa.

## Características

- Gestión completa de torneos
- Sistema de round robin con distribución zig-zag
- Lógica avanzada de desempate
- Llaves de eliminación con seeding estándar
- Actualizaciones en tiempo real
- Panel de administración
- Interfaz moderna y responsive

## Stack Tecnológico

- **Frontend**: Next.js 14, React, TypeScript, TailwindCSS, shadcn/ui
- **Backend**: Next.js API Routes, Node.js 22
- **Base de Datos**: PostgreSQL
- **Tiempo Real**: Socket.io
- **Despliegue**: Microsoft Azure App Services

## Instalación Local

### Prerrequisitos

- Node.js 22 LTS
- PostgreSQL
- Git

### Pasos

1. Clona el repositorio:
   ```bash
   git clone https://github.com/tuusuario/FedericoTM.git
   cd FedericoTM
   ```

2. Instala dependencias:
   ```bash
   npm install
   ```

3. Configura la base de datos PostgreSQL:
   - Crea una base de datos llamada `federico_tm`
   - Ejecuta el script SQL:
     ```bash
     psql -d federico_tm -f schema.sql
     ```

4. Configura variables de entorno:
   Copia `.env.local` y ajusta:
   ```
   DATABASE_URL=postgresql://usuario:password@localhost:5432/federico_tm
   ADMIN_USER=admin
   ADMIN_PASS=tu_password_seguro
   ```

5. Ejecuta la aplicación:
   ```bash
   npm run dev
   ```

   Abre http://localhost:3000

## Despliegue en Azure

### 1. Crear App Service

1. Ve a Azure Portal
2. Crea un nuevo App Service
3. Elige Node.js 22 LTS
4. Configura el plan de servicio

### 2. Configurar Base de Datos

1. Crea una PostgreSQL Flexible Server en Azure
2. Ejecuta el script `schema.sql` en la base de datos
3. Configura la cadena de conexión en las variables de entorno del App Service

### 3. Variables de Entorno en Azure

En App Service > Configuración > Variables de entorno:
- `DATABASE_URL`: Tu cadena de conexión PostgreSQL
- `ADMIN_USER`: Usuario admin
- `ADMIN_PASS`: Password admin
- `NODE_ENV`: production

### 4. Desplegar

1. Push el código a GitHub
2. Conecta el App Service a GitHub para despliegue automático
3. O usa Azure CLI:
   ```bash
   az webapp up --name tu-app-name --resource-group tu-resource-group --runtime "NODE:22-lts"
   ```

## Estructura del Proyecto

```
src/
├── app/
│   ├── admin/          # Panel de administración
│   ├── api/            # API routes
│   ├── tournament/     # Páginas de torneos
│   ├── layout.tsx      # Layout principal
│   └── page.tsx        # Home
├── components/
│   ├── ui/             # Componentes shadcn/ui
│   └── ...             # Componentes personalizados
└── lib/
    ├── db.ts           # Conexión a BD
    └── utils.ts        # Utilidades
```

## API Endpoints

- `GET/POST /api/tournaments` - Gestión de torneos
- `GET/POST /api/categories` - Gestión de categorías
- `GET/POST /api/matches` - Gestión de partidos
- `POST /api/auth/login` - Autenticación admin

## Lógica de Torneo

### Round Robin
- Distribución zig-zag de jugadores
- Cálculo automático de posiciones
- Desempate por cara a cara, coeficiente sets, o manual

### Eliminación Directa
- Seeding estándar (1vs16, 8vs9, etc.)
- Manejo de BYEs
- Actualización automática de llaves

## Contribución

1. Fork el proyecto
2. Crea una rama para tu feature
3. Commit tus cambios
4. Push y crea un Pull Request

## Licencia

Este proyecto está bajo la Licencia MIT.