import { NextResponse } from "next/server";
import {
  cleanText,
  getMailConfig,
  isValidEmail,
  normalizeLang,
  renderAdminEmail,
  renderAutoReply,
} from "@/lib/server/mail";

export const runtime = "nodejs";

const copy = {
  pt: {
    invalid: "Dados inválidos. Confirma os campos e tenta novamente.",
    failed: "Não foi possível enviar agora. Tenta novamente dentro de instantes.",
    success: "Interesse enviado com sucesso. Responderemos em até 48h.",
    teamSubject: "Novo interesse de investidor — ASC Axiom Tech",
    teamIntro: "Recebeste um novo lead de investidor a partir do site.",
    labels: { name: "Nome", email: "Email", amount: "Montante", message: "Mensagem", lang: "Idioma" },
    replySubject: "Obrigado pelo teu interesse na ASC Axiom Tech",
    replyTitle: "Recebemos o teu interesse",
    replyBody: "Obrigado pelo interesse em investir na ASC Axiom Tech. A nossa equipa vai responder em até 48 horas com os próximos passos.",
    replyCta: "Conhecer a ASC Axiom Tech",
  },
  en: {
    invalid: "Invalid data. Please review the fields and try again.",
    failed: "We couldn't send this right now. Please try again in a moment.",
    success: "Interest sent successfully. We'll reply within 48 hours.",
    teamSubject: "New investor interest — ASC Axiom Tech",
    teamIntro: "You received a new investor lead from the website.",
    labels: { name: "Name", email: "Email", amount: "Amount", message: "Message", lang: "Language" },
    replySubject: "Thank you for your interest in ASC Axiom Tech",
    replyTitle: "We received your interest",
    replyBody: "Thank you for your interest in investing in ASC Axiom Tech. Our team will reply within 48 hours with the next steps.",
    replyCta: "Discover ASC Axiom Tech",
  },
  es: {
    invalid: "Datos inválidos. Revisa los campos e inténtalo de nuevo.",
    failed: "No fue posible enviar ahora. Inténtalo de nuevo en un momento.",
    success: "Interés enviado correctamente. Responderemos en 48 horas.",
    teamSubject: "Nuevo interés de inversor — ASC Axiom Tech",
    teamIntro: "Has recibido un nuevo lead de inversor desde el sitio web.",
    labels: { name: "Nombre", email: "Email", amount: "Monto", message: "Mensaje", lang: "Idioma" },
    replySubject: "Gracias por tu interés en ASC Axiom Tech",
    replyTitle: "Hemos recibido tu interés",
    replyBody: "Gracias por tu interés en invertir en ASC Axiom Tech. Nuestro equipo responderá en un plazo de 48 horas con los próximos pasos.",
    replyCta: "Descubrir ASC Axiom Tech",
  },
} as const;

export async function POST(request: Request) {
  let payload: Record<string, unknown>;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: copy.pt.invalid }, { status: 400 });
  }

  const lang = normalizeLang(payload.lang);
  const t = copy[lang];
  const name = cleanText(payload.name);
  const email = cleanText(payload.email);
  const amount = cleanText(payload.amount);
  const message = cleanText(payload.message);

  if (!name || !email || !amount || !isValidEmail(email)) {
    return NextResponse.json({ error: t.invalid }, { status: 400 });
  }

  try {
    const { resend, config } = getMailConfig("investors");

    const adminHtml = renderAdminEmail(t.teamSubject, t.teamIntro, [
      { label: t.labels.name, value: name },
      { label: t.labels.email, value: email },
      { label: t.labels.amount, value: amount },
      { label: t.labels.message, value: message || "-" },
      { label: t.labels.lang, value: lang.toUpperCase() },
    ]);

    const adminText = [
      t.teamSubject,
      `${t.labels.name}: ${name}`,
      `${t.labels.email}: ${email}`,
      `${t.labels.amount}: ${amount}`,
      `${t.labels.message}: ${message || "-"}`,
      `${t.labels.lang}: ${lang.toUpperCase()}`,
    ].join("\n");

    const { error } = await resend.emails.send({
      from: config.from,
      to: config.to,
      replyTo: email,
      subject: t.teamSubject,
      html: adminHtml,
      text: adminText,
    });

    if (error) {
      throw new Error(error.message);
    }

    void resend.emails.send({
      from: config.from,
      to: email,
      subject: t.replySubject,
      html: renderAutoReply(t.replyTitle, t.replyBody, t.replyCta, "https://ascaxiomtech.com/#investidores"),
      text: `${t.replyTitle}\n\n${t.replyBody}\n\nhttps://ascaxiomtech.com/#investidores`,
    }).catch(() => undefined);

    return NextResponse.json({ ok: true, message: t.success });
  } catch {
    return NextResponse.json({ error: t.failed }, { status: 500 });
  }
}
