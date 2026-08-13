# KIPU — MVP
## Sistema personal de gestión automática de gastos mediante Gmail + Telegram + PWA

## 1. CONTEXTO

Quiero desarrollar una aplicación web personal llamada **Kipu** para automatizar el registro y consulta de mis gastos.

El problema que quiero resolver es que actualmente tengo varias tarjetas de crédito y débito de diferentes bancos y no quiero registrar manualmente cada gasto.

Los bancos me envían correos electrónicos a Gmail cuando ocurren determinadas operaciones.

Kipu debe:

1. Conectarse a mi cuenta de Gmail mediante OAuth 2.0.
2. Leer correos relacionados con operaciones bancarias.
3. Detectar automáticamente transacciones.
4. Extraer información de los correos.
5. Normalizar las transacciones independientemente del banco.
6. Identificar la tarjeta utilizada.
7. Determinar a quién pertenece la tarjeta.
8. Clasificar automáticamente el gasto.
9. Evitar transacciones duplicadas.
10. Guardar la información en Supabase PostgreSQL.
11. Mostrar la información en una PWA responsive.
12. Permitir instalar Kipu desde el navegador del celular.
13. Enviar cada nueva transacción procesada a Telegram.
14. Tener un bot de Telegram para consultar información financiera.
15. Mantener una arquitectura preparada para agregar posteriormente BCP IO, más bancos, cuotas, presupuestos y otras fuentes.

IMPORTANTE:

Esta aplicación es inicialmente PERSONAL.

No se deben implementar APIs bancarias.
No se deben guardar credenciales bancarias.
No se debe hacer scraping de bancos.
La única fuente externa de movimientos en este MVP será Gmail.

---

# 2. STACK TECNOLÓGICO

Utilizar:

- Next.js
- TypeScript
- App Router
- React
- Tailwind CSS
- shadcn/ui
- Supabase
- PostgreSQL
- Supabase Auth
- Gmail API
- Google OAuth 2.0
- Telegram Bot API
- Recharts para gráficos
- Zod para validaciones
- Cheerio para analizar HTML de correos
- date-fns para fechas
- Lucide React para iconos

Deployment:

- Vercel
- Supabase
- GitHub

No utilizar Docker en el MVP salvo que sea estrictamente necesario.

No introducir librerías innecesarias.

---

# 3. PRINCIPIO ARQUITECTÓNICO

Separar claramente:

### Fuentes

- Gmail

### Procesamiento

- Email collector
- Parser
- Normalizador
- Detección de duplicados
- Identificación de tarjeta
- Identificación de propietario
- Clasificación

### Persistencia

- Supabase PostgreSQL

### Interfaces

- PWA web
- Telegram Bot

La arquitectura conceptual:

Gmail
↓
Gmail API
↓
Email Collector
↓
Bank Parser
↓
Transaction Normalizer
↓
Deduplication
↓
Card Identification
↓
Owner Identification
↓
Category Classification
↓
Supabase
↓
PWA + Telegram

No mezclar la lógica de parsing de bancos con la interfaz.

---

# 4. OBJETIVO DEL MVP

El MVP debe permitir realizar este flujo completo:

1. Crear una cuenta en Kipu.
2. Conectar Gmail.
3. Configurar tarjetas.
4. Configurar quién es propietario de cada tarjeta.
5. Pulsar "Sincronizar Gmail".
6. Kipu busca correos bancarios.
7. Kipu identifica correos de BCP e Interbank.
8. Extrae las transacciones.
9. Detecta duplicados.
10. Identifica tarjeta.
11. Identifica propietario.
12. Clasifica categoría mediante reglas.
13. Guarda la transacción.
14. Muestra la transacción en el dashboard.
15. Envía una notificación a Telegram.
16. Permite consultar el resumen mediante Telegram.

---

# 5. AUTENTICACIÓN DE KIPU

Utilizar Supabase Auth.

Inicialmente permitir:

- Email/password
- Google login opcional si resulta sencillo

Cada usuario debe tener acceso únicamente a sus propios datos.

Implementar Row Level Security en Supabase.

Nunca utilizar datos de un usuario en consultas de otro usuario.

---

# 6. CONEXIÓN CON GMAIL

Utilizar Gmail API oficial.

No utilizar IMAP.
No pedir contraseña de Gmail.
No almacenar contraseña de Gmail.

Utilizar OAuth 2.0.

Scope inicial:

gmail.readonly

La aplicación debe mostrar:

"Conectar Gmail"

Después de autorizar:

"✓ Gmail conectado"

