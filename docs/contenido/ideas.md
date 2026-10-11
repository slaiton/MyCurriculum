# Banco de ideas de contenido

Ideas basadas en tu stack y tu experiencia real (Laravel, Kotlin, Angular, React, SQL/PostgreSQL, AWS, Docker,
integraciones REST/SOAP, logística, liderazgo y auditoría de código).

**Cómo usar esta lista**
- **Búsqueda objetivo:** frase que alguien escribiría en Google. Úsala en el título SEO y en el primer párrafo.
- **Formato:** 📘 tutorial paso a paso · 🧭 guía o decisión · 🧪 caso real · 🎥 incluye video · ✅ checklist
- Las marcadas con ⭐ requieren datos tuyos reales (cifras, anécdotas). No las publiques con datos inventados.
- Ritmo sugerido: 1 artículo por semana, alternando categorías.

---

## 🟣 Arquitectura

| # | Idea | Búsqueda objetivo | Formato |
|---|---|---|---|
| 1 | **Integrar un servicio SOAP heredado desde Laravel sin contaminar tu código** *(artículo completo listo)* | integrar soap laravel | 📘 |
| 2 | Arquitectura hexagonal en Laravel: cuándo vale la pena y cuándo no | arquitectura hexagonal laravel | 🧭 |
| 3 | Clean Architecture explicada con un caso de logística (envíos, guías, novedades) | clean architecture ejemplo real | 📘 |
| 4 | DTOs en PHP 8: dejar de pasar arrays por toda la aplicación | dto php laravel | 📘 |
| 5 | Patrón Repository en Laravel: lo que sí aporta y lo que es ceremonia | repository pattern laravel | 🧭 |
| 6 | Monolito modular antes que microservicios: cómo organizarlo | monolito modular laravel | 🧭 |
| 7 | Colas y jobs en Laravel para integraciones lentas con terceros | laravel queues integraciones | 📘 |
| 8 | Idempotencia en APIs: evitar guías o pagos duplicados por reintentos | idempotencia api rest | 📘 |
| 9 | Cómo diseñar webhooks confiables (firmas, reintentos, orden) | diseñar webhooks seguros | 📘 |

## 🟡 Bases de datos

| # | Idea | Búsqueda objetivo | Formato |
|---|---|---|---|
| 10 | Leer EXPLAIN en PostgreSQL sin morir en el intento | explain analyze postgresql | 📘 |
| 11 | Índices compuestos: el orden de las columnas importa | indice compuesto orden columnas | 📘 |
| 12 | N+1 en Eloquent: detectarlo y corregirlo con eager loading | n+1 eloquent laravel | 📘 |
| 13 | Migrar de MySQL a PostgreSQL: diferencias que rompen tu app | migrar mysql a postgresql | ✅ |
| 14 | Paginación por cursor vs. offset en tablas grandes | paginacion cursor vs offset | 🧭 |
| 15 | Soft deletes, auditoría e historial de cambios: qué guardar | auditoria cambios base de datos | 🧭 |
| 16 | Transacciones y bloqueos: evitar condiciones de carrera en inventario | race condition base de datos | 📘 |
| 17 | Backups de PostgreSQL que sí puedes restaurar (y cómo probarlos) | backup postgresql docker | 📘 🎥 |

## 🔴 Desarrollo web

| # | Idea | Búsqueda objetivo | Formato |
|---|---|---|---|
| 18 | Autenticación de APIs en Laravel: Sanctum vs. Passport vs. JWT | sanctum vs passport | 🧭 |
| 19 | Validación de formularios en Angular con Reactive Forms | reactive forms angular validacion | 📘 |
| 20 | Angular o React para un panel administrativo interno | angular o react panel admin | 🧭 |
| 21 | Consumir APIs REST con manejo de errores decente en Angular | angular httpclient manejo errores | 📘 |
| 22 | Subida de archivos grandes: límites en Nginx, PHP y el framework | client_max_body_size laravel | ✅ |
| 23 | Cómo construí un blog con Next.js y Strapi (este sitio) | blog next.js strapi | 🧪 🎥 |
| 24 | ⭐ Cómo construí un catálogo de impresión 3D (Print3D Market) | — (caso de estudio) | 🧪 |
| 25 | SEO técnico para desarrolladores: lo mínimo que tu sitio necesita | seo tecnico desarrolladores | ✅ |

