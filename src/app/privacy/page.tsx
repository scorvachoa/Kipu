import type { Metadata } from "next";
import { LegalShell } from "@/components/layout/legal-shell";

export const metadata: Metadata = {
  title: "Política de Privacidad | Kipu",
  description: "Política de Privacidad de Kipu",
};

const SECTIONS: Array<{ title: string; body: string[] }> = [
  {
    title: "1. Responsable del tratamiento",
    body: [
      "El responsable del tratamiento de los datos personales del servicio Kipu es el operador de la aplicación, a quien puedes contactar a través de scorvachoa@gmail.com para cualquier consulta sobre esta política o el uso de tus datos.",
    ],
  },
  {
    title: "2. Información que recopilamos",
    body: [
      "Información de la cuenta: correo electrónico y método de autenticación (contraseña o cuenta de Google) que utilizas para acceder a Kipu.",
      "Datos de tus correos bancarios: cuando autorizas la conexión con tu cuenta de Gmail, Kipu accede en modo de solo lectura a los correos de tu proveedor de correo y extrae los datos de transacciones bancarias (montos, fechas, tarjetas, comercios y demás información de tus notificaciones financieras).",
      "Información financiera derivada: las transacciones, tarjetas, cuentas, categorías y personas vinculadas a tus movimientos que generas a lo largo del uso del servicio.",
      "Conectividad opcional: si decides conectar tu cuenta de Telegram, recopilamos el identificador de usuario de Telegram y las preferencias de notificación que configures.",
    ],
  },
  {
    title: "3. Finalidades del tratamiento",
    body: [
      "Proveer el servicio de gestión automática de gastos personales a partir de tus notificaciones bancarias en Gmail.",
      "Extraer, normalizar y categorizar tus transacciones para mostrarte resúmenes mensuales, reportes y análisis de gastos.",
      "Enviarte notificaciones por Telegram solo si lo activas voluntariamente.",
      "Mejorar la exactitud del procesamiento de transacciones y los modelos internos de categorización.",
      "Cumplir obligaciones legales y prevenir el fraude o el uso indebido del servicio.",
    ],
  },
  {
    title: "4. Base legal",
    body: [
      "Tratamos tus datos con base en el consentimiento que otorgas al crear tu cuenta, aceptar estos términos y autorizar la conexión con tu Gmail o Telegram. Puedes retirar tu consentimiento en cualquier momento revocando los accesos o solicitando la eliminación de tus datos.",
    ],
  },
  {
    title: "5. Uso de la API de Gmail",
    body: [
      "Kipu utiliza la API de Gmail de Google para leer, en modo de solo lectura, las notificaciones financieras que los bancos envían a tu correo. El acceso a tus correos se limita exclusivamente a los mensajes necesarios para detectar y procesar transacciones de bancos compatibles.",
      "Kipu no envía mensajes por tu cuenta de Gmail, no modifica tus correos y no comparte el contenido de estos con terceros con fines publicitarios. Este acceso lo puedes revocar en cualquier momento desde la configuración de tu cuenta de Google en https://myaccount.google.com/permissions.",
    ],
  },
  {
    title: "6. Uso de inteligencia artificial y proveedores de terceros",
    body: [
      "Para extraer y categorizar transacciones, Kipu puede enviar el contenido de algunos de tus correos financieros a proveedores externos de inteligencia artificial (como Groq u OpenRouter) con el fin de interpretar el mensaje y generar la transacción correspondiente. Estos proveedores reciben únicamente la información necesaria para procesar el correo y no la usamos para fines publicitarios.",
      "La información enviada a estos proveedores puede tratarse conforme a las políticas de privacidad de cada proveedor. No almacenamos los correos con fines distintos a la extracción de tus transacciones.",
    ],
  },
  {
    title: "7. Destinatarios y transferencias de datos",
    body: [
      "Podemos compartir tus datos con proveedores técnicos que nos ayudan a operar el servicio, como el proveedor de alojamiento y base de datos (hosting) y las plataformas de inteligencia artificial mencionadas anteriormente.",
      "Tus datos pueden ser transferidos a países distintos del país donde resides cuando los prestadores de servicios se encuentren en el extranjero, sujeto a las garantías que exige la normativa aplicable de protección de datos.",
      "Solo divulgaremos tus datos a autoridades cuando exista un requerimiento legal válido.",
    ],
  },
  {
    title: "8. Conservación de los datos",
    body: [
      "Conservamos tus datos mientras mantengas tu cuenta activa y mientras los necesitemos para cumplir con las finalidades descritas o con obligaciones legales. Puedes eliminar tu cuenta para solicitar que se dejen de procesar y de conservar tus datos. Algunos registros anonimizados podrían conservarse con fines estadísticos.",
    ],
  },
  {
    title: "9. Seguridad",
    body: [
      "Adoptamos medidas técnicas y organizativas razonables para proteger tus datos: cifrado en tránsito (HTTPS) y en reposo, aislamiento de datos por usuario a nivel de base de datos (políticas de seguridad a nivel de fila) y cifrado de los tokens de acceso a servicios externos.",
      "El acceso a Kipu está protegido por autenticación con contraseña o con tu cuenta de Google, y las sesiones vencen conforme a nuestra configuración de seguridad.",
    ],
  },
  {
    title: "10. Tus derechos",
    body: [
      "De acuerdo con la normativa de protección de datos aplicable, puedes ejercer los derechos de acceso, rectificación, supresión, oposición, limitación y portabilidad de tus datos, así como retirar el consentimiento otorgado.",
      "Para ejercer estos derechos o solicitar la eliminación de tu cuenta, escríbenos a scorvachoa@gmail.com indicando el motivo y la información necesaria para identificarte. Atenderemos tu solicitud en los plazos previstos por la ley.",
      "También puedes revocar el acceso a tu Gmail desde la configuración de tu cuenta de Google, y eliminar tu conexión de Telegram desde la configuración de Kipu.",
    ],
  },
  {
    title: "11. Cookies y almacenamiento local",
    body: [
      "Kipu utiliza cookies y almacenamiento local del navegador para mantener tu sesión iniciada y recordar preferencias como el tema visual. Esta información no se utiliza con fines publicitarios.",
    ],
  },
  {
    title: "12. Cambios en esta política",
    body: [
      "Podemos actualizar esta Política de Privacidad cuando sea necesario para reflejar cambios en el servicio o en la normativa. Te avisaremos de los cambios relevantes a través de la aplicación o al correo asociado a tu cuenta, y la versión vigente estará siempre disponible en esta página.",
    ],
  },
  {
    title: "13. Contacto",
    body: [
      "Si tienes preguntas sobre esta Política de Privacidad o sobre el tratamiento de tus datos personales, escríbenos a scorvachoa@gmail.com.",
      "Última actualización: 18 de agosto de 2026.",
    ],
  },
];

export default function PrivacyPage() {
  return (
    <LegalShell>
      <div className="space-y-10">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">
            Política de Privacidad
          </h1>
          <p className="text-sm text-muted-foreground">
            Última actualización: 18 de agosto de 2026
          </p>
        </div>
        <p className="text-sm leading-relaxed text-muted-foreground">
          En Kipu entendemos la privacidad de tus datos financieros como una
          responsabilidad central. Esta política explica qué información
          recopilamos, cómo la usamos, con quién la compartimos y qué derechos
          tienes sobre ella. Al usar Kipu aceptas el tratamiento de tus datos
          conforme a lo descrito en este documento.
        </p>
        {SECTIONS.map((section) => (
          <section key={section.title} className="space-y-3">
            <h2 className="text-lg font-semibold">{section.title}</h2>
            {section.body.map((paragraph, index) => (
              <p
                key={index}
                className="text-sm leading-relaxed text-muted-foreground"
              >
                {paragraph}
              </p>
            ))}
          </section>
        ))}
      </div>
    </LegalShell>
  );
}