Guardar la conexión asociada al usuario.

---

# 7. SEGURIDAD DE TOKENS GMAIL

El refresh token de Google es información sensible.

No devolverlo al frontend.

Nunca incluirlo en:

- logs
- respuestas API
- consola del navegador
- mensajes Telegram

Guardar el refresh token cifrado en la base de datos.

Utilizar una clave de cifrado almacenada en una variable de entorno:

GMAIL_TOKEN_ENCRYPTION_KEY

Utilizar cifrado fuerte, preferentemente AES-256-GCM.

Crear funciones:

encryptToken()
decryptToken()

El servidor debe ser el único que pueda acceder al refresh token.

---

# 8. VARIABLES DE ENTORNO

Crear `.env.example`.

Debe contemplar como mínimo:

NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=

GMAIL_TOKEN_ENCRYPTION_KEY=

TELEGRAM_BOT_TOKEN=
TELEGRAM_WEBHOOK_SECRET=

NEXT_PUBLIC_APP_URL=

Nunca incluir valores reales.

Crear también documentación sobre dónde obtener cada variable.

---

# 9. BASE DE DATOS

Diseñar una base PostgreSQL normalizada.

Tablas principales:

## profiles

Campos:

- id
- user_id
- display_name
- timezone
- currency
- created_at
- updated_at

La moneda por defecto será PEN.

Timezone por defecto:

America/Lima

---

## people

Representa al propietario de una tarjeta o gasto.

Campos:

- id
- user_id
- name
- type
- created_at
- updated_at

Ejemplos:

- Yo
- Hermano

El usuario principal puede tener una persona "Yo".

No es necesario que cada persona tenga una cuenta de Kipu.

---

## cards

Campos:

- id
- user_id
- bank
- name
- card_type
- last4
- owner_person_id
- currency
- closing_day
- payment_day
- active
- created_at
- updated_at

Ejemplo:

BCP
Tarjeta de Débito
****8795
Propietario: Yo

Otro ejemplo:

BCP
Tarjeta de Débito
****4321
Propietario: Hermano

IMPORTANTE:

La tarjeta y el gasto deben poder tener propietarios diferentes.

Ejemplo:

Tarjeta:
Yo

Gasto:
Hermano

Esto permitirá futuras situaciones en las que alguien use una tarjeta de otra persona.

---

## accounts

Para futuras cuentas bancarias.

Campos:

- id
- user_id
- bank
- name
- account_type
- last4
- owner_person_id
- currency
- active
- created_at
- updated_at

No es necesario implementar todavía todas las funciones de cuentas.

---

## categories

Campos:

- id
- user_id
- name
- icon
- parent_id
- active
- created_at
- updated_at

Crear categorías iniciales:

- Alimentación
- Transporte
- Compras
- Entretenimiento
- Servicios
- Salud
- Educación
- Viajes
- Suscripciones
- Hogar
- Finanzas
- Otros

Permitir posteriormente crear categorías personalizadas.

---

## merchant_rules

Permite clasificar automáticamente comercios.

Campos:

- id
- user_id
- merchant_pattern
- category_id
- priority
- active
- created_at
- updated_at

Ejemplos:

Wong → Alimentación
Tottus → Alimentación
Uber → Transporte
Netflix → Suscripciones
Spotify → Suscripciones

No utilizar IA en el MVP.

Utilizar reglas determinísticas.

---

## transactions

Tabla principal.

Campos:

- id
- user_id
- person_id
- card_id
- account_id
- bank
- transaction_type
- payment_method
- amount
- currency
- transaction_date
- transaction_time
- merchant
- normalized_merchant
- category_id
- description
- operation_number
- gmail_message_id
- gmail_thread_id
- source
- raw_reference
- status
- created_at
- updated_at

Valores posibles:

transaction_type:

- purchase
- payment
- transfer
- withdrawal
- refund
- fee
- other

payment_method:

- credit_card
- debit_card
- bank_account
- unknown

source:

- gmail

status:

- confirmed
- pending
- ignored
- needs_review

---

# 10. DUPLICADOS

Esto es obligatorio.

Una misma transacción puede aparecer varias veces o posteriormente ser importada mediante otra fuente.

Crear un mecanismo de deduplicación.

Primera prioridad:

Banco + número de operación

Ejemplo:

BCP + 045171

Interbank + 3317266

Segunda prioridad si no existe número de operación:

Banco
+
Tarjeta
+
Fecha
+
Monto
+
Comercio

Crear un fingerprint de transacción.

No permitir duplicados.

Además:

