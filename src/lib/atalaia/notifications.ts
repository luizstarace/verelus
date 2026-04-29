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

export function buildBSPProvisioningEmail(businessName: string, dashboardUrl: string): NotifyOwnerParams {
  return {
    to: '',
    subject: `[Atalaia] Estamos preparando seu número WhatsApp oficial`,
    html: `
      <div style="font-family:Inter,sans-serif;max-width:520px;margin:0 auto;color:#0f172a;">
        <h2 style="color:#1e3a5f;">Seu número oficial está a caminho</h2>
        <p>O <strong>${businessName}</strong> vai receber um número WhatsApp Business <strong>oficial</strong>, gerenciado pela Verelus. Sem usar seu WhatsApp pessoal.</p>
        <p style="background:#f1f5f9;padding:12px 16px;border-left:3px solid #1e3a5f;border-radius:0 8px 8px 0;">
          <strong>Prazo:</strong> 3 a 7 dias úteis (verificação Meta).
        </p>
        <p>Enquanto isso, você pode conectar um número provisório (QR code) e começar a atender clientes <strong>hoje</strong>. Quando o oficial ficar pronto, a migração é automática — seu histórico fica salvo.</p>
        <a href="${dashboardUrl}" style="display:inline-block;background:#f59e0b;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;margin-top:16px;">Conectar provisório →</a>
      </div>
    `,
  };
}

export function buildBSPApprovedEmail(businessName: string, phoneNumber: string, dashboardUrl: string): NotifyOwnerParams {
  return {
    to: '',
    subject: `[Atalaia] Seu número oficial está ativo: ${phoneNumber}`,
    html: `
      <div style="font-family:Inter,sans-serif;max-width:520px;margin:0 auto;color:#0f172a;">
        <h2 style="color:#1e3a5f;">Número oficial ativo</h2>
        <p>O <strong>${businessName}</strong> agora atende pelo número WhatsApp Business oficial:</p>
        <p style="font-size:22px;font-weight:bold;color:#1e3a5f;background:#f1f5f9;padding:16px;border-radius:8px;text-align:center;letter-spacing:0.5px;">${phoneNumber}</p>
        <p>Compartilhe esse número com seus clientes (site, Instagram, cartão). O histórico de conversas anteriores está preservado no painel.</p>
        <p style="color:#64748b;font-size:13px;">Sem risco de banimento. Sem usar seu WhatsApp pessoal. Tudo automático.</p>
        <a href="${dashboardUrl}" style="display:inline-block;background:#f59e0b;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;margin-top:16px;">Ver inbox →</a>
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
