// DM Motors Imports — central WhatsApp config
export const WHATSAPP_NUMBER = "5532999264848";

export function whatsappLink(message?: string) {
  const text = encodeURIComponent(
    message ?? "Olá! Tenho interesse em um veículo da DM Motors Imports."
  );
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${text}`;
}
