interface NotifyOwnerParams {
  to: string;
  subject: string;
  html: string;
}

export async function notifyOwnerEmail(params: NotifyOwnerParams) {
  try {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Atalaia <contato@verelus.com>',
        to: params.to,
        subject: params.subject,
        html: params.html,
      }),
    });
  } catch (err) {
    console.error('Failed to send notification email:', err);
  }
}

export function buildTransferEmail(businessName: string, customerName: string, conversationUrl: string): NotifyOwnerParams {
  return {
    to: '',
    subject: `[Atalaia] ${customerName || 'Cliente'} precisa da sua atenção`,
    html: `
      <div style="font-family:Inter,sans-serif;max-width:500px;margin:0 auto;">
        <h2 style="color:#1e3a5f;">Transferência solicitada</h2>
        <p>Um cliente de <strong>${businessName}</strong> precisa de atendimento humano.</p>
        <a href="${conversationUrl}" style="display:inline-block;background:#f59e0b;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;margin-top:16px;">Ver conversa →</a>
      </div>
    `,
  };
}

export function buildUsageAlertEmail(businessName: string, percentage: number, billingUrl: string): NotifyOwnerParams {
  return {
    to: '',
    subject: `[Atalaia] Uso em ${percentage}% do limite`,
    html: `
      <div style="font-family:Inter,sans-serif;max-width:500px;margin:0 auto;">
        <h2 style="color:#1e3a5f;">Alerta de uso</h2>
        <p>Seu atendente <strong>${businessName}</strong> está com ${percentage}% do limite de mensagens usado.</p>
        <a href="${billingUrl}" style="display:inline-block;background:#f59e0b;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;margin-top:16px;">Ver plano →</a>
      </div>
    `,
  };
}

export function buildTrialExpiryEmail(businessName: string, daysLeft: number, checkoutUrl: string): NotifyOwnerParams {
  return {
    to: '',
    subject: `[Atalaia] Seu trial acaba em ${daysLeft} dia${daysLeft > 1 ? 's' : ''}`,
    html: `
      <div style="font-family:Inter,sans-serif;max-width:500px;margin:0 auto;">
        <h2 style="color:#1e3a5f;">Trial expirando</h2>
        <p>O trial de <strong>${businessName}</strong> acaba em ${daysLeft} dia${daysLeft > 1 ? 's' : ''}.</p>
        <p>Adicione seu cartão para continuar usando o Atalaia sem interrupção.</p>
        <a href="${checkoutUrl}" style="display:inline-block;background:#f59e0b;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;margin-top:16px;">Ativar plano →</a>
      </div>
    `,
  };
}

export function buildWhatsAppDisconnectedEmail(businessName: string, supportUrl: string): NotifyOwnerParams {
  return {
    to: '',
    subject: `[Atalaia] WhatsApp do ${businessName} caiu`,
    html: `
      <div style="font-family:Inter,sans-serif;max-width:500px;margin:0 auto;">
        <h2 style="color:#b91c1c;">Conexão WhatsApp interrompida</h2>
        <p>A conexão do WhatsApp de <strong>${businessName}</strong> caiu. Enquanto isso, a IA não consegue responder mensagens.</p>
        <p><strong>Causa mais comum:</strong> "timelock" do WhatsApp — restrição temporária de 24-72h quando ele detecta padrão de automação. Some sozinho. Tente reconectar mais tarde.</p>
        <p>Se a conexão não voltar em 72h, pode ser banimento permanente do número. Use o suporte abaixo para pedir ajuda.</p>
        <a href="${supportUrl}" style="display:inline-block;background:#f59e0b;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;margin-top:16px;">Pedir ajuda →</a>
      </div>
    `,
  };
}

export function buildSupportTicketEmail(
  businessName: string,
  ownerEmail: string,
  category: string,
  message: string,
  ticketId: string
): NotifyOwnerParams {
  const categoryLabel: Record<string, string> = {
    whatsapp_ban: 'WhatsApp banido',
    whatsapp_disconnect: 'WhatsApp desconectado',
    other: 'Outro assunto',
  };
  return {
    to: '',
    subject: `[Atalaia Suporte] ${categoryLabel[category] || category} — ${businessName}`,
    html: `
      <div style="font-family:Inter,sans-serif;max-width:600px;margin:0 auto;">
        <h2 style="color:#1e3a5f;">Novo ticket de suporte</h2>
        <p><strong>Negócio:</strong> ${businessName}</p>
        <p><strong>Cliente:</strong> ${ownerEmail}</p>
        <p><strong>Categoria:</strong> ${categoryLabel[category] || category}</p>
        <p><strong>Ticket:</strong> ${ticketId}</p>
        <hr style="border:none;border-top:1px solid #e2e8f0;margin:16px 0;" />
        <p style="white-space:pre-wrap;background:#f8fafc;padding:12px;border-radius:8px;">${message.replace(/[<>]/g, (c) => (c === '<' ? '&lt;' : '&gt;'))}</p>
      </div>
    `,
  };
}
