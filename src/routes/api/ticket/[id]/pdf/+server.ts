import type { RequestHandler } from "@sveltejs/kit";
import prisma from "$lib/prisma";
import { verifyJwt } from "$lib/jwt";
import PDFDocument from "pdfkit";
import QRCode from "qrcode";
import path from "path";

const FONT_REGULAR = path.resolve("node_modules/pdfjs-dist/standard_fonts/LiberationSans-Regular.ttf");
const FONT_BOLD = path.resolve("node_modules/pdfjs-dist/standard_fonts/LiberationSans-Bold.ttf");

export const GET: RequestHandler = async ({ params, cookies, url }) => {
  const token = cookies.get("auth_token");
  if (!token) return new Response("Unauthorized", { status: 401 });

  let payload: any;
  try {
    payload = await verifyJwt(token);
  } catch {
    return new Response("Invalid token", { status: 401 });
  }

  const userId = payload?.uid;
  if (!userId) return new Response("Invalid token", { status: 401 });

  const eventId = params.id;

  const registration = await prisma.eventRegistration.findUnique({
    where: { userId_eventId: { userId, eventId } },
    include: {
      event: true,
      user: {
        select: {
          email: true,
          info: { select: { name: true } },
        },
      },
    },
  });

  if (!registration) {
    return new Response("Registration not found", { status: 404 });
  }

  const event = registration.event;
  const userName = registration.user.info?.name ?? registration.user.email;

  // Generate real QR code as PNG buffer
  const qrData = `${url.origin}/events/${eventId}?ticket=${registration.id}`;
  const qrPngBuffer = await QRCode.toBuffer(qrData, {
    type: "png",
    width: 200,
    margin: 1,
    color: { dark: "#0f172a", light: "#ffffff" },
    errorCorrectionLevel: "M",
  });

  const doc = new PDFDocument({
    size: [595.28, 841.89], // A4
    margin: 0,
  });

  // Register Unicode fonts
  doc.registerFont("Regular", FONT_REGULAR);
  doc.registerFont("Bold", FONT_BOLD);

  const chunks: Buffer[] = [];
  doc.on("data", (chunk: Buffer) => chunks.push(chunk));

  const pdfReady = new Promise<Buffer>((resolve) => {
    doc.on("end", () => resolve(Buffer.concat(chunks)));
  });

  // --- Background ---
  doc.rect(0, 0, 595.28, 841.89).fill("#f8fafc");

  // --- Ticket card ---
  const cardX = 47;
  const cardY = 60;
  const cardW = 500;
  const cardH = 720;

  // Card shadow
  doc.roundedRect(cardX + 2, cardY + 4, cardW, cardH, 16).fill("#e2e8f0");
  // Card
  doc.roundedRect(cardX, cardY, cardW, cardH, 16).fill("#ffffff");

  // Accent top bar
  doc.save();
  doc.roundedRect(cardX, cardY, cardW, 24, 16).clip();
  doc.rect(cardX, cardY, cardW, 24).fill("#4f46e5");
  doc.restore();

  // --- Header ---
  doc.font("Bold").fontSize(11).fillColor("#4f46e5");
  doc.text("CBC EVENT TICKET", cardX + 32, cardY + 42, { width: cardW - 64 });

  // --- Event title ---
  doc.font("Bold").fontSize(24).fillColor("#0f172a");
  doc.text(event.title, cardX + 32, cardY + 64, {
    width: cardW - 64,
    lineGap: 4,
  });

  // --- Divider ---
  const divY = cardY + 140;
  doc
    .moveTo(cardX + 32, divY)
    .lineTo(cardX + cardW - 32, divY)
    .strokeColor("#e2e8f0")
    .lineWidth(1)
    .stroke();

  // --- Info rows ---
  let rowY = divY + 20;

  function drawInfoRow(label: string, value: string) {
    doc.font("Regular").fontSize(10).fillColor("#94a3b8");
    doc.text(label, cardX + 32, rowY, { width: 120 });
    doc.font("Bold").fontSize(13).fillColor("#0f172a");
    doc.text(value, cardX + 160, rowY - 1, { width: cardW - 200 });
    rowY += 36;
  }

  const eventDate = new Date(event.date);
  const dateStr = eventDate.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const timeStr = eventDate.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });

  drawInfoRow("DATE", dateStr);
  drawInfoRow("TIME", timeStr);
  drawInfoRow("LOCATION", event.location || "TBA");
  drawInfoRow("ATTENDEE", userName);
  drawInfoRow("TICKET TYPE", event.price ? `$${event.price}` : "Free");
  drawInfoRow("TICKET ID", registration.id.slice(0, 12).toUpperCase());

  // --- Dashed tear line ---
  const tearY = rowY + 24;
  doc.strokeColor("#cbd5e1").lineWidth(1);
  doc.dash(6, { space: 4 });
  doc.moveTo(cardX + 16, tearY).lineTo(cardX + cardW - 16, tearY).stroke();
  doc.undash();

  // Tear semicircles
  doc.save();
  doc.circle(cardX, tearY, 14).fill("#f8fafc");
  doc.circle(cardX + cardW, tearY, 14).fill("#f8fafc");
  doc.restore();

  // --- QR Code ---
  const qrSize = 150;
  const qrX = cardX + (cardW - qrSize) / 2;
  const qrY = tearY + 30;

  // QR background
  doc.roundedRect(qrX - 10, qrY - 10, qrSize + 20, qrSize + 20, 10)
    .fillAndStroke("#ffffff", "#e2e8f0");

  // Embed real QR code image
  doc.image(qrPngBuffer, qrX, qrY, { width: qrSize, height: qrSize });

  // --- Footer text ---
  const footerY = qrY + qrSize + 30;
  doc.font("Regular").fontSize(9).fillColor("#94a3b8");
  doc.text("Scan QR code or present this ticket at the event entrance", cardX + 32, footerY, {
    width: cardW - 64,
    align: "center",
  });

  doc.font("Bold").fontSize(11).fillColor("#4f46e5");
  doc.text("Cyprus Business Club", cardX + 32, footerY + 22, {
    width: cardW - 64,
    align: "center",
  });

  doc.font("Regular").fontSize(8).fillColor("#cbd5e1");
  doc.text(
    `Generated on ${new Date().toLocaleDateString("en-US")}`,
    cardX + 32,
    cardY + cardH - 36,
    { width: cardW - 64, align: "center" }
  );

  doc.end();
  const pdfBuffer = await pdfReady;

  return new Response(pdfBuffer, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="ticket-${eventId}.pdf"`,
      "Content-Length": String(pdfBuffer.length),
    },
  });
};
