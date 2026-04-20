// DM Motors Imports - central WhatsApp config
export const WHATSAPP_NUMBER = "5532999264848";

function normalizePhone(value?: string) {
  return (value ?? "").replace(/\D/g, "");
}

export function whatsappLink(message?: string, number = WHATSAPP_NUMBER) {
  const text = encodeURIComponent(
    message ?? "Ola! Tenho interesse em um veiculo da DM Motors Imports."
  );
  const phone = normalizePhone(number) || WHATSAPP_NUMBER;
  return `https://wa.me/${phone}?text=${text}`;
}