gmail_message_id debe tener un índice UNIQUE por usuario cuando corresponda.

Si el correo ya fue procesado:

No volver a crear la transacción.

---

# 11. CORREOS BCP

Los correos BCP proporcionados como referencia tienen una estructura similar a:

"Realizaste un consumo de S/ 11.08 con tu Tarjeta de Débito BCP en OP *Market Mary."

Después aparecen:

Monto
Total del consumo
S/ 11.08

Datos de la operación

Operación realizada
Consumo Tarjeta de Débito

Fecha y hora
07 de agosto de 2026 - 07:38 PM

Número de Tarjeta de Débito
************8795

Empresa
OP *Market Mary

Número de operación
045171

Otro correo BCP de referencia:

Monto:
S/ 100.60

Fecha:
12 de mayo de 2026 - 06:44 AM

Tarjeta:
************8795

Empresa:
IO*first_last_name_firs

Número de operación:
109586

IMPORTANTE:

El parser debe funcionar leyendo el HTML del correo.

No depender únicamente de regex sobre el texto completo.

Crear:

src/lib/email/parsers/bcp.ts

El parser debe devolver un objeto normalizado:

{
  bank,
  transactionType,
  paymentMethod,
  amount,
  currency,
  transactionDate,
  transactionTime,
  cardLast4,
  merchant,
  operationNumber
}

---

# 12. CORREOS INTERBANK

Un correo de referencia de Interbank tiene:

Constancia de pago

Código de operación:
3317266

Fecha y hora:
13 Jul 2026
10:23 AM

Cuenta cargo:
Visa
Soles
454775******3902

Empresa:
PAGOEFECTIVO
PagoEfectivo

Recibo:
S/ 200.00
30/11

Datos:
00000393302125

Moneda y monto:
S/ 200.00

IMPORTANTE:

Este correo NO debe tratarse automáticamente como una compra.

Debe clasificarse como:

transaction_type = payment

hasta que tengamos más tipos de correos de Interbank.

Crear:

src/lib/email/parsers/interbank.ts

El parser debe ser modular.

---

# 13. BCP IO

En el MVP preparar la arquitectura para BCP IO, pero no es obligatorio implementar el parser completo si no tenemos suficientes ejemplos.

Crear una interfaz:

interface BankEmailParser {
  canParse(email): boolean;
  parse(email): ParsedTransaction[];
}

Esto permitirá agregar:

bcp.ts
interbank.ts
bcp-io.ts

sin modificar el resto del sistema.

---

# 14. NORMALIZACIÓN

Crear un formato común:

interface ParsedTransaction {
  bank: string;
  transactionType: TransactionType;
  paymentMethod: PaymentMethod;
  amount: number;
  currency: string;
  transactionDate: string;
  transactionTime?: string;
  cardLast4?: string;
  accountLast4?: string;
  merchant?: string;
  operationNumber?: string;
}

Todos los parsers deben producir este formato.

---

# 15. IDENTIFICACIÓN DE TARJETA

Después del parsing:

Buscar una tarjeta del usuario con:

bank + last4

Ejemplo:

BCP + 8795

Si existe:

asociar card_id.

Si no existe:

crear una transacción con:

status = needs_review

y mostrar:

"Nueva tarjeta detectada"

No asumir automáticamente que pertenece al usuario.

---

# 16. IDENTIFICACIÓN DEL PROPIETARIO

Regla principal:

transaction.person_id = card.owner_person_id

Pero permitir modificar manualmente el propietario de una transacción.

Esto es necesario porque:

Tarjeta → Yo
Gasto → Hermano

es posible.

---

# 17. CLASIFICACIÓN

Primera versión solamente mediante reglas.

Proceso:

1. Obtener merchant.
2. Normalizar merchant.
3. Buscar merchant_rules.
4. Si existe coincidencia:
   asignar categoría.
5. Si no existe:
   status = needs_review.

Ejemplo:

"OP *Market Mary"

puede ser categorizado manualmente la primera vez.

Después guardar una regla:

"MARKET MARY" → Alimentación

---

# 18. NORMALIZACIÓN DE COMERCIOS

Crear función:

normalizeMerchant()

Debe:

- convertir a mayúsculas para comparar
- eliminar espacios innecesarios
- normalizar caracteres
- eliminar ruido cuando sea posible

Pero conservar también:

merchant

con el nombre original.

Ejemplo:

merchant:

"OP *Market Mary"

normalized_merchant:

"MARKET MARY"

---

# 19. IMPORTACIÓN DE GMAIL

Crear endpoint protegido:

