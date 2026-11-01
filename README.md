# DOCLOUD

Plataforma para encontrar responsables comprometidos, negociar condiciones y documentar el seguimiento de sus mascotas. Primera versión piloto en español, diseñada para Colombia.

**Producción piloto:** https://dogs.belctech.com
**Repositorio:** https://github.com/Chyrazard/docloud

## Arrancar en local

Requiere Node.js >=22.12 y herramientas de compilación para `better-sqlite3` (Xcode Command Line Tools en macOS; `build-essential` y Python en Ubuntu).

```sh
npm ci
cp .env.example .env.local
npm run dev
```

Abre http://127.0.0.1:3270. Si configuras `APP_URL`, usa ese mismo origen en el navegador (incluidos puerto y protocolo). Para producción son obligatorios `APP_URL`, `DATA_DIR` absoluto y `ENCRYPTION_KEY`, generado con `openssl rand -hex 32`. Nunca subir secretos al repositorio.

```sh
npm run typecheck
npm test
npm run build
npm start
```

## Incluido

- React 19, Next.js App Router, Node.js y TypeScript estricto.
- Diseño adaptable: exploración, filtros por ciudad/raza/sexo/acuerdo, favoritos, dashboard, mascotas, propuestas, acuerdos, seguridad y ayuda.
- Registro y acceso con sesiones HttpOnly, contraseñas scrypt y segundo factor TOTP. El segundo factor es obligatorio para publicar y negociar.
- Perfiles persistentes y subida de fotos, reencodificadas a WebP y sin metadatos originales.
- Acuerdos económicos con dirección explícita del pago; reglas por tamaño de camada y plantillas para mitad con redondeo explícito.
- Contrapropuestas versionadas. Solo la contraparte acepta la última versión pendiente. Las escrituras de aceptación son transaccionales.
- Acuerdo aceptado inmutable con huella SHA-256 y exportación JSON.
- Bitácora con tipos de evento, fechas y fotos privadas, restringidas a las partes.
- Árbol de padres y crías, nombres, cuidados, hogar previsto y estado declarado. Ediciones de crías con control de versión.
- Notificaciones dentro de la app; sincronización cada 30 segundos mientras la sesión está abierta.
- Reportes persistentes para revisión manual; páginas informativas de privacidad y condiciones del piloto.
- Demo separada, guardada solo en el navegador. Perfiles ficticios identificados como ejemplos.
- Servicio systemd dedicado, nginx, HTTPS, copias en línea diarias y scripts de despliegue.

## Integraciones que NO están activas

Esta versión **no procesa pagos, no retiene dinero, no verifica cédulas ni rostros, no acredita propiedad/pedigree/salud y no libera contactos privados**. Las pantallas y la API expresan esa limitación; el endpoint de pago devuelve 503 y no cambia estados financieros.

Los correos, los recordatorios cuando el usuario está desconectado, la recuperación automática de acceso, las verificaciones de correo e identidad, la moderación operativa, la firma certificada y la atención de disputas requieren implementación o proveedores adicionales. No hay mercado de compra de cachorros en esta primera versión.

Antes de lanzamiento comercial: seleccionar proveedor de identidad y procesador apto para este modelo de negocio; definir operador, privacidad, retención, cancelaciones, soporte y tarifas; revisión profesional de políticas y bienestar; añadir recuperación segura, panel de moderación, monitoreo y copias fuera del VPS. No presentar este piloto como producto comercial terminado.

## Arquitectura

- `app/`: páginas, estilos, API y metadatos.
- `components/docloud.tsx`: interfaz, formularios y demo.
- `components/family-tree.tsx`: seguimiento de las crías.
- `lib/domain.ts`: validación y reglas de negocio compartidas.
- `lib/security.ts`: contraseñas, sesiones, cifrado, TOTP y límites.
- `lib/db.ts`: esquema SQLite, claves foráneas y WAL.
- `proxy.ts`: CSP con nonce por petición, sin scripts inline arbitrarios en producción.
- `deploy/`: servicio, nginx y temporizador de respaldo.
- `tests/`: reglas y prueba de integración de permisos y negociación.

SQLite está en un volumen persistente; no se comparte la base entre máquinas ni se versiona. Es una decisión para el piloto de una sola instancia. Para escalar a varias instancias, migrar a PostgreSQL y almacenamiento de objetos, conservar las transacciones y el control de versiones.

## Publicar actualizaciones

En local:

```sh
git add .
git commit -m "Describe el cambio"
git push origin main
```

En el VPS:

```sh
ssh belctech-vps
cd /srv/docloud/app
bash scripts/deploy.sh
```

Consulta [operación](docs/OPERATIONS.md) y [casos de negocio](docs/PRODUCT.md). No ejecutar `git reset --hard` ni borrar la carpeta de datos durante un despliegue.

## Imágenes y tipografía

Fotografías ilustrativas obtenidas de Unsplash, servidas localmente. IDs de origen: `photo-1552053831-71594a27632d`, `photo-1518717758536-85ae29035b6d`, `photo-1605568427561-40dd23c2acea`, `photo-1633722715463-d30f4f325e24`, `photo-1505628346881-b72b27e84530`. Son ejemplos visuales y no documentación de mascotas reales. Tipografía Manrope distribuida bajo SIL Open Font License; licencia en `public/fonts/OFL.txt`.
