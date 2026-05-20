import TransactionsClient from "./components/client";

export default function TransactionsPage() {
    return (
        <div className="flex-col">
            <div className="admin-page flex-1 space-y-4">
                <TransactionsClient />
            </div>
        </div>
    );
}
