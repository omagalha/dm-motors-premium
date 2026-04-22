import { whatsappLink } from "@/lib/whatsapp";
import { MessageCircle } from "lucide-react";
import { motion } from "framer-motion";

interface Props {
  message?: string;
  label?: string;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function WhatsAppButton({
  message,
  label = "Chamar no WhatsApp",
  className = "",
  size = "md",
}: Props) {
  const sizeClasses = {
    sm: "px-4 py-2 text-xs",
    md: "px-5 py-3 text-sm",
    lg: "px-7 py-4 text-base",
  }[size];

  return (
    <motion.a
      href={whatsappLink(message)}
      target="_blank"
      rel="noopener noreferrer"
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      className={`inline-flex items-center justify-center gap-2 rounded-full bg-whatsapp font-bold uppercase tracking-wide text-whatsapp-foreground shadow-card transition ${sizeClasses} ${className}`}
    >
      <MessageCircle className="h-4 w-4 fill-current" strokeWidth={0} />
      {label}
    </motion.a>
  );
}

export function FloatingWhatsApp() {
  return (
    <a
      href={whatsappLink()}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chamar no WhatsApp"
      className="animate-pulse-whatsapp fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-whatsapp text-whatsapp-foreground shadow-card transition hover:scale-110"
    >
      <MessageCircle className="h-7 w-7 fill-current" strokeWidth={0} />
    </a>
  );
}
