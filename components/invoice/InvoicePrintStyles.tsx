export function InvoicePrintStyles() {
  return (
    <style jsx global>{`
      @media print {
        @page {
          margin: 0;
          size: A4;
        }
        body {
          background: white;
        }
        .print\\:hidden {
          display: none !important;
        }
        .print\\:p-8 {
          padding: 10mm !important;
        }
        .print\\:shadow-none {
          box-shadow: none !important;
        }
      }
    `}</style>
  );
}