POST /api/gmail/sync

Proceso:

1. Validar usuario.
2. Obtener conexión Gmail.
3. Obtener access token utilizando refresh token.
4. Buscar correos nuevos.
5. Obtener contenido de mensajes.
6. Identificar banco.
7. Pasar mensaje al parser correspondiente.
8. Normalizar.
9. Detectar duplicados.
10. Identificar tarjeta.
11. Identificar propietario.
12. Clasificar categoría.
13. Guardar.
14. Registrar resultado.
15. Enviar notificación Telegram si corresponde.

---

# 20. SINCRONIZACIÓN INICIAL

La primera vez mostrar:

"Importar historial"

Opciones:

- Últimos 30 días
- Últimos 3 meses
- Últimos 6 meses
- Últimos 12 meses

Por defecto:

3 meses.

No procesar indefinidamente todo el buzón.

---

# 21. SINCRONIZACIÓN POSTERIOR

Guardar:

last_sync_at

Buscar solamente correos posteriores a la última sincronización, con un pequeño margen para evitar perder mensajes.

La operación debe ser idempotente.

Ejecutar sync varias veces nunca debe duplicar movimientos.

---

# 22. DASHBOARD

Crear dashboard principal responsive.

Debe mostrar:

## Resumen del mes

- Gastos totales
- Cantidad de transacciones
- Gastos con crédito
- Gastos con débito
- Pagos de tarjetas

## Categorías

Gráfico circular o barras.

## Tarjetas

Mostrar:

BCP
Interbank
BCP IO

## Últimas transacciones

Mostrar:

fecha
comercio
categoría
tarjeta
propietario
monto

---

# 23. FILTROS

Permitir filtrar por:

- mes
- banco
- tarjeta
- persona
- categoría
- tipo de transacción

---

# 24. PANTALLA DE TRANSACCIONES

Crear:

/transactions

Con tabla responsive.

Columnas:

- Fecha
- Comercio
- Banco
- Tarjeta
- Persona
- Categoría
- Tipo
- Monto
- Estado

En celular utilizar tarjetas en lugar de una tabla demasiado ancha.

---

# 25. PANTALLA DE TARJETAS

Crear:

/cards

Permitir:

- agregar tarjeta
- editar tarjeta
- activar/desactivar
- asignar propietario
- configurar fecha de corte
- configurar fecha de pago

No implementar todavía cálculos complejos de estados de cuenta.

---

# 26. PANTALLA DE CONFIGURACIÓN

Crear:

/settings

Secciones:

### Cuenta

Nombre
Email
Moneda
Zona horaria

### Gmail

Estado de conexión

Conectar Gmail
Desconectar Gmail
Última sincronización

### Telegram

Conectar Telegram
Desconectar Telegram
Estado de conexión

### Categorías

Administrar categorías

### Reglas

Administrar reglas de comercios

---

# 27. PWA

La aplicación debe ser instalable desde el navegador.

Implementar:

- manifest.webmanifest
- iconos
- nombre: Kipu
- short_name: Kipu
- theme_color
- background_color
- display: standalone
- start_url: /

Debe funcionar correctamente en:

- Chrome Android
- Safari iPhone
- Chrome Desktop
- Edge

No es necesario implementar offline completo en el MVP.

La prioridad es que se pueda instalar como aplicación desde el navegador.

---

# 28. DISEÑO

La interfaz debe ser moderna, limpia y minimalista.

Nombre:

Kipu

Concepto visual:

finanzas personales + quipu peruano + tecnología.

No hacer una interfaz excesivamente empresarial.

Priorizar:

- números grandes
- tarjetas visuales
- gráficos sencillos
- navegación móvil
- pocos clics

Crear navegación:

Dashboard
Transacciones
Tarjetas
Categorías
Configuración

En móvil utilizar navegación inferior si resulta conveniente.

---

# 29. TELEGRAM BOT

Crear un Telegram Bot.

Variables:

TELEGRAM_BOT_TOKEN

El bot debe utilizar webhook.

Endpoint:

POST /api/telegram/webhook

No usar polling en producción.

---

# 30. VINCULAR TELEGRAM

El usuario debe poder vincular su Telegram desde Kipu.

Flujo:

1. Usuario entra a Configuración.
2. Pulsa "Conectar Telegram".
3. Kipu genera un código temporal.
4. Usuario abre el bot.
5. Ejecuta:

/start CODIGO

6. Telegram envía el Telegram User ID.
7. Kipu valida el código.
8. Guarda:

user_id
telegram_user_id

El código debe:

