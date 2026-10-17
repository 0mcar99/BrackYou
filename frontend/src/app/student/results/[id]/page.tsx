import ResultsClient from "./ResultsClient";

export function generateStaticParams() {
  return [
    { id: "session_demo_alex" },
  ];
}

export default function Page() {
  return <ResultsClient />;
}
