# Banco Virtual - Dashboard Financiero Profesional

Proyecto web de finanzas personales con arquitectura modular y UI profesional.

## Stack

- **HTML5**
- **CSS3** (estilos propios + animaciones)
- **JavaScript modular (ES Modules)**
- **Bootstrap 5**
- **DataTables**
- **Chart.js**

## Estructura

```
.
├── index.html
├── README.md
├── assets
│   ├── css
│   │   ├── animations.css
│   │   └── main.css
│   └── js
│       ├── main.js
│       └── modules
│           ├── charts.js
│           ├── config.js
│           ├── metrics.js
│           ├── store.js
│           ├── table.js
│           ├── templates.js
│           ├── ui.js
│           └── utils.js
└── templates
    ├── edit-form.html
    └── kpis.html
```

## Funcionalidades

- Registro de ingresos y egresos por conceptos dinámicos.
- Tabla profesional con **DataTables** (paginación, búsqueda y orden).
- Edición y eliminación de transacciones.
- KPI cards dinámicas (Ingresos, Egresos, Balance, Ahorro).
- Gestión de presupuesto mensual con barra de progreso y alertas.
- Gráficos de comportamiento y distribución con Chart.js.
- Exportación de transacciones a CSV.
- Persistencia local usando localStorage.
- Carga de datos demo y reinicio total del panel.
- Animaciones de entrada para mejorar UX.

## Ejecución

Abre `index.html` con un servidor local.

Ejemplo:

```bash
python3 -m http.server 8000 --bind 0.0.0.0
```

Luego visita `http://127.0.0.1:8000`.