- expirar
- ser de un solo uso
- no aparecer en logs

---

# 31. SEGURIDAD TELEGRAM

Solo responder a Telegram IDs vinculados.

Si un usuario desconocido intenta utilizar el bot:

Responder:

"Este Telegram no está vinculado a una cuenta Kipu."

Nunca mostrar información financiera.

---

# 32. COMANDOS TELEGRAM MVP

Implementar:

/start
/ayuda
/resumen
/gastos
/tarjetas
/categorias
/sincronizar

---

# 33. /resumen

Ejemplo:

📊 Kipu — Agosto 2026

💰 Gastos:
S/ 4,280.50

💳 Crédito:
S/ 2,150.50

💵 Débito:
S/ 2,130.00

🍔 Alimentación:
S/ 1,250.00

🚗 Transporte:
S/ 430.00

🛍️ Compras:
S/ 820.00

📦 Otros:
S/ 1,780.50

El resultado debe venir directamente de PostgreSQL.

---

# 34. /gastos

Mostrar los últimos 10 gastos.

Ejemplo:

💳 Últimos gastos

12 Ago
Wong
S/ 87.50
🍔 Alimentación
BCP ****8795

11 Ago
Uber
S/ 24.50
🚗 Transporte
BCP IO ****1234

---

# 35. /tarjetas

Mostrar resumen por tarjeta.

Ejemplo:

💳 Mis tarjetas

BCP Débito ****8795
S/ 1,240.50

BCP IO ****1234
S/ 580.30

Interbank ****3902
S/ 930.20

---

# 36. /categorias

Mostrar gastos agrupados por categoría.

---

# 37. /sincronizar

El bot debe poder iniciar una sincronización de Gmail.

Responder inicialmente:

🔄 Sincronizando Gmail...

Después:

✓ Sincronización completada

Nuevos movimientos: 4
Duplicados ignorados: 2
Requieren revisión: 1

No ejecutar procesos extremadamente largos dentro de una sola petición si Vercel impone límites.

---

# 38. NOTIFICACIONES TELEGRAM

Cuando se procesa correctamente una nueva transacción, enviar:

💳 NUEVO GASTO

🏦 BCP
🏪 Market Mary
💰 S/ 11.08

💳 Débito ****8795
👤 Yo
📁 Alimentación

📅 07/08/2026 19:38

Si la transacción es un pago:

💵 NUEVO PAGO

🏦 Interbank
🏪 PagoEfectivo
💰 S/ 200.00

No clasificar un pago como gasto.

---

# 39. CONFIGURACIÓN DE NOTIFICACIONES

En configuración:

Telegram:

[✓] Notificar nuevos gastos
[✓] Notificar pagos
[ ] Notificar transacciones que requieren revisión

Guardar preferencias.

---

# 40. TRANSACCIONES QUE REQUIEREN REVISIÓN

Si falta:

- tarjeta
- categoría
- tipo
- parser
- propietario

mostrar:

⚠️ Requiere revisión

Permitir al usuario corregir.

Ejemplo:

Nueva tarjeta detectada:

BCP ****4321

[Asignar tarjeta]

---

# 41. NO UTILIZAR IA EN EL MVP

No integrar OpenAI ni otro modelo para clasificación todavía.

Utilizar reglas.

La arquitectura debe permitir agregar IA posteriormente.

Por ejemplo:

CategoryService

implementación inicial:

RuleBasedCategoryService

futuro:

AI CategoryService

---

# 42. MANEJO DE ERRORES

Todos los procesos deben manejar errores correctamente.

Ejemplos:

Gmail desconectado
Token expirado
Correo sin formato reconocido
Tarjeta desconocida
Transacción duplicada
Telegram no conectado
Error de Supabase

Nunca romper toda la sincronización porque un correo individual falle.

Ejemplo:

100 correos encontrados
95 procesados
3 duplicados
1 necesita revisión
1 error

El proceso debe continuar.

---

# 43. LOGS

Crear tabla:

sync_logs

Campos:

- id
- user_id
- started_at
- finished_at
- status
- emails_found
- transactions_created
- duplicates_found
- requires_review
- errors
- created_at

No guardar contenido bancario completo en logs.

Nunca guardar:

- passwords
- refresh tokens
- access tokens
- información financiera innecesaria

---

# 44. PRIVACIDAD

No almacenar el HTML completo de los correos salvo que sea estrictamente necesario.

Guardar solamente:

- gmail_message_id
- gmail_thread_id
- datos normalizados
- metadata necesaria para auditoría

