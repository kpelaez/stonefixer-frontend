# StoneFixer — Frontend

> Interfaz web de la plataforma StoneFixer construida con **React 19 + TypeScript + Vite + TailwindCSS 4**.

---

## Stack tecnológico

| Capa | Tecnología |
|------|-----------|
| Framework | React 19 |
| Lenguaje | TypeScript 5.7 |
| Build tool | Vite 6 |
| Estilos | TailwindCSS 4 |
| Routing | React Router DOM 7 |
| Estado global | Zustand 5 |
| Formularios | React Hook Form + Zod |
| HTTP | Axios |
| Tablas | TanStack Table v8 |
| Calendario | FullCalendar 6 |
| Gráficos | Recharts 3 |
| Iconos | Lucide React |
| Notificaciones | React Hot Toast |
| Fechas | date-fns |
| Excel export | xlsx (SheetJS) |

---

## Estructura del proyecto

```
stonefixer-frontend/
├── public/
│   └── favicon.ico
├── src/
│   ├── assets/                        # Imágenes, logos, fuentes
│   ├── components/
│   │   ├── Layout/
│   │   │   ├── CollapsedSidebar.tsx   # ⚠️ unificar con Sidebar.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   └── AppLayout.tsx          # Layout wrapper principal
│   │   ├── ui/                        # Componentes atómicos reutilizables
│   │   │   ├── Button.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── Table.tsx
│   │   │   └── ...
│   │   └── shared/                    # Componentes de negocio compartidos
│   ├── config/
│   │   └── api.ts                     # Base URL y constantes de API
│   ├── hooks/                         # Custom hooks
│   │   ├── useAuth.ts
│   │   └── ...
│   ├── pages/
│   │   ├── LoginPage.tsx
│   │   ├── HomePage.tsx
│   │   ├── AboutPage.tsx              # ⚠️ contenido desactualizado
│   │   ├── dashboards/
│   │   ├── inventory/
│   │   ├── shifts/
│   │   ├── overtime/
│   │   └── teams/
│   ├── services/                      # Llamadas a la API (1 archivo por módulo)
│   │   ├── authService.ts
│   │   ├── techAssetService.ts
│   │   ├── businessIndicatorService.ts
│   │   └── ...
│   ├── stores/                        # Estado global con Zustand
│   │   └── authStore.ts
│   ├── types/                         # Tipos e interfaces TypeScript
│   │   ├── businessIndicators.ts
│   │   └── ...
│   ├── utils/                         # Funciones utilitarias puras
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── .env.development
├── .env.production
├── .env.example
├── .gitignore
├── eslint.config.js
├── tsconfig.json
├── tsconfig.app.json
├── tsconfig.node.json
├── vite.config.ts
├── package.json
└── README.md
```

---

## Instalación

### 1. Instalar dependencias

```bash
npm install
```

### 2. Configurar variables de entorno

```bash
cp .env.example .env.development
```

`.env.development`:
```env
VITE_API_URL=http://localhost:8000
```

`.env.production`:
```env
VITE_API_URL=https://stonefixer.mklcoders.com.ar
```

### 3. Iniciar en desarrollo

```bash
npm run dev
# Disponible en http://localhost:5173
```

### 4. Build de producción

```bash
npm run build
npm run preview   # para probar el build localmente
```

---

## Scripts disponibles

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Servidor de desarrollo con HMR |
| `npm run build` | Build de producción (TypeScript + Vite) |
| `npm run preview` | Previsualizar el build |
| `npm run lint` | Linting con ESLint |

---

## Módulos de la aplicación

### Autenticación
- Login con JWT
- Persistencia de sesión con Zustand
- Guards de rutas por rol

### Inventario Tecnológico (`/inventory`)
- Dashboard con métricas (valor total, activos disponibles, en mantenimiento)
- CRUD de activos tecnológicos con TanStack Table
- Gestión de asignaciones a empleados
- Gestión de mantenimientos preventivos y correctivos
- Vista "Mis activos" para usuarios finales
- Exportación a Excel

### Programación de Turnos (`/shifts`)
- Calendario mensual con FullCalendar
- Asignación early/regular por usuario y departamento
- Alertas de turnos pendientes

### Horas Extra (`/overtime`)
- Solicitud de horas a compensar
- Flujo de aprobación manager → admin
- Balance por usuario

### Indicadores de Negocio (`/dashboards`)
- KPIs de facturación vs cobranza
- Historial con Recharts
- Health status de indicadores

### Sectores (`/teams`)
- Directorio de personal
- Vista por departamento

---

## Convenciones

### Nomenclatura de archivos
- Componentes React: `PascalCase.tsx`
- Hooks: `useCamelCase.ts`
- Servicios: `camelCaseService.ts`
- Tipos: `camelCase.ts`
- Stores: `camelCaseStore.ts`

### Estructura de un componente
```tsx
// 1. Imports externos
// 2. Imports internos
// 3. Types/interfaces locales
// 4. Componente
// 5. Export default
```

### Gestión de estado
- Estado del servidor: servicios con Axios (considerar migrar a TanStack Query)
- Estado global del cliente: Zustand
- Estado local del formulario: React Hook Form
- Estado local de UI: `useState`

### Llamadas a la API
Todos los servicios deben manejar errores y devolver tipos explícitos:

```typescript
export const getTechAssets = async (): Promise<TechAsset[]> => {
  const { data } = await api.get<TechAsset[]>('/api/v1/inventory/tech-assets');
  return data;
};
```

---

## Licencia

Uso interno — Departamento de Tecnología. Todos los derechos reservados.
