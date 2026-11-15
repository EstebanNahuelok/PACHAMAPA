// Envio de WhatsApp con la API de Twilio. Sin credenciales no se envia nada: el mensaje solo se escribe en el log.
const { TWILIO_ACCOUNT_SID: SID, TWILIO_AUTH_TOKEN: TOKEN, TWILIO_WHATSAPP_FROM: DESDE } = process.env;

export const whatsappConfigurado = Boolean(SID && TOKEN && DESDE);

// Deja el numero en formato internacional (+549...). Sin "+" se asume un celular de Argentina.
export function normalizarTelefono(valor) {
  if (typeof valor !== 'string') return null;
  const internacional = valor.trim().startsWith('+');
  let digitos = valor.replace(/\D/g, '');
  if (!internacional) {
    digitos = digitos.replace(/^0+/, '');
    // Formato local con 15 (388 15 4123456): se quita el 15 que sigue al codigo de area.
    if (digitos.length === 12) {
      const i = [2, 3, 4].find((n) => digitos.startsWith('15', n));
      if (i) digitos = digitos.slice(0, i) + digitos.slice(i + 2);
    }
    if (digitos.length === 10) digitos = `549${digitos}`;
  }
  if (digitos.startsWith('54') && !digitos.startsWith('549')) digitos = `549${digitos.slice(2)}`;
  if (!internacional && !digitos.startsWith('549')) return null;
  return digitos.length >= 10 && digitos.length <= 15 ? `+${digitos}` : null;
}

export async function enviarWhatsApp(telefono, texto) {
  if (!whatsappConfigurado) {
    console.log(`[whatsapp simulado] a ${telefono}:\n${texto}`);
    return { enviado: false, simulado: true };
  }
  const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${SID}/Messages.json`, {
    method: 'POST',
    headers: { Authorization: `Basic ${Buffer.from(`${SID}:${TOKEN}`).toString('base64')}` },
    body: new URLSearchParams({ From: `whatsapp:${DESDE.replace(/^whatsapp:/, '')}`, To: `whatsapp:${telefono}`, Body: texto }),
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) {
    const detalle = await res.json().catch(() => null);
    throw new Error(`Twilio respondio ${res.status}${detalle?.message ? `: ${detalle.message}` : ''}`);
  }
  return { enviado: true, simulado: false };
}
