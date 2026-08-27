# FuelIQ ⛽✨

**FuelIQ** es una aplicación web inteligente diseñada para encontrar **cuál es la gasolinera más barata para ti**, teniendo en cuenta no solo el precio oficial de surtidor, sino tus tarjetas de fidelización (Waylet, Cepsa Gow, BPme, ChequeAhorro Carrefour, Ballenoil, etc.), tus cupones activos, la distancia y el coste real de llenar tu depósito.

Inspirada en el look & feel neo-banking de **Revolut** e impulsada por **HeroUI**, **Next.js 16 (App Router)**, **Leaflet** y **Neon PostgreSQL con Prisma**.

---

## 🚀 Características Principales

- **Datos Oficiales MITECO en Tiempo Real**: Sincronización automática de más de 11.400 estaciones de servicio y precios en toda España.
- **Motor Inteligente de Descuentos & Cupones**:
  - Descuentos directos en €/L, porcentajes (%) y cashback acumulado.
  - Soporte para **cupones acumulables de Repsol Waylet** (ej. 10 cts/L general + 5 cts/L extra en Efitec 98 / Diésel Renovable).
  - Programas preconfigurados: Repsol Waylet, Cepsa Gow / Moeve, BPme Rewards, ChequeAhorro Carrefour 8%, Club Ballenoil DNI, Plenoil App, Petroprix App, Tarjeta Alcampo Oney, Mutua Madrileña, etc.
- **Buscador Inteligente por Código Postal (CP), Ciudad o GPS**:
  - Búsqueda instantánea con autocompletado en más de 8.000 municipios y códigos postales de España.
  - Detección de ubicación por GPS con 1 clic.
- **Mapa Panorámico sin Marcas de Agua (OpenStreetMap)**:
  - Pines con distintivos de marca oficiales (`REPSOL`, `CEPSA`, `BP`, `SHELL`, `GALP`, `AUTONET`, `PLENOIL`, etc.) y precios calculados.
  - Sincronización bidireccional: al hacer clic en un pin, la vista se desplaza a la tarjeta de la gasolinera; al hacer clic en una tarjeta, el mapa vuela con zoom a la estación.
- **Modo Claro / Modo Oscuro**:
  - Conmutador en tiempo real con persistencia en `localStorage`.
  - Estética Revolut con acabados en cristal, microbordes translúcidos y acentos verde esmeralda neón.
- **Comparador Rápido de Estaciones**:
  - Comparativa lado a lado de hasta 3 gasolineras para evaluar el coste final de tu depósito y el ahorro neto.

---

## 🛠️ Stack Tecnológico

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router, Turbopack, React 19, TypeScript)
- **Componentes & UI**: [HeroUI](https://heroui.com/) (`@heroui/react`), [Tailwind CSS](https://tailwindcss.com/), [Framer Motion](https://www.framer.com/motion/)
- **Iconos**: [Lucide React](https://lucide.dev/)
- **Mapas**: [Leaflet](https://leafletjs.com/) con teselas libres de OpenStreetMap
- **Base de Datos & ORM**: [Neon PostgreSQL](https://neon.tech/) con [Prisma ORM 6](https://www.prisma.io/)

---

## 📦 Instalación y Puesta en Marcha

### 1. Clonar el repositorio
```bash
git clone https://github.com/AlvaroDesigns/fuelIQ.git
cd fuelIQ
```

### 2. Instalar dependencias
```bash
npm install
```

### 3. Configurar variables de entorno
Crea un archivo `.env` basado en `.env.example`:
```env
DATABASE_URL="postgresql://usuario:password@ep-host.us-east-2.aws.neon.tech/neondb?sslmode=require"
PORT=3001
```

### 4. Ejecutar migraciones de Prisma
```bash
npx prisma db push
```

### 5. Iniciar en desarrollo
```bash
npm run dev
```

Abre [http://localhost:3001](http://localhost:3001) en tu navegador.

---

## 📜 Licencia

Distribuido bajo la licencia MIT. Consulta `LICENSE` para más información.
