# Sistema de Recepción de Máquinas, Pistolas y Compresores

## Descripción
Sistema de gestión para taller de reparación de equipos industriales. Control de recepción, diagnóstico, reparación y entrega.

## Tecnologías
- **Frontend:** React + Vite
- **Backend:** Python Flask
- **Base de datos:** PostgreSQL

## Requisitos
- Python 3.8+
- Node.js 16+
- PostgreSQL

## Instalación

### 1. Base de datos
```sql
CREATE DATABASE taller_maquinas;
```

### 2. Backend
```bash
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
pip install -r requirements.txt
python app.py
```
El backend corre en `http://localhost:5000`

### 3. Frontend
```bash
cd frontend
npm install
npm run dev
```
El frontend corre en `http://localhost:3000`

## Usuarios iniciales
Todos con contraseña: `123456`

| ID | Nombre | Rol |
|----|--------|-----|
| 1 | Alberto Bonetti | Gerente General |
| 2 | Eduardo Reinosa | Técnico |
| 3 | Hernán Rojas | Supervisor |
| 4 | Daniely Ochoa | Recepción / Ventas |

## Permisos por rol

### Gerente General
- Acceso total al sistema
- Crear, editar y eliminar usuarios
- Consultar todas las órdenes
- Visualizar reportes e indicadores
- Modificar configuraciones generales

### Supervisor
- Consultar todas las órdenes
- Revisar diagnósticos
- Asignar o supervisar trabajos
- Cambiar estados de las órdenes
- Consultar reportes operativos

### Técnico
- Visualizar las órdenes asignadas
- Registrar diagnósticos
- Agregar observaciones
- Actualizar el estado de reparación

### Recepción / Ventas
- Registrar clientes
- Registrar equipos
- Crear órdenes de trabajo
- Tomar la fotografía del equipo
- Generar e imprimir la etiqueta con QR
- Buscar órdenes y consultar su estado

## Estados de la orden
1. Recibido
2. En Diagnóstico
3. Esperando Presupuesto
4. Esperando Aprobación
5. Esperando Repuestos
6. En Reparación
7. Listo para Entrega
8. Entregado

## Funcionalidades
- ✅ Autenticación con roles y permisos
- ✅ CRUD de clientes, equipos y órdenes
- ✅ Sistema de fotografías por equipo
- ✅ Generación automática de OT y código corto
- ✅ Generación de etiquetas QR (3x3 cm)
- ✅ Historial completo de cambios de estado
- ✅ Dashboard con estadísticas
- ✅ Filtros por estado de orden
