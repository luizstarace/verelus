interface NotifyOwnerParams {
  to: string;
  subject: string;
  html: string;
  /** Optional ISO 8601 timestamp. When set, Resend schedules delivery. */
  scheduledAt?: string;
}

export async function notifyOwnerEmail(params: NotifyOwnerParams) {
  try {
    const body: Record<string, unknown> = {
      from: 'Atalaia <contato@verelus.com>',
      to: params.to,
      subject: params.subject,
      html: params.html,
    };
    if (params.scheduledAt) {
      body.scheduled_at = params.scheduledAt;
    }
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
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

export function buildTwilioProvisioningEmail(businessName: string, dashboardUrl: string): NotifyOwnerParams {
  return {
    to: '',
    subject: `[Atalaia] Sua atendente está em preparação`,
    html: `
      <div style="font-family:Inter,sans-serif;max-width:520px;margin:0 auto;color:#0f172a;">
        <h2 style="color:#1e3a5f;">Bem-vindo ao Atalaia, ${businessName}</h2>
        <p>Seu número WhatsApp Business <strong>oficial Meta</strong> está sendo validado. Esse processo dura 3 a 5 dias úteis e garante que você terá um número 100% oficial — sem risco de banimento, sem usar seu WhatsApp pessoal.</p>
        <div style="background:#f1f5f9;padding:16px;border-left:3px solid #1e3a5f;border-radius:0 8px 8px 0;margin:20px 0;">
          <strong>Enquanto isso, vamos treinar sua atendente.</strong> Quanto mais informação você der agora, mais infalível ela será no primeiro 'oi' do cliente.
        </div>
        <p>Comece preenchendo:</p>
        <ul style="line-height:1.8;">
          <li>Os 5 serviços/produtos mais procurados</li>
          <li>Horários de atendimento (incluindo feriados)</li>
          <li>FAQ — as 10 perguntas que clientes mais fazem</li>
          <li>Como você se apresenta (ex: "Aqui é da Padaria do Pão")</li>
          <li>Tom de voz: formal, casual, animado ou profissional</li>
        </ul>
        <a href="${dashboardUrl}" style="display:inline-block;background:#f59e0b;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;margin-top:16px;">Treinar minha atendente →</a>
        <p style="color:#64748b;font-size:13px;margin-top:24px;">Amanhã você recebe parte 2 do treinamento: regras de transferência humana e casos especiais.</p>
      </div>
    `,
  };
}

export function buildTwilioApprovedEmail(businessName: string, phoneNumber: string, dashboardUrl: string): NotifyOwnerParams {
  return {
    to: '',
    subject: `[Atalaia] Seu número está ativo: ${phoneNumber}`,
    html: `
      <div style="font-family:Inter,sans-serif;max-width:520px;margin:0 auto;color:#0f172a;">
        <h2 style="color:#1e3a5f;">Número aprovado</h2>
        <p>Pronto, ${businessName}. Seu número WhatsApp Business oficial está ativo:</p>
        <p style="font-size:22px;font-weight:bold;color:#1e3a5f;background:#f1f5f9;padding:16px;border-radius:8px;text-align:center;letter-spacing:0.5px;">${phoneNumber}</p>
        <p>Sua atendente já estreia <strong>treinada</strong> graças às configurações que você preencheu nos últimos dias. Coloque esse número:</p>
        <ul style="line-height:1.8;">
          <li>No site do seu negócio</li>
          <li>No bio do Instagram</li>
          <li>Em cartão de visita / panfleto</li>
          <li>Onde clientes geralmente te procuram</li>
        </ul>
        <a href="${dashboardUrl}" style="display:inline-block;background:#f59e0b;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;margin-top:16px;">Ver inbox da atendente →</a>
        <p style="color:#64748b;font-size:13px;margin-top:24px;">Sem risco de banimento. Sem usar seu WhatsApp pessoal. Tudo automático.</p>
      </div>
    `,
  };
}

export function buildTwilioRejectedEmail(businessName: string, reason: string, supportUrl: string): NotifyOwnerParams {
  return {
    to: '',
    subject: `[Atalaia] Precisamos de mais informações sobre ${businessName}`,
    html: `
      <div style="font-family:Inter,sans-serif;max-width:520px;margin:0 auto;color:#0f172a;">
        <h2 style="color:#b91c1c;">Aprovação Meta pendente</h2>
        <p>A Meta retornou pedindo ajustes na verificação do número de <strong>${businessName}</strong>.</p>
        <div style="background:#fef2f2;padding:12px 16px;border-left:3px solid #ef4444;border-radius:0 8px 8px 0;margin:16px 0;font-size:14px;">
          <strong>Motivo informado:</strong> ${reason || 'não especificado'}
        </div>
        <p>Não tem problema — abra um ticket de suporte que o time do Atalaia entra em contato e ajusta com você. Geralmente é só ajustar nome de exibição ou enviar documento adicional.</p>
        <p>Enquanto isso sua atendente continua disponível pelo widget de chat do site.</p>
        <a href="${supportUrl}" style="display:inline-block;background:#f59e0b;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;margin-top:16px;">Abrir ticket de suporte →</a>
      </div>
    `,
  };
}

export function buildTwilioDeprovisionedEmail(businessName: string): NotifyOwnerParams {
  return {
    to: '',
    subject: `[Atalaia] Atendente do ${businessName} foi pausada`,
    html: `
      <div style="font-family:Inter,sans-serif;max-width:520px;margin:0 auto;color:#0f172a;">
        <h2 style="color:#1e3a5f;">Sua assinatura foi cancelada</h2>
        <p>O número WhatsApp do <strong>${businessName}</strong> foi liberado. Mensagens novas no número não serão mais respondidas.</p>
        <p style="color:#64748b;">Seus dados ficam preservados por 90 dias caso queira reativar. Se voltar nesse período, te entregamos um número novo automaticamente.</p>
        <a href="https://atalaia.verelus.com/atalaia#pricing" style="display:inline-block;background:#f59e0b;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;margin-top:16px;">Reativar plano →</a>
      </div>
    `,
  };
}

export function buildOnboardingTrainingEmail2(businessName: string, settingsUrl: string): NotifyOwnerParams {
  return {
    to: '',
    subject: `[Atalaia] ${businessName}: quando sua atendente deve te chamar`,
    html: `
      <div style="font-family:Inter,sans-serif;max-width:520px;margin:0 auto;color:#0f172a;">
        <h2 style="color:#1e3a5f;">Treino dia 2 — regras de transferência</h2>
        <p>Pra sua atendente nunca passar vergonha, ela precisa saber <strong>quando NÃO responder sozinha</strong> — quando deixar pra você.</p>
        <p>Configure agora:</p>
        <ul style="line-height:1.8;">
          <li>Casos onde transferir pra humano (cliente pediu desconto? reclamação? agendamento complexo?)</li>
          <li>Palavras-chave do cliente que disparam transferência ("gerente", "supervisor", "humano")</li>
          <li>Mensagem padrão fora do horário de atendimento</li>
          <li>Política de cancelamento / reagendamento — o que a IA pode dizer</li>
          <li>Promoções ativas (se houver) — período, condição, código</li>
          <li>O que a IA <strong>NUNCA</strong> deve falar (info sigilosa, descontos não autorizados, etc)</li>
        </ul>
        <a href="${settingsUrl}" style="display:inline-block;background:#f59e0b;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;margin-top:16px;">Configurar regras de transferência →</a>
        <p style="color:#64748b;font-size:13px;margin-top:24px;">Quando a Meta aprovar seu número, te enviamos email com o número ativado. Sua atendente estreia afiada.</p>
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
