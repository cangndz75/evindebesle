import { Suspense } from "react";
import SuccessClient from "./SuccessClient";

export default function SuccessPage() {
    return (
        <Suspense fallback={<div className="min-h-[80vh] flex items-center justify-center">Yükleniyor...</div>}>
            <SuccessClient />
        </Suspense>
    );
}
