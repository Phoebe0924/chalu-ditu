import { OpportunityWorkbench } from "@/components/opportunity-workbench";

export default function Home() {
  const apiConfigured = Boolean(
    process.env.LLM_API_KEY || process.env.OPENAI_API_KEY,
  );
  const paymentUrl = process.env.PAYMENT_URL ?? "";

  return (
    <OpportunityWorkbench apiConfigured={apiConfigured} paymentUrl={paymentUrl} />
  );
}
