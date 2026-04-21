(function() {
  'use strict';

  // ── Detect host URL from script src ──────────────────────────────
  var scriptEl = document.currentScript;
  var scriptSrc = scriptEl ? scriptEl.src : '';
  var BASE_URL = scriptSrc ? scriptSrc.replace(/\/widget\.js(\?.*)?$/, '') : '';
  var businessId = scriptEl ? scriptEl.getAttribute('data-business') : null;

  if (!businessId) {
    console.error('[Attendly] Missing data-business attribute on widget script tag.');
    return;
  }

  // ── Constants ────────────────────────────────────────────────────
  var MAX_MESSAGES = 30;
  var STORAGE_KEY = 'attendly_widget_' + businessId;
  var EXPIRY_MS = 24 * 60 * 60 * 1000; // 24h

  // ── State ────────────────────────────────────────────────────────
  var config = null;
  var conversationId = null;
  var customerName = '';
  var messageCount = 0;
  var isOpen = false;
  var isStreaming = false;

  // ── localStorage helpers ─────────────────────────────────────────
  function saveSession() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        conversation_id: conversationId,
        customer_name: customerName,
        expires: Date.now() + EXPIRY_MS,
      }));
    } catch (_) { /* ignore */ }
  }

  function loadSession() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      var data = JSON.parse(raw);
      if (data.expires && data.expires > Date.now()) return data;
      localStorage.removeItem(STORAGE_KEY);
    } catch (_) { /* ignore */ }
    return null;
  }

  // ── Styles (injected into Shadow DOM) ────────────────────────────
  function getStyles(color, position) {
    var posRight = position === 'bottom-right';
    return '\
      *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }\
      :host { all: initial; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; font-size: 14px; line-height: 1.5; color: #1a1a1a; }\
      \
      .aw-fab {\
        position: fixed; bottom: 20px; ' + (posRight ? 'right: 20px' : 'left: 20px') + ';\
        width: 56px; height: 56px; border-radius: 50%; border: none;\
        background: ' + color + '; color: #fff; cursor: pointer;\
        box-shadow: 0 4px 12px rgba(0,0,0,0.25); z-index: 2147483646;\
        display: flex; align-items: center; justify-content: center;\
        transition: transform 0.2s;\
      }\
      .aw-fab:hover { transform: scale(1.08); }\
      .aw-fab svg { width: 26px; height: 26px; fill: #fff; }\
      \
      .aw-panel {\
        position: fixed; bottom: 88px; ' + (posRight ? 'right: 20px' : 'left: 20px') + ';\
        width: 380px; max-height: 560px; border-radius: 16px;\
        background: #fff; box-shadow: 0 8px 30px rgba(0,0,0,0.18);\
        display: flex; flex-direction: column; overflow: hidden;\
        z-index: 2147483647; opacity: 0; transform: translateY(12px) scale(0.96);\
        transition: opacity 0.2s, transform 0.2s; pointer-events: none;\
      }\
      .aw-panel.aw-open { opacity: 1; transform: translateY(0) scale(1); pointer-events: auto; }\
      \
      @media (max-width: 639px) {\
        .aw-panel { inset: 0; width: 100%; max-height: 100%; border-radius: 0; bottom: 0; }\
        .aw-panel.aw-open + .aw-fab { display: none; }\
      }\
      \
      .aw-header {\
        background: ' + color + '; color: #fff; padding: 14px 16px;\
        display: flex; align-items: center; justify-content: space-between; flex-shrink: 0;\
      }\
      .aw-header-title { font-weight: 600; font-size: 15px; }\
      .aw-close {\
        background: none; border: none; color: #fff; cursor: pointer;\
        font-size: 22px; line-height: 1; padding: 0 4px; opacity: 0.8;\
      }\
      .aw-close:hover { opacity: 1; }\
      \
      .aw-messages {\
        flex: 1; overflow-y: auto; padding: 16px; display: flex;\
        flex-direction: column; gap: 10px; min-height: 200px;\
      }\
      .aw-msg {\
        max-width: 80%; padding: 10px 14px; border-radius: 14px;\
        word-wrap: break-word; white-space: pre-wrap; font-size: 14px; line-height: 1.45;\
      }\
      .aw-msg-assistant {\
        align-self: flex-start; background: ' + color + '18; color: #1a1a1a;\
        border-bottom-left-radius: 4px;\
      }\
      .aw-msg-customer {\
        align-self: flex-end; background: #e9ecef; color: #1a1a1a;\
        border-bottom-right-radius: 4px;\
      }\
      \
      .aw-typing {\
        align-self: flex-start; display: flex; gap: 4px; padding: 10px 14px;\
      }\
      .aw-typing span {\
        width: 7px; height: 7px; border-radius: 50%; background: ' + color + '80;\
        animation: aw-bounce 1.2s infinite;\
      }\
      .aw-typing span:nth-child(2) { animation-delay: 0.2s; }\
      .aw-typing span:nth-child(3) { animation-delay: 0.4s; }\
      @keyframes aw-bounce {\
        0%, 60%, 100% { transform: translateY(0); }\
        30% { transform: translateY(-6px); }\
      }\
      \
      .aw-input-area {\
        display: flex; border-top: 1px solid #e9ecef; padding: 10px; gap: 8px; flex-shrink: 0;\
      }\
      .aw-input {\
        flex: 1; border: 1px solid #ddd; border-radius: 20px; padding: 8px 14px;\
        font-size: 14px; outline: none; font-family: inherit;\
      }\
      .aw-input:focus { border-color: ' + color + '; }\
      .aw-send {\
        width: 38px; height: 38px; border-radius: 50%; border: none;\
        background: ' + color + '; color: #fff; cursor: pointer;\
        display: flex; align-items: center; justify-content: center; flex-shrink: 0;\
      }\
      .aw-send:disabled { opacity: 0.5; cursor: not-allowed; }\
      .aw-send svg { width: 18px; height: 18px; fill: #fff; }\
      \
      .aw-form {\
        padding: 24px 20px; display: flex; flex-direction: column; gap: 14px;\
      }\
      .aw-form p { font-size: 15px; font-weight: 500; color: #333; }\
      .aw-form input {\
        border: 1px solid #ddd; border-radius: 8px; padding: 10px 12px;\
        font-size: 14px; outline: none; font-family: inherit;\
      }\
      .aw-form input:focus { border-color: ' + color + '; }\
      .aw-form button {\
        background: ' + color + '; color: #fff; border: none; border-radius: 8px;\
        padding: 10px; font-size: 14px; font-weight: 600; cursor: pointer;\
        font-family: inherit;\
      }\
      .aw-form button:disabled { opacity: 0.6; cursor: not-allowed; }\
      \
      .aw-footer {\
        text-align: center; padding: 6px; font-size: 11px; color: #999; flex-shrink: 0;\
      }\
      .aw-footer a { color: #999; text-decoration: none; }\
      .aw-footer a:hover { text-decoration: underline; }\
      \
      .aw-limit { padding: 12px 16px; text-align: center; font-size: 13px; color: #888; }\
    ';
  }

  // ── SVG icons ────────────────────────────────────────────────────
  var ICON_CHAT = '<svg viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H5.2L4 17.2V4h16v12z"/></svg>';
  var ICON_SEND = '<svg viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>';
  var ICON_CLOSE = '\u00D7';

  // ── Build UI ─────────────────────────────────────────────────────
  function init(cfg) {
    config = cfg;
    var color = config.color || '#1e3a5f';
    var position = config.position || 'bottom-right';

    // Host element + Shadow DOM
    var host = document.createElement('div');
    host.id = 'attendly-widget-host';
    document.body.appendChild(host);
    var shadow = host.attachShadow({ mode: 'closed' });

    // Styles
    var style = document.createElement('style');
    style.textContent = getStyles(color, position);
    shadow.appendChild(style);

    // FAB button
    var fab = document.createElement('button');
    fab.className = 'aw-fab';
    fab.setAttribute('aria-label', 'Abrir chat');
    fab.innerHTML = ICON_CHAT;
    shadow.appendChild(fab);

    // Panel
    var panel = document.createElement('div');
    panel.className = 'aw-panel';
    shadow.appendChild(panel);

    // Header
    var header = document.createElement('div');
    header.className = 'aw-header';
    header.innerHTML = '<span class="aw-header-title">' + escapeHtml(config.name) + '</span>';
    var closeBtn = document.createElement('button');
    closeBtn.className = 'aw-close';
    closeBtn.setAttribute('aria-label', 'Fechar');
    closeBtn.textContent = ICON_CLOSE;
    header.appendChild(closeBtn);
    panel.appendChild(header);

    // Body container (form or chat)
    var body = document.createElement('div');
    body.style.cssText = 'display:flex;flex-direction:column;flex:1;overflow:hidden;';
    panel.appendChild(body);

    // Footer
    var footer = document.createElement('div');
    footer.className = 'aw-footer';
    footer.innerHTML = 'Powered by <a href="https://attendly.com.br" target="_blank" rel="noopener">Attendly</a>';
    panel.appendChild(footer);

    // ── Open/Close ───────────────────────────────────────
    fab.addEventListener('click', function() { togglePanel(true); });
    closeBtn.addEventListener('click', function() { togglePanel(false); });

    function togglePanel(open) {
      isOpen = typeof open === 'boolean' ? open : !isOpen;
      if (isOpen) {
        panel.classList.add('aw-open');
      } else {
        panel.classList.remove('aw-open');
      }
    }

    // ── Check saved session ──────────────────────────────
    var session = loadSession();
    if (session && session.conversation_id && session.customer_name) {
      conversationId = session.conversation_id;
      customerName = session.customer_name;
      showChat(body, color);
    } else {
      showForm(body, color);
    }

    // Expose body + color for later use
    host._awBody = body;
    host._awColor = color;
  }

  // ── Pre-chat form ────────────────────────────────────────────────
  function showForm(container, color) {
    container.innerHTML = '';
    var form = document.createElement('div');
    form.className = 'aw-form';
    form.innerHTML = '\
      <p>' + escapeHtml(config.greeting) + '</p>\
      <input type="text" placeholder="Seu nome *" id="aw-name" autocomplete="name" />\
      <input type="tel" placeholder="Telefone (opcional)" id="aw-phone" autocomplete="tel" />\
      <button type="button" id="aw-start">Iniciar conversa</button>\
    ';
    container.appendChild(form);

    var nameInput = form.querySelector('#aw-name');
    var phoneInput = form.querySelector('#aw-phone');
    var startBtn = form.querySelector('#aw-start');

    startBtn.addEventListener('click', function() {
      var name = nameInput.value.trim();
      if (!name) {
        nameInput.style.borderColor = '#e53e3e';
        nameInput.focus();
        return;
      }
      startBtn.disabled = true;
      startBtn.textContent = 'Conectando...';

      var payload = {
        business_id: businessId,
        customer_name: name,
        customer_phone: phoneInput.value.trim() || undefined,
      };

      fetch(BASE_URL + '/api/attendly/widget/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      .then(function(res) { return res.json(); })
      .then(function(data) {
        if (data.conversation_id) {
          conversationId = data.conversation_id;
          customerName = name;
          saveSession();
          showChat(container, color);
        } else {
          startBtn.disabled = false;
          startBtn.textContent = 'Iniciar conversa';
          alert('Erro ao iniciar. Tente novamente.');
        }
      })
      .catch(function() {
        startBtn.disabled = false;
        startBtn.textContent = 'Iniciar conversa';
        alert('Erro de conexão. Tente novamente.');
      });
    });

    nameInput.addEventListener('keydown', function(e) {
      if (e.key === 'Enter') startBtn.click();
    });
  }

  // ── Chat interface ───────────────────────────────────────────────
  function showChat(container, color) {
    container.innerHTML = '';

    // Messages area
    var messagesDiv = document.createElement('div');
    messagesDiv.className = 'aw-messages';
    container.appendChild(messagesDiv);

    // Input area
    var inputArea = document.createElement('div');
    inputArea.className = 'aw-input-area';
    var textInput = document.createElement('input');
    textInput.className = 'aw-input';
    textInput.type = 'text';
    textInput.placeholder = 'Digite sua mensagem...';
    textInput.setAttribute('autocomplete', 'off');
    var sendBtn = document.createElement('button');
    sendBtn.className = 'aw-send';
    sendBtn.setAttribute('aria-label', 'Enviar');
    sendBtn.innerHTML = ICON_SEND;
    inputArea.appendChild(textInput);
    inputArea.appendChild(sendBtn);
    container.appendChild(inputArea);

    // Show greeting
    appendMessage(messagesDiv, 'assistant', config.greeting);

    // Send handler
    function sendMessage() {
      var text = textInput.value.trim();
      if (!text || isStreaming) return;

      if (messageCount >= MAX_MESSAGES) {
        showLimitMessage(messagesDiv);
        return;
      }

      messageCount++;
      appendMessage(messagesDiv, 'customer', text);
      textInput.value = '';
      textInput.focus();

      var typing = showTyping(messagesDiv);
      isStreaming = true;
      sendBtn.disabled = true;

      streamChat(text, messagesDiv, typing, function() {
        isStreaming = false;
        sendBtn.disabled = false;
        textInput.focus();
      });
    }

    sendBtn.addEventListener('click', sendMessage);
    textInput.addEventListener('keydown', function(e) {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    });
  }

  // ── Append message bubble ────────────────────────────────────────
  function appendMessage(container, role, text) {
    var div = document.createElement('div');
    div.className = 'aw-msg aw-msg-' + role;
    div.textContent = text;
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
    return div;
  }

  // ── Typing indicator ─────────────────────────────────────────────
  function showTyping(container) {
    var div = document.createElement('div');
    div.className = 'aw-typing';
    div.innerHTML = '<span></span><span></span><span></span>';
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
    return div;
  }

  // ── Rate limit message ───────────────────────────────────────────
  function showLimitMessage(container) {
    var existing = container.querySelector('.aw-limit');
    if (existing) return;
    var div = document.createElement('div');
    div.className = 'aw-limit';
    div.textContent = 'Limite de mensagens atingido. Volte mais tarde ou entre em contato por outro canal.';
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
  }

  // ── SSE streaming chat ───────────────────────────────────────────
  function streamChat(message, messagesContainer, typingEl, onDone) {
    var payload = {
      business_id: businessId,
      message: message,
      channel: 'widget',
      conversation_id: conversationId,
      customer_name: customerName,
    };

    fetch(BASE_URL + '/api/attendly/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    .then(function(response) {
      if (!response.ok) {
        throw new Error('HTTP ' + response.status);
      }
      var reader = response.body.getReader();
      var decoder = new TextDecoder();
      var bubbleEl = null;
      var fullText = '';
      var buffer = '';

      function processChunk(chunk) {
        buffer += chunk;
        var lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (var i = 0; i < lines.length; i++) {
          var line = lines[i].trim();
          if (!line.startsWith('data: ')) continue;
          var jsonStr = line.slice(6);
          try {
            var data = JSON.parse(jsonStr);

            if (data.text) {
              if (typingEl && typingEl.parentNode) {
                typingEl.parentNode.removeChild(typingEl);
                typingEl = null;
              }
              if (!bubbleEl) {
                bubbleEl = appendMessage(messagesContainer, 'assistant', '');
              }
              fullText += data.text;
              bubbleEl.textContent = fullText;
              messagesContainer.scrollTop = messagesContainer.scrollHeight;
            }

            if (data.conversation_id && !conversationId) {
              conversationId = data.conversation_id;
              saveSession();
            }

            if (data.done) {
              // Update conversation_id if returned
              if (data.conversation_id) {
                conversationId = data.conversation_id;
                saveSession();
              }
            }

            if (data.transfer) {
              appendMessage(messagesContainer, 'assistant',
                'Vou transferir seu atendimento para nossa equipe. Aguarde um momento.');
            }

            if (data.error) {
              if (typingEl && typingEl.parentNode) {
                typingEl.parentNode.removeChild(typingEl);
              }
              appendMessage(messagesContainer, 'assistant',
                'Desculpe, ocorreu um erro. Tente novamente.');
            }
          } catch (_) { /* ignore parse errors */ }
        }
      }

      function read() {
        reader.read().then(function(result) {
          if (result.done) {
            if (typingEl && typingEl.parentNode) {
              typingEl.parentNode.removeChild(typingEl);
            }
            if (!bubbleEl && !fullText) {
              appendMessage(messagesContainer, 'assistant',
                'Desculpe, não consegui processar sua mensagem.');
            }
            onDone();
            return;
          }
          processChunk(decoder.decode(result.value, { stream: true }));
          read();
        }).catch(function() {
          if (typingEl && typingEl.parentNode) {
            typingEl.parentNode.removeChild(typingEl);
          }
          appendMessage(messagesContainer, 'assistant',
            'Erro de conexão. Tente novamente.');
          onDone();
        });
      }

      read();
    })
    .catch(function() {
      if (typingEl && typingEl.parentNode) {
        typingEl.parentNode.removeChild(typingEl);
      }
      appendMessage(messagesContainer, 'assistant',
        'Erro de conexão. Tente novamente.');
      onDone();
    });
  }

  // ── HTML escaping ────────────────────────────────────────────────
  function escapeHtml(str) {
    var div = document.createElement('div');
    div.appendChild(document.createTextNode(str || ''));
    return div.innerHTML;
  }

  // ── Boot ─────────────────────────────────────────────────────────
  fetch(BASE_URL + '/api/attendly/widget/' + encodeURIComponent(businessId) + '/config')
    .then(function(res) {
      if (!res.ok) throw new Error('Config fetch failed');
      return res.json();
    })
    .then(function(cfg) {
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() { init(cfg); });
      } else {
        init(cfg);
      }
    })
    .catch(function(err) {
      console.error('[Attendly] Failed to load widget config:', err);
    });

})();
