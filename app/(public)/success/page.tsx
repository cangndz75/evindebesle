import { Suspense } from "react";
import SuccessClient from "./SuccessClient";

export default function SuccessPage() {
    return (
        <Suspense
            fallback={
                <div className="min-h-[80vh] flex items-center justify-center">
                    <div className="h-9 w-9 rounded-full border-2 border-black/20 border-t-black animate-spin" />
                </div>
            }
        >
            <SuccessClient />
        </Suspense>
    );
}
