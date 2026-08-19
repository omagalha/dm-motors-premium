// DM Motors Imports - central WhatsApp config
export const WHATSAPP_NUMBER = "5522997313229";
const LEGACY_WHATSAPP_NUMBER = "5532999264848";

function normalizePhone(value?: string) {
  const digits = (value ?? "").replace(/\D/g, "");
  return digits === LEGACY_WHATSAPP_NUMBER ? WHATSAPP_NUMBER : digits;
}

export function whatsappLink(message?: string, number = WHATSAPP_NUMBER) {
  const text = encodeURIComponent(
    message ?? "Ola! Tenho interesse em um veiculo da DM Motors Imports."
  );
  const phone = normalizePhone(number) || WHATSAPP_NUMBER;
  return `https://wa.me/${phone}?text=${text}`;
}
