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
