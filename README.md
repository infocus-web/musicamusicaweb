# Musica Musica Web

Plataforma para el taller de preparación de instrumentos musicales y venta de insumos — **musicamusicaweb.com.ar**.

## Qué hace (versión 1: taller)

- **Clientes** con código automático (`MM-0001`) y **link privado** de seguimiento.
- **Instrumentos** de cada cliente (tipo, marca, modelo, n° de serie).
- **Trabajos / órdenes** con número automático (`OT-00001`), servicio, presupuesto y estado:
  recibido → en revisión → esperando aprobación / repuesto → en trabajo → listo → entregado.
- **Avances** con nota + **video o foto**, subidos directo desde el celular en el panel.
- Botones para **avisar por WhatsApp** con el link ya armado.
- Página pública `/seguimiento/<token>`: el cliente ve sus trabajos, el progreso y los videos (links firmados que vencen).

## Stack

Next.js 15 (App Router) + Supabase (Postgres, Auth, Storage) + Vercel.

## Puesta en marcha

1. En Supabase, ejecutar `supabase/migrations/0001_base_taller.sql` (SQL Editor).
2. Crear el usuario del taller en **Authentication > Users** y habilitarlo:
   ```sql
   insert into public.staff (user_id, nombre)
   select id, 'Taller' from auth.users where email = 'TU_EMAIL';
   ```
3. Copiar `.env.example` a `.env.local` y completar las claves.
4. `npm install` y `npm run dev` → http://localhost:3000/login
5. En Vercel: importar el repo y cargar las mismas variables de entorno.

## Rutas

| Ruta | Para quién |
|---|---|
| `/` | Página pública |
| `/login` | Ingreso del taller |
| `/taller` | Tablero de trabajos por estado |
| `/taller/clientes` | Alta y búsqueda de clientes |
| `/taller/clientes/[id]` | Ficha: link privado, instrumentos, trabajos |
| `/taller/trabajos/[id]` | Orden: estado, presupuesto, avances con video |
| `/seguimiento/[token]` | Vista del cliente |

## Próximos pasos

- Tienda de insumos y stock.
- Aprobación del presupuesto desde el link del cliente.
- Código de verificación opcional en el link.
- Checklist de preparación por tipo de instrumento.
