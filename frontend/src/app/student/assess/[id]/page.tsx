import AssessClient from "./AssessClient";

export function generateStaticParams() {
  return [
    { id: "q_di_1" },
    { id: "q_inherit_1" },
    { id: "q_obj_1" },
    { id: "q_adversarial_demo" },
  ];
}

export default function Page() {
  return <AssessClient />;
}
