import type { Metadata } from "next";
import { LegalShell } from "@/components/layout/legal-shell";

export const metadata: Metadata = {
  title: "Condiciones del Servicio | Kipu",
  description: "Condiciones del Servicio de Kipu",
};

const SECTIONS: Array<{ title: string; body: string[] }> = [
  {
    title: "1. Aceptación de las condiciones",
    body: [
      "Estas Condiciones del Servicio rigen el acceso y uso de la aplicación Kipu. Al crear una cuenta, iniciar sesión o utilizar cualquiera de las funcionalidades de la aplicación, aceptas estas condiciones y te comprometes a cumplirlas. Si no estás de acuerdo con ellas, por favor no utilices el servicio.",
    ],
  },
  {
    title: "2. Descripción del servicio",
    body: [
      "Kipu es una aplicación de finanzas personales que lee tus notificaciones bancarias en Gmail, extrae las transacciones, las categoriza automáticamente y te muestra resúmenes mensuales y análisis de tus gastos. El servicio incluye, de forma no taxativa: sincronización de correos, categorización de transacciones, gestión de tarjetas y cuentas, y notificaciones opcionales por Telegram.",
    ],
  },
  {
    title: "3. Requisitos para usar el servicio",
    body: [
      "Debes ser mayor de edad o, en su caso, contar con la autorización de tus padres o tutores para usar el servicio. Debes proporcionar información veraz al registrar tu cuenta y mantenerte responsable del uso de tu cuenta y contraseña. No debes permitir que terceros accedan a tu cuenta con tu credenciales.",
    ],
  },
  {
    title: "4. Cuenta e inicio de sesión",
    body: [
      "Tú eres el responsable de conservar la confidencialidad de tus credenciales de acceso y de todas las actividades que ocurran bajo tu cuenta. Kipu puede suspender o cancelar una cuenta si detecta un uso indebido o fraudulento. Si usas tu cuenta de Google para iniciar sesión, la autenticación se realiza a través de los servicios de Google y te regirás también por las políticas de Google.",
    ],
  },
  {
    title: "5. Conexión con Gmail",
    body: [
      "Al conectar tu cuenta de Gmail, autorizas a Kipu a acceder en modo de solo lectura a tus correos para detectar transacciones bancarias. Solo accedemos a la información necesaria para prestar el servicio y no enviamos ni modificamos mensajes en tu nombre. El acceso puede revocarse en cualquier momento desde la configuración de permisos de tu cuenta de Google.",
    ],
  },
  {
    title: "6. Uso aceptable",
    body: [
      "Te comprometes a utilizar Kipu solo con fines legales. Queda prohibido, entre otros: intentar acceder a cuentas de otros usuarios, interferir con el funcionamiento de la aplicación, utilizar el servicio para almacenar o procesar información a la que no tengas derecho, y vulnerar los derechos de terceros o la normativa aplicable.",
    ],
  },
  {
    title: "7. Propiedad de los datos y derechos de autor",
    body: [
      "Los datos que registras en Kipu son y seguirán siendo de tu propiedad. Al usar el servicio nos otorgas una licencia limitada para procesarlos con la finalidad de prestarte el servicio. La aplicación, su diseño, su software y su contenido (a excepción de tus propios datos) son propiedad de Kipu o de sus licenciantes y están protegidos por las leyes de propiedad intelectual.",
    ],
  },
  {
    title: "8. Precisión de la información",
    body: [
      "Kipu procesa la información disponible en tus correos bancarios con herramientas automáticas y, en algunos casos, con inteligencia artificial. Aunque realizamos esfuerzos razonables por extraer y clasificar correctamente tus transacciones, Kipu no garantiza la exactitud absoluta de los resultados y no sustituye el estado de cuenta oficial de tu banco. Eres responsable de revisar y confirmar la información para decisiones financieras.",
    ],
  },
  {
    title: "9. Limitación de responsabilidad",
    body: [
      "Kipu se proporciona «tal cual» y «según disponibilidad», sin garantías expresas o implícitas de funcionamiento, disponibilidad o idoneidad para un propósito particular. En la máxima medida permitida por la ley, Kipu no será responsable por daños directos, indirectos, incidentales, especiales o consecuentes derivados del uso o de la imposibilidad de uso del servicio, incluidos errores en el procesamiento de tus datos o decisiones tomadas a partir de la información mostrada.",
    ],
  },
  {
    title: "10. Suspensión y terminación",
    body: [
      "Puedes dejar de usar Kipu y solicitar la eliminación de tu cuenta en cualquier momento. Kipu podrá suspender y/o dar por terminado el acceso de una cuenta que infrinja estas condiciones o cuya conducta ponga en riesgo al servicio o a otros usuarios. Al terminar el servicio, dejarán de procesarse tus datos de acuerdo con lo previsto en la Política de Privacidad.",
    ],
  },
  {
    title: "11. Modificaciones al servicio y a estas condiciones",
    body: [
      "Kipu puede modificar estas Condiciones del Servicio de forma ocasional para reflejar cambios en la funcionalidad, la normativa o la operación. Las modificaciones entrarán en vigencia al publicarse en esta página, y el uso continuado del servicio tras el cambio implica la aceptación de la nueva versión. Asimismo, el servicio puede actualizarse, mejorarse o ajustarse sin previo aviso.",
    ],
  },
  {
    title: "12. Legislación aplicable",
    body: [
      "Estas condiciones se rigen por las leyes del Perú. Para cualquier controversia derivada del uso del servicio, las partes se someten a la jurisdicción de los juzgados y tribunales competentes de la República del Perú.",
    ],
  },
  {
    title: "13. Contacto",
    body: [
      "Si tienes dudas o reclamos sobre estas condiciones, escríbenos a scorvachoa@gmail.com.",
      "Última actualización: 18 de agosto de 2026.",
    ],
  },
];

export default function TermsPage() {
  return (
    <LegalShell>
      <div className="space-y-10">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">
            Condiciones del Servicio
          </h1>
          <p className="text-sm text-muted-foreground">
            Última actualización: 18 de agosto de 2026
          </p>
        </div>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Estas Condiciones del Servicio establecen los términos y condiciones
          bajo los cuales puedes usar Kipu, la aplicación de gestión automática
          de gastos personales desde Gmail. Al utilizarla aceptas los términos
          descritos a continuación junto con nuestra Política de Privacidad.
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