## 🟢 Apps móviles

| # | Idea | Búsqueda objetivo | Formato |
|---|---|---|---|
| 26 | Apps Android que funcionan sin conexión: sincronizar al volver la señal | android offline first kotlin | 📘 |
| 27 | Room + WorkManager para enviar datos pendientes en segundo plano | workmanager kotlin ejemplo | 📘 |
| 28 | Capturar fotos y firmas como evidencia de entrega en Android | firma digital android kotlin | 📘 |
| 29 | Ubicación GPS en segundo plano sin agotar la batería | gps segundo plano android bateria | 🧭 |
| 30 | ⭐ Lecciones de diseñar apps para conductores (UX en campo) | — (experiencia) | 🧪 |

## 🩵 DevOps y herramientas

| # | Idea | Búsqueda objetivo | Formato |
|---|---|---|---|
| 31 | **Desplegar Next.js y Strapi en tu propio servidor con Docker y Nginx** *(artículo completo listo)* | desplegar next.js docker nginx | 📘 🎥 |
| 32 | GitHub Actions: desplegar por SSH sin `StrictHostKeyChecking=no` | github actions deploy ssh | 📘 |
| 33 | Dockerizar una app Laravel para producción (multi-stage) | dockerfile laravel produccion | 📘 |
| 34 | Variables de entorno y secretos: qué nunca subir a git | secretos git env | ✅ |
| 35 | Certificados HTTPS automáticos con Caddy o Certbot | certbot nginx docker | 📘 |
| 36 | Monitoreo básico gratis: uptime, logs y alertas | monitoreo servidor gratis | 🧭 |
| 37 | AWS para devs de PHP: EC2, RDS y S3 lo justo | aws laravel ec2 rds | 🧭 |
| 38 | Git para equipos: ramas, PR pequeños y mensajes de commit útiles | flujo git equipo | ✅ |

## 🔵 Experiencias (liderazgo y equipo)

| # | Idea | Búsqueda objetivo | Formato |
|---|---|---|---|
| 39 | Checklist de auditoría de código para equipos pequeños | checklist code review | ✅ |
| 40 | ⭐ De desarrollador a líder técnico: lo que cambió en mi día a día | de desarrollador a lider tecnico | 🧪 |
| 41 | Code review que enseña en vez de bloquear | como hacer code review | 🧭 |
| 42 | Deuda técnica: cómo explicarla a negocio y priorizarla | explicar deuda tecnica | 🧭 |
| 43 | ⭐ Qué aprendí integrando sistemas con clientes y proveedores | — (experiencia) | 🧪 |
| 44 | Estimar tareas de software sin mentirte (ni mentirle al cliente) | como estimar software | 🧭 |
| 45 | Documentación mínima viable para que el equipo no dependa de ti | documentacion proyecto software | ✅ |

---

## Series (varios artículos enlazados entre sí)

- **"Integraciones sin dolor"**: 1 → 7 → 8 → 9. Refuerza tu experiencia en logística e integraciones.
- **"De cero a producción"**: 33 → 34 → 35 → 31 → 17 → 36.
- **"Android en campo"**: 26 → 27 → 28 → 29 → 30.
- **"Liderar sin dejar de programar"**: 39 → 41 → 42 → 40.

## Ideas de video corto (1–5 min) para acompañar artículos

- Pantalla grabada: `docker compose up` y el sitio respondiendo (artículo 31).
- Antes y después de un `EXPLAIN` con índice (artículo 10).
- Recorrido de 2 minutos por el panel: crear, previsualizar y publicar (artículo 23).
- Probar una app Android en modo avión y ver la sincronización al volver la red (artículo 26).

Herramientas gratuitas: OBS Studio para grabar, y subirlo como MP4 al CMS o a YouTube y pegar el enlace.
