# Documentación del Proyecto: ReportesWeb

Este documento proporciona una visión general detallada del proyecto **ReportesWeb**, su arquitectura, componentes y funcionalidad. Está diseñado para servir como referencia para desarrolladores y sistemas de IA.

## 1. Descripción General
**ReportesWeb** es una aplicación web completa diseñada para generar y visualizar reportes financieros, específicamente el reporte de **Antigüedad de Saldos (Accounts Receivable Aging)**. La aplicación permite a los usuarios autenticarse, filtrar datos por fecha y cliente, visualizar un resumen en pantalla y exportar los reportes a formatos Excel, PDF y HTML.

La aplicación se conecta a una base de datos **SQL Server** para obtener los datos transaccionales y utiliza una base de datos **SQLite** local para la gestión de usuarios y autenticación.

## 2. Stack Tecnológico

### Backend (API)
*   **Lenguaje:** Python 3.x
*   **Framework:** FastAPI (Alto rendimiento, validación de datos con Pydantic).
*   **ORM:** SQLAlchemy (para SQLite) y PyODBC (para consultas directas a SQL Server).
*   **Autenticación:** JWT (JSON Web Tokens) con `python-jose` y `passlib`.
*   **Generación de Reportes:**
    *   `openpyxl` (Excel)
    *   `reportlab` (PDF)
*   **Base de Datos:**
    *   **SQLite:** `reporter.db` (Usuarios, roles).
    *   **SQL Server:** (Datos de negocio, vista `zzReporteSaldoDocuments`).

### Frontend (Interfaz de Usuario)
*   **Lenguaje:** JavaScript (ES6+)
*   **Framework:** React 19
*   **Estilos:** CSS Vanilla (con estructura modular).
*   **Librerías Clave:**
    *   `axios`: Comunicación HTTP con el backend.
    *   `chart.js` / `react-chartjs-2`: Gráficos y visualización de datos.
    *   `react-datepicker`: Selección de fechas.
    *   `react-router-dom`: Navegación (Routing).

### Infraestructura
*   **Servidor Web / Proxy Inverso:** Caddy (Gestiona HTTPS automático y enruta tráfico entre el frontend estático y la API).
*   **Gestor de Procesos:** NSSM (Probablemente usado para correr la app como servicio de Windows).

## 3. Estructura del Proyecto

```text
c:\Proyectos\ReportesWeb\
├── Caddyfile                   # Configuración del servidor Caddy (Proxy Inverso)
├── api.log / api_debug.log     # Logs de la aplicación
├── reporter_backend/           # CÓDIGO DEL BACKEND (Python/FastAPI)
│   ├── .env                    # Variables de entorno (Credenciales BD, Secretos)
│   ├── requirements.txt        # Dependencias de Python
│   ├── reporter.db             # Base de datos local (Usuarios)
│   └── app/                    # Código fuente de la API
│       ├── main.py             # Punto de entrada (Define la App FastAPI y Middlewares)
│       ├── models.py           # Modelos SQLAlchemy (Tabla Users)
│       ├── schemas.py          # Esquemas Pydantic (Validación de Request/Response)
│       ├── crud.py             # Operaciones de Base de Datos (Crear usuario, buscar, etc.)
│       ├── security.py         # Lógica de Auth (Login, Hash passwords, JWT)
│       ├── database.py         # Configuración de conexión a SQLite
│       ├── sql_server_conn.py  # Configuración de conexión a SQL Server
│       └── reports/            # Módulo de Reportes
│           ├── receivables.py    # Lógica de negocio del reporte de Cobranza (SQL Queries)
│           ├── report_builder.py # Generadores de archivos (PDF, Excel, HTML)
│           └── report_schemas.py # Esquemas específicos para reportes
│
└── reporter_frontend/          # CÓDIGO DEL FRONTEND (React)
    ├── package.json            # Dependencias de Node.js
    ├── public/                 # Archivos estáticos públicos
    └── src/                    # Código fuente React
        ├── App.js              # Componente raíz y configuración de Rutas
        ├── index.js            # Punto de entrada de React
        ├── components/         # Componentes reutilizables (Botones, Tablas, Inputs)
        ├── context/            # Contexto de React (AuthContext para manejo de sesión)
        └── assets/             # Imágenes y estilos globales
```

