import { Suspense } from "react";
import MenFootwearPage from "../../_components/MenFootwearPage";

export const metadata = {
  title: "Erkek Ayakkabı - Dark Velvet",
  description: "Dark Velvet erkek ayakkabı koleksiyonu. Premium kalite ve modern tasarım.",
};

export default function MenFootwearPageRoute() {
  return (
    <Suspense fallback={null}>
      <MenFootwearPage />
    </Suspense>
  );
}
