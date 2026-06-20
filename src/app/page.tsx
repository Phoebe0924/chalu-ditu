import { OpportunityWorkbench } from "@/components/opportunity-workbench";

export default function Home() {
  const apiConfigured = Boolean(
    process.env.LLM_API_KEY || process.env.OPENAI_API_KEY,
  );

  return <OpportunityWorkbench apiConfigured={apiConfigured} />;
}
