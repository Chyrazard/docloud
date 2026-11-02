# Toby, mascota original de DOCLOUD

Jack Russell de pie, con proporciones naturales y las cuatro patas visibles, ilustrado en SVG: pelaje blanco, mancha canela, orejas dobladas, collar verde y medalla con una nube. El dibujo está en `components/brand/toby.tsx`; los grupos corresponden a cabeza, orejas, ojos, cola y patas. La animación no requiere librerías, sprites rasterizados ni servicios externos.

## Superficies

- Logo: la cara compartida en la barra lateral y en los encabezados de registro y privacidad; versión pequeña para la cabecera móvil. Al pasar el cursor o enfocar con teclado, saluda y guiña.
- Bienvenida: entrada breve y decorativa, una vez por sesión. No bloquea clics y tiene salida CSS incluso si JavaScript falla. Se omite con movimiento reducido.
- Carga real: `app/loading.tsx` usa la misma firma para transiciones de Next.js.
- Registro: ilustración completa en el panel de presentación de escritorio.
- Guía flotante: esquina inferior derecha, saludo, respiración, mirada al cursor, cola, rascado con pulguitas ilustradas pequeñas, lamido y mimo. Se pueden pausar las animaciones u ocultar al personaje; se respeta el movimiento reducido del sistema y se suspenden los ciclos de JavaScript al ocultar la pestaña.

Las preferencias visuales no incluyen datos del formulario. Las respuestas del panel son estáticas, se presentan como preparadas, no se envían a IA y no se guardan como conversación en el servidor. No se muestran disponibilidad humana ni estados financieros ficticios.

## WhatsApp y Chyraz API

El usuario pospuso el número y la conexión de IA. `WHATSAPP_NUMBER` queda vacío. La interfaz muestra WhatsApp e IA como próximos, y el acceso por WhatsApp permanece deshabilitado.

Cuando exista un número de atención, el operador podrá definir `WHATSAPP_NUMBER` en `/etc/docloud.env` con indicativo internacional y reiniciar DOCLOUD. Esto habilita solo un enlace `wa.me` con un texto genérico; no envía mensajes automáticamente ni conecta un bot. Se valida el número y no se incorpora información del formulario al enlace.

La integración real con la Chyraz API del usuario requiere su contrato/documentación y credenciales. Deberá implementarse en el servidor: no exponer tokens en el navegador ni inventar endpoints. No hay un bot de WhatsApp ni un modelo de IA activo en esta versión.

Formato click-to-chat documentado por WhatsApp: https://faq.whatsapp.com/5913398998672934

## Exportaciones

```sh
npm run brand:export
```

Exporta desde el mismo dibujo, en su dirección final de perro de pie: `public/brand/toby.svg`, `public/brand/toby-face.svg`, `public/brand/docloud-logo.svg` y `public/icon.svg`. Los SVG de personaje incluyen sus estilos de animación y respetan el movimiento reducido. No hay imágenes generadas con IA ni dependencias de diseños externos en estos archivos.

También se entregan `toby-greet.svg`, `toby-scratch.svg` y `toby-lick.svg`, cada uno con su gesto animado; `toby-avatar.png` (cara cuadrada de 1024 px, útil para el futuro perfil de WhatsApp) y `toby-full.png` (cuerpo entero con transparencia, 1200 px). Los PNG se rasterizan directamente desde el dibujo propio, sin editar ni incorporar la referencia adjunta.