Si se necesita guardar raw_reference para debugging, debe ser mínimo y no contener datos sensibles innecesarios.

---

# 45. ZONA HORARIA

Toda la aplicación debe trabajar con:

America/Lima

La base de datos debe guardar timestamps correctamente.

Los reportes deben mostrar fechas en hora de Perú.

No utilizar la zona horaria del servidor para cálculos de usuario.

---

# 46. MONEDA

Por defecto:

PEN

Mostrar:

S/

Preparar arquitectura para:

USD
EUR

pero no implementar conversión de moneda en MVP.

---

# 47. FECHAS DE CORTE

Guardar en cards:

closing_day
payment_day

Pero en MVP solamente mostrar la configuración.

No implementar todavía el cálculo completo de estados de cuenta.

La lógica financiera avanzada llegará en una siguiente versión.

---

# 48. IMPORTANTE: DIFERENCIAR GASTO Y PAGO

Nunca contar un pago de tarjeta como gasto.

Ejemplo:

Compra:

S/ 500

Posteriormente:

Pago tarjeta:
S/ 500

El dashboard debe mostrar:

Gasto:
S/ 500

Pago:
S/ 500

Gasto total:
S/ 500

No:

Gasto total:
S/ 1,000

Este principio debe reflejarse en el modelo de datos y en las consultas.

---

# 49. HERMANO

Existe una situación real:

La cuenta Gmail contiene correos BCP correspondientes tanto a mis gastos como a gastos de mi hermano.

No asumir que todos los BCP son míos.

La identificación principal será:

Banco + últimos 4 dígitos de tarjeta.

Ejemplo:

BCP ****8795 → Yo

BCP ****4321 → Hermano

La interfaz debe permitir configurar esto.

Además, permitir cambiar manualmente el propietario de una transacción.

---

# 50. PRIMERAS DATOS DE CONFIGURACIÓN

No crear datos financieros falsos.

La aplicación debe comenzar vacía.

Crear únicamente categorías predeterminadas.

No inventar tarjetas.

El usuario las agregará desde la interfaz.

---

# 51. DATOS DE PRUEBA

Crear fixtures/tests con los correos de ejemplo proporcionados.

BCP:

Monto:
11.08

Fecha:
2026-08-07

Hora:
19:38

Tarjeta:
8795

Comercio:
OP *Market Mary

Operación:
045171

Segundo BCP:

Monto:
100.60

Fecha:
2026-05-12

Hora:
06:44

Tarjeta:
8795

Comercio:
IO*first_last_name_firs

Operación:
109586

Interbank:

Monto:
200.00

Fecha:
2026-07-13

Hora:
10:23

Tarjeta/cuenta:
3902

Comercio:
PAGOEFECTIVO

Código:
3317266

Tipo:
payment

Estos fixtures deben utilizarse únicamente para tests.

No insertar estos movimientos automáticamente en la base de datos real.

---

# 52. TESTS

Crear tests unitarios para:

BCP parser
Interbank parser
normalizeMerchant
deduplication
category rules
card identification
owner identification

Casos mínimos:

1. BCP consumo correctamente parseado.
2. BCP monto correcto.
3. BCP fecha correcta.
4. BCP tarjeta correcta.
5. BCP operación correcta.
6. Interbank pago correctamente identificado.
7. Duplicado detectado.
8. Tarjeta desconocida requiere revisión.
9. Tarjeta asignada al hermano se identifica correctamente.
10. Pago no aparece como gasto.

---

# 53. ESTRUCTURA DE PROYECTO

Proponer una estructura similar:

src/
  app/
    dashboard/
    transactions/
    cards/
    settings/
    api/
      gmail/
        connect/
        callback/
        sync/
      telegram/
        webhook/
        link/
    login/

  components/
    dashboard/
    transactions/
    cards/
    settings/
    telegram/
    ui/

  lib/
    supabase/
    gmail/
    telegram/
    email/
      parsers/
        bcp.ts
        interbank.ts
      normalizer.ts
      classifier.ts
      deduplication.ts
    security/
    finance/

  types/
    gmail.ts
    transactions.ts
    cards.ts

  tests/
    parsers/
    finance/

public/
  icons/

supabase/
  migrations/
  seed.sql

---

# 54. API INTERNA

Crear endpoints limpios.

Ejemplos:

POST /api/gmail/sync
GET /api/gmail/status
GET /api/transactions
POST /api/transactions
PATCH /api/transactions/:id
GET /api/cards
POST /api/cards
PATCH /api/cards/:id
GET /api/categories
POST /api/categories
GET /api/dashboard/summary
POST /api/telegram/webhook
POST /api/telegram/link

