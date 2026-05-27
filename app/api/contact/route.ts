import { NextResponse } from "next/server";
import {
  cleanText,
  getMailConfig,
  isValidEmail,
  normalizeLang,
  renderAdminEmail,
  renderAutoReply,
} from "@/lib/server/mail";

export const runtime = 'edge';

const copy = {
  pt: {
    invalid: "Dados inválidos. Confirma os campos e tenta novamente.",
    failed: "Não foi possível enviar a mensagem agora. Tenta novamente dentro de instantes.",
    success: "Mensagem enviada com sucesso. Responderemos em breve.",
    teamSubject: "Novo contacto — ASC Axiom Tech",
    teamIntro: "Recebeste uma nova mensagem enviada a partir do formulário de contacto do site.",
    labels: { name: "Nome", email: "Email", subject: "Assunto", message: "Mensagem", lang: "Idioma" },
    replySubject: "Recebemos a tua mensagem",
    replyTitle: "Obrigado pelo contacto",
    replyBody: "Recebemos a tua mensagem e a nossa equipa vai responder o mais breve possível.",
    replyCta: "Visitar o site",
  },
  en: {
    invalid: "Invalid data. Please review the fields and try again.",
    failed: "We couldn't send your message right now. Please try again in a moment.",
    success: "Message sent successfully. We'll get back to you soon.",
    teamSubject: "New contact message — ASC Axiom Tech",
    teamIntro: "You received a new message from the website contact form.",
    labels: { name: "Name", email: "Email", subject: "Subject", message: "Message", lang: "Language" },
    replySubject: "We received your message",
    replyTitle: "Thanks for reaching out",
    replyBody: "We received your message and our team will get back to you as soon as possible.",
    replyCta: "Visit the website",
  },
  es: {
    invalid: "Datos inválidos. Revisa los campos e inténtalo de nuevo.",
    failed: "No fue posible enviar tu mensaje ahora. Inténtalo de nuevo en un momento.",
    success: "Mensaje enviado correctamente. Responderemos pronto.",
    teamSubject: "Nuevo contacto — ASC Axiom Tech",
    teamIntro: "Has recibido un nuevo mensaje desde el formulario de contacto del sitio.",
    labels: { name: "Nombre", email: "Email", subject: "Asunto", message: "Mensaje", lang: "Idioma" },
    replySubject: "Recibimos tu mensaje",
    replyTitle: "Gracias por contactarnos",
    replyBody: "Recibimos tu mensaje y nuestro equipo te responderá lo antes posible.",
    replyCta: "Visitar el sitio",
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
  const subject = cleanText(payload.subject);
  const message = cleanText(payload.message);

  if (!name || !email || !subject || !message || !isValidEmail(email)) {
    return NextResponse.json({ error: t.invalid }, { status: 400 });
  }

  try {
    const { resend, config } = getMailConfig("contact");

    const adminHtml = renderAdminEmail(t.teamSubject, t.teamIntro, [
      { label: t.labels.name, value: name },
      { label: t.labels.email, value: email },
      { label: t.labels.subject, value: subject },
      { label: t.labels.message, value: message },
      { label: t.labels.lang, value: lang.toUpperCase() },
    ]);

    const adminText = [
      t.teamSubject,
      `${t.labels.name}: ${name}`,
      `${t.labels.email}: ${email}`,
      `${t.labels.subject}: ${subject}`,
      `${t.labels.message}: ${message}`,
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
      html: renderAutoReply(t.replyTitle, t.replyBody, t.replyCta, "https://ascaxiomtech.com"),
      text: `${t.replyTitle}\n\n${t.replyBody}\n\nhttps://ascaxiomtech.com`,
    }).catch(() => undefined);

    return NextResponse.json({ ok: true, message: t.success });
  } catch {
    return NextResponse.json({ error: t.failed }, { status: 500 });
  }
}