## 4. Detalle del Backend

### Autenticación (`app/security.py`)
*   Implementa OAuth2 con Password Flow.
*   **Endpoints:**
    *   `POST /api/token`: Inicia sesión y devuelve un JWT.
    *   `POST /api/users/`: Registro de nuevos usuarios.
    *   `GET /api/users/me`: Obtiene datos del usuario actual.
*   **Roles:** Soporta usuarios normales y administradores (`is_admin`). Los usuarios nuevos requieren aprobación (`is_active`).

### Reportes (`app/reports/receivables.py`)
*   **Fuente de Datos:** Consulta la vista `zzReporteSaldoDocuments` en SQL Server.
*   **Lógica de Negocio:**
    *   Calcula la antigüedad de la deuda (`days_since`) basándose en la fecha de corte (`as_of`).
    *   Clasifica las deudas en "Buckets": *Not Due, 0-21, 22-30, 31-45, 45+*.
    *   Agrupa por moneda (USD, MXN, etc.).
*   **Endpoints:**
    *   `GET /api/reports/filters/customers`: Lista de clientes para el filtro.
    *   `POST /api/reports/receivables-preview`: Devuelve datos JSON para la tabla/gráficos.
    *   `POST /api/reports/receivables-download-excel`: Descarga .xlsx.
    *   `POST /api/reports/receivables-download-pdf`: Descarga .pdf.
    *   `POST /api/reports/receivables-download-html`: Descarga .html.

## 5. Detalle del Frontend

La aplicación React es una SPA (Single Page Application).
*   **Autenticación:** Manejada probablemente vía `AuthContext`. Almacena el token JWT y lo envía en cada petición (Header `Authorization: Bearer ...`).
*   **Navegación:** Rutas protegidas que redirigen al Login si no hay sesión.
*   **Dashboard:**
    *   Muestra filtros de fecha y cliente.
    *   Llama a la API para obtener datos.
    *   Renderiza gráficas (Chart.js) y tablas de resumen.
    *   Botones para descargar los reportes en diferentes formatos.

## 6. Configuración de Caddy (`Caddyfile`)
El archivo `Caddyfile` orquesta el despliegue local:
1.  Sirve el frontend compilado (`reporter_frontend/build`) en el puerto 80.
2.  Redirige las peticiones que empiezan con `/api/*` hacia el backend (`127.0.0.1:8000`).
3.  Maneja el enrutamiento del lado del cliente (SPA) redirigiendo rutas desconocidas a `index.html`.

## 7. Base de Datos (Esquemas)

### Tabla `users` (SQLite)
| Columna | Tipo | Descripción |
| :--- | :--- | :--- |
| `id` | Integer | PK |
| `username` | String | Nombre de usuario único |
| `hashed_password` | String | Hash seguro (Bcrypt) |
| `first_name` | String | Nombre |
| `last_name` | String | Apellido |
| `is_active` | Boolean | Si puede iniciar sesión |
| `is_admin` | Boolean | Si tiene privilegios de admin |
| `last_login` | DateTime | Última vez que ingresó |

### Vista `zzReporteSaldoDocuments` (SQL Server)
Se espera que esta vista exista en la BD SQL Server y contenga columnas como:
*   `Cliente`, `Modulo`, `InvoiceDate`, `Folio`, `ArrivalDate`, `Vencimiento`, `Referencia`, `Moneda`, `TC`, `SubTotal`, `Total`, `Pagado`, `Saldo`.

---
*Generado automáticamente por Antigravity Assistant el 21 de Noviembre de 2025.*
