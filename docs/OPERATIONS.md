# Operación del VPS

## Distribución

- Aplicación y Git: `/srv/docloud/app` (propietario ubuntu para desplegar).
- Datos: `/srv/docloud/data` (solo usuario de servicio `docloud`).
- Copias: `/srv/docloud/backups` (solo `docloud`, siete copias).
- Secretos: `/etc/docloud.env` (root, modo 600).
- Servicio: `docloud.service`, puerto exclusivamente `127.0.0.1:3270`.
- nginx: `/etc/nginx/sites-available/dogs.belctech.com`.
- Certificado: `/etc/letsencrypt/live/dogs.belctech.com`.

El VPS existente distribuye HTTPS desde su capa stream de 443 hacia `127.0.0.1:8443`. La configuración de DOCLOUD respeta esa distribución; no cambiar otros virtual hosts ni tocar el SSH sobre 443.

## Despliegue

`bash scripts/deploy.sh` obtiene `main` con avance rápido, instala desde lockfile, verifica tipos/pruebas, compila, respalda y reinicia exclusivamente DOCLOUD. El script detiene el despliegue ante errores y comprueba `/api/health` después de reiniciar. Requiere permisos sudo del operador. No reutilizar datos de producción en las pruebas: estas crean y borran una base temporal propia.

La primera instalación genera la clave de cifrado directamente en el servidor; no se imprime ni se guarda en Git. Es obligatorio respaldar esa clave de forma segura fuera del VPS. Sin ella no pueden recuperarse los secretos TOTP cifrados.

## Diagnóstico

```sh
sudo systemctl status docloud --no-pager
sudo journalctl -u docloud -n 80 --no-pager
curl --fail http://127.0.0.1:3270/api/health
sudo nginx -t
sudo systemctl list-timers docloud-backup.timer
```

No publicar volcados de usuarios, cookies, claves TOTP ni archivos de entorno en incidencias o chats.

## Respaldos

Temporizador diario a las 04:30 de America/Bogota con desfase de hasta cinco minutos. SQLite se respalda mediante su API de copia en línea, no copiando un archivo WAL activo. Las fotos se copian a la misma carpeta del respaldo. Se mantienen siete copias. Los archivos subidos son inmutables y se escriben antes de registrar referencias; una foto concurrente no referenciada todavía no pone en riesgo la copia de la base.

```sh
sudo systemctl start docloud-backup.service
sudo journalctl -u docloud-backup.service -n 20 --no-pager
```

Las copias locales no cubren la pérdida del VPS. Configurar almacenamiento externo y ensayar restauración antes del lanzamiento comercial. Para restaurar: detener DOCLOUD, preservar la carpeta actual, restaurar SQLite y uploads de una misma copia con propietario `docloud`, conservar `/etc/docloud.env`, reiniciar y verificar salud/acceso. No sobrescribir datos sin comprobar la copia elegida.

## Moderación y recuperación

Los reportes se guardan para revisión manual; todavía no hay panel de administración, bloqueo de usuarios ni canal de emergencias. Las recuperaciones de contraseña y segundo factor no se automatizan. No editar una clave TOTP en la base sin un procedimiento de validación del titular. Antes de abrir el servicio comercial, completar estos procesos.

## Seguridad implementada y límites

Cookies Secure en producción, HttpOnly, SameSite=Lax; comprobación de origen en escrituras; tokens aleatorios almacenados como hash; segundo factor TOTP con prevención de reutilización; scrypt; cifrado AES-256-GCM de secretos TOTP; validación Zod; SQL parametrizado; permisos de objeto para propuestas, acuerdos, exportaciones y fotos privadas; límite de tamaño/píxeles y reencodificación de imágenes; CSP con nonces; cabeceras de seguridad; límites persistentes de solicitudes; servicio sin privilegios con directorios de escritura restringidos.

No equivale a una auditoría de seguridad. Falta verificar correo, recuperación robusta, monitoreo de abuso, revisión independiente, retención y gestión de derechos, proveedor KYC, procesador financiero y una operación de soporte. No hay protección absoluta contra fraude o maltrato.

Los límites usan la IP que nginx sobrescribe en X-Real-IP. Tras Cloudflare puede representar una IP del proxy; configurar correctamente las redes confiables de Cloudflare si aumenta el tráfico. Nunca confiar indiscriminadamente en cabeceras enviadas por clientes.
