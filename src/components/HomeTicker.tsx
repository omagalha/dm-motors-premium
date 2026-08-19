const tickerItems = [
  "Procedência garantida",
  "Atendimento consultivo",
  "+500 clientes atendidos",
  "+800 veículos vendidos",
  "4.9 no Google",
  "Financiamento assistido",
  "Aceitamos troca",
  "Estoque selecionado",
];

export function HomeTicker() {
  const repeated = Array.from({ length: 4 }, () => tickerItems).flat();

  return (
    <div className="overflow-hidden border-y border-primary/35 bg-primary">
      <div className="flex h-11 w-max animate-[ticker_34s_linear_infinite] items-center whitespace-nowrap">
        {repeated.map((item, index) => (
          <span
            key={`${item}-${index}`}
            className="flex shrink-0 items-center text-[10px] font-black uppercase tracking-[0.26em] text-white/90"
          >
            <span className="px-6">{item}</span>
            <span className="text-white/28">/</span>
          </span>
        ))}
      </div>
    </div>
  );
}
