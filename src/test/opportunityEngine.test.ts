import { describe, expect, it } from "vitest";
import { liquidity, runEngine, simulateWhatIf, type EngineInvestment } from "@/lib/opportunityEngine";

const investment = (overrides: Partial<EngineInvestment> = {}): EngineInvestment => ({
  id: "1",
  asset_name: "Saldo",
  asset_type: "Conta corrente",
  ticker: null,
  current_value: 20_000,
  total_invested: 20_000,
  maturity_date: null,
  ...overrides,
});

describe("Opportunity Engine com dados confirmados", () => {
  it("considera como liquidez apenas saldos explicitamente classificados como caixa", () => {
    expect(liquidity([
      investment(),
      investment({ id: "2", asset_type: "CDB", current_value: 50_000 }),
    ])).toBe(20_000);
  });

  it("não cria oportunidade monetária quando o CDI oficial está indisponível", () => {
    const result = runEngine([investment()], [], [], { cdi12m: 0, ipca12m: 0, selic: 0 });
    expect(result.totalOpportunity).toBe(0);
    expect(result.insights.some((item) => item.id === "idle-cash")).toBe(false);
  });

  it("projeta caixa parado usando o CDI informado sem números fixos", () => {
    const result = runEngine([investment()], [], [], { cdi12m: 10, ipca12m: 4, selic: 10 });
    expect(result.totalOpportunity).toBe(1_900);
  });

  it("marca financiamento indisponível quando a taxa oficial não foi carregada", () => {
    const financing = simulateWhatIf(100_000, 500_000, 200_000, 400_000, { cdi12m: 10, ipca12m: 4, selic: 10 }, 1_000_000)
      .find((scenario) => scenario.key === "financiamento");
    expect(financing?.monthlyPayment).toBe(0);
    expect(financing?.note).toContain("indisponível");
  });
});