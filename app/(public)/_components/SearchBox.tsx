import { Button } from "@/components/ui/button";

export default function SearchBox() {
  return (
    <div className="max-w-4xl mx-auto -mt-16 relative z-10 shadow-lg rounded-xl bg-white p-6 flex flex-col md:flex-row gap-4 items-center">
      <input
        type="text"
        placeholder="Fyll inn ditt poststed"
        className="flex-1 border px-4 py-3 rounded-md"
      />
      <input
        type="date"
        placeholder="Skriv inn dato(er)"
        className="flex-1 border px-4 py-3 rounded-md"
      />
      <Button className="bg-yellow-400 hover:bg-yellow-500 text-black px-6 py-3 rounded-md font-semibold">
        Finn en dyrepasser
      </Button>
    </div>
  );
}