Utilizar validación Zod.

Nunca confiar en datos enviados por el cliente.

---

# 55. SUPABASE

Crear migrations SQL versionadas.

Implementar RLS.

Regla general:

Un usuario solamente puede leer/escribir:

- sus perfiles
- sus personas
- sus tarjetas
- sus cuentas
- sus categorías
- sus reglas
- sus transacciones
- sus conexiones
- sus logs
- su configuración Telegram

Las operaciones que requieren service role deben ejecutarse exclusivamente del lado servidor.

Nunca exponer SUPABASE_SERVICE_ROLE_KEY al navegador.

---

# 56. EXPERIENCIA DE USUARIO

Al entrar por primera vez:

Mostrar onboarding:

## Bienvenido a Kipu 👋

"Automatiza tus gastos desde Gmail."

Paso 1:
Conectar Gmail

Paso 2:
Agregar tarjetas

Paso 3:
Indicar propietario de cada tarjeta

Paso 4:
Conectar Telegram

Paso 5:
Sincronizar

Después:

"✓ Kipu está listo."

---

# 57. DASHBOARD MOBILE FIRST

La aplicación debe diseñarse primero para celular.

Ancho aproximado de móvil:

360px

No crear tablas que requieran hacer zoom.

Cards:

Resumen
Categorías
Últimas transacciones

Desktop puede tener más columnas.

---

# 58. BOTONES PRINCIPALES

Dashboard:

[Sincronizar Gmail]

[Ver transacciones]

Cards:

[Agregar tarjeta]

Settings:

[Conectar Gmail]

[Conectar Telegram]

---

# 59. CRITERIOS DE ACEPTACIÓN DEL MVP

El MVP se considera terminado cuando:

### Gmail

[ ] Puedo conectar Gmail.
[ ] Puedo desconectar Gmail.
[ ] Puedo sincronizar manualmente.
[ ] Se detectan correos BCP.
[ ] Se detectan correos Interbank.
[ ] Se ignoran correos irrelevantes.

### BCP

[ ] Se extrae monto.
[ ] Se extrae fecha.
[ ] Se extrae hora.
[ ] Se extrae tarjeta.
[ ] Se extrae comercio.
[ ] Se extrae número de operación.

### Interbank

[ ] Se extrae monto.
[ ] Se extrae fecha.
[ ] Se extrae hora.
[ ] Se extrae tarjeta/cuenta.
[ ] Se extrae empresa.
[ ] Se extrae código.
[ ] Se identifica como payment.

### Tarjetas

[ ] Puedo crear tarjeta.
[ ] Puedo asignar propietario.
[ ] Puedo configurar corte.
[ ] Puedo configurar pago.
[ ] Se identifica automáticamente la tarjeta.

### Hermano

[ ] Puedo configurar una tarjeta como perteneciente a mi hermano.
[ ] Los gastos de esa tarjeta no aparecen como míos.
[ ] Puedo cambiar manualmente el propietario de un gasto.

### Categorías

[ ] Las categorías funcionan.
[ ] Las reglas funcionan.
[ ] Un comercio conocido se clasifica automáticamente.
[ ] Un comercio desconocido requiere revisión.

### Duplicados

[ ] El mismo correo no genera dos transacciones.
[ ] El mismo número de operación no genera dos transacciones.

### PWA

[ ] Puedo instalar Kipu desde Chrome Android.
[ ] Puedo instalar Kipu desde Safari iPhone.
[ ] La interfaz es responsive.

### Telegram

[ ] Puedo vincular Telegram.
[ ] Solo mi Telegram vinculado puede consultar.
[ ] Recibo una notificación de una nueva transacción.
[ ] /resumen funciona.
[ ] /gastos funciona.
[ ] /tarjetas funciona.
[ ] /categorias funciona.
[ ] /sincronizar funciona.
[ ] /ayuda funciona.

---

# 60. NO HACER EN EL MVP

No implementar:

- APIs bancarias.
- Open Banking.
- Scraping bancario.
- WhatsApp.
- Aplicación nativa Android.
- Aplicación nativa iOS.
- IA.
- OCR.
- Importación PDF.
- Importación Excel.
- Importación CSV.
- Presupuestos avanzados.
- Cuotas.
- Estados de cuenta completos.
- Cálculo automático de deuda futura.
- Inversiones.
- Criptomonedas.
- Multiusuario avanzado.
- Suscripciones.
- Pagos.
- Monetización.

