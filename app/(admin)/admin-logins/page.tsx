import { prisma } from "@/lib/db";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

export const dynamic = "force-dynamic";

export default async function AdminLoginsPage() {
  const logs = await prisma.auditLog.findMany({
    where: {
      action: "ADMIN_LOGIN_SUCCESS",
    },
    include: {
      performedBy: {
        select: {
          id: true,
          email: true,
          name: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 200,
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Admin Giris Loglari</h1>
        <p className="text-sm text-gray-500 mt-1">
          Basarili admin giris denemeleri burada listelenir. Son 200 kayit gosterilir.
        </p>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Tarih</th>
                <th className="px-4 py-3 text-left font-medium">Admin</th>
                <th className="px-4 py-3 text-left font-medium">E-posta</th>
                <th className="px-4 py-3 text-left font-medium">IP</th>
                <th className="px-4 py-3 text-left font-medium">User-Agent</th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                    Henuz admin giris kaydi bulunmuyor.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="border-t border-gray-100 align-top">
                    <td className="px-4 py-3 whitespace-nowrap text-gray-700">
                      {format(log.createdAt, "dd MMM yyyy HH:mm:ss", { locale: tr })}
                    </td>
                    <td className="px-4 py-3 text-gray-800">
                      {log.performedBy?.name || "-"}
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {log.performedBy?.email || "-"}
                    </td>
                    <td className="px-4 py-3 text-gray-700 whitespace-nowrap">{log.ipAddress || "-"}</td>
                    <td className="px-4 py-3 text-gray-700 max-w-105 wrap-break-word">
                      {log.userAgent || "-"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