La prioridad es conseguir un flujo estable:

Gmail → Transacción → Supabase → Dashboard → Telegram.

---

# 61. DESARROLLO

Antes de programar:

1. Analizar todo este requerimiento.
2. Proponer estructura del proyecto.
3. Crear el schema SQL.
4. Crear migrations.
5. Crear tipos TypeScript.
6. Crear interfaces de servicios.
7. Implementar autenticación.
8. Implementar Gmail OAuth.
9. Implementar parser BCP.
10. Implementar parser Interbank.
11. Implementar normalización.
12. Implementar deduplicación.
13. Implementar tarjetas/personas.
14. Implementar categorías.
15. Implementar dashboard.
16. Implementar PWA.
17. Implementar Telegram.
18. Crear tests.
19. Crear documentación.
20. Preparar deployment en Vercel.

No generar todo en un único archivo.

No crear componentes gigantes.

No duplicar lógica.

Usar funciones pequeñas y reutilizables.

---

# 62. PRINCIPIO IMPORTANTE PARA EL DESARROLLO

No asumir datos que no están disponibles.

Si un parser necesita información que no aparece en los correos proporcionados:

- marcar el campo como opcional
- no inventar valores
- crear `needs_review` cuando sea necesario

No hacer scraping.

No pedir credenciales bancarias.

No guardar contraseñas bancarias.

---

# 63. DOCUMENTACIÓN

Crear:

README.md

Debe explicar:

- qué es Kipu
- arquitectura
- instalación local
- variables de entorno
- configuración de Supabase
- configuración de Google Cloud
- configuración de Gmail OAuth
- configuración de Telegram Bot
- migraciones
- ejecución local
- tests
- deployment en Vercel
- limitaciones actuales
- roadmap

Crear:

docs/architecture.md

docs/gmail.md

docs/telegram.md

docs/database.md

docs/deployment.md

---

# 64. GOOGLE CLOUD

Documentar claramente cómo configurar:

Google Cloud Project

Gmail API

OAuth consent screen

OAuth Client

Redirect URI

Scopes

Usuarios de prueba

No asumir que Google Cloud ya está configurado.

No colocar credenciales en código.

---

# 65. TELEGRAM

Documentar:

Crear bot mediante BotFather.

Configurar:

TELEGRAM_BOT_TOKEN

Configurar webhook.

La URL será:

${NEXT_PUBLIC_APP_URL}/api/telegram/webhook

Usar un mecanismo para validar el webhook.

No utilizar polling en producción.

---

# 66. VERCEL

La aplicación debe poder desplegarse en Vercel.

Documentar todas las variables de entorno necesarias.

No depender de procesos persistentes.

Recordar que las funciones serverless tienen límites de ejecución.

Por eso Gmail sync debe ser eficiente y tolerante a interrupciones.

---

# 67. CALIDAD DEL CÓDIGO

Utilizar:

- TypeScript estricto.
- ESLint.
- Prettier si se considera necesario.
- Zod.
- manejo explícito de errores.
- tipos claros.
- funciones pequeñas.
- comentarios solamente cuando aporten valor.

No usar `any` salvo casos realmente justificados.

---

# 68. RESULTADO ESPERADO

Al finalizar debo poder:

1. Ejecutar Kipu localmente.
2. Crear mi usuario.
3. Conectar Gmail.
4. Agregar mis tarjetas.
5. Indicar que BCP ****8795 pertenece a "Yo".
6. Indicar que otra tarjeta BCP pertenece a "Hermano".
7. Sincronizar Gmail.
8. Ver mis gastos.
9. Ver los gastos de mi hermano separados.
10. Ver categorías.
11. Recibir nuevas transacciones en Telegram.
12. Consultar `/resumen`.
13. Consultar `/gastos`.
14. Consultar `/tarjetas`.
15. Instalar Kipu en el celular desde el navegador.
16. Desplegar el sistema en Vercel.

---

# 69. REGLA FINAL

No sobreingenierizar.

Construir primero un MVP funcional y mantenible.

Si una funcionalidad no es necesaria para completar:

Gmail → procesamiento → gasto → Supabase → PWA → Telegram

dejarla para el roadmap.

Cuando exista una decisión técnica ambigua, elegir la solución:

- más simple
- segura
- mantenible
- compatible con Vercel
- compatible con Supabase
- adecuada para una aplicación personal

Antes de implementar cambios estructurales importantes, explicar brevemente la decisión y continuar con la implementación.

Al finalizar cada etapa, ejecutar tests y verificar que no se hayan roto funcionalidades existentes.