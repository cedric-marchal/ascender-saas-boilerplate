import { LOCALE_METADATA } from "@/i18n/locale-metadata.constant";
import { Activity } from "lucide-react";
import { useLocale, useTranslations, type Locale } from "next-intl";

import { AUDIT_ACTION_LABELS } from "@/features/organizations/constants/audit-actions.constant";
import type { AuditLogItem } from "@/features/organizations/services/get-audit-log.service";

import { Main } from "@/components/main";
import { Pagination } from "@/components/pagination";
import { Separator } from "@/components/ui/separator";

type AuditLogPageProps = {
  entries: AuditLogItem[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
};

function AuditLogPage({
  entries,
  totalCount,
  totalPages,
  currentPage,
}: AuditLogPageProps) {
  const t = useTranslations("organizations.auditLog");
  const tActions = useTranslations("organizations.auditActions");
  const locale = useLocale();

  return (
    <Main className="flex flex-col gap-6 p-6">
      <header className="flex items-center gap-3">
        <div className="bg-primary/10 flex size-10 items-center justify-center rounded-lg">
          <Activity className="text-primary size-5" aria-hidden="true" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {t("title")}
          </h1>
          <p className="text-muted-foreground text-sm">
            {t("eventCount", { count: totalCount })}
          </p>
        </div>
      </header>

      <Separator />

      <section className="space-y-4">
        {entries.length === 0 ? (
          <p className="text-muted-foreground py-8 text-center text-sm">
            {t("empty")}
          </p>
        ) : (
          <ul className="divide-y">
            {entries.map((entry: AuditLogItem) => (
              <li key={entry.id} className="flex flex-col gap-1 py-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">
                    {entry.action in AUDIT_ACTION_LABELS
                      ? tActions(
                          AUDIT_ACTION_LABELS[
                            entry.action as keyof typeof AUDIT_ACTION_LABELS
                          ],
                        )
                      : entry.action}
                  </span>
                  <time
                    dateTime={entry.createdAt.toISOString()}
                    className="text-muted-foreground text-xs"
                  >
                    {entry.createdAt.toLocaleDateString(
                      LOCALE_METADATA[locale as Locale].bcp47,
                      {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      },
                    )}
                  </time>
                </div>
                <p className="text-muted-foreground text-xs">
                  {t("byUser", {
                    name: entry.user.name,
                    email: entry.user.email,
                  })}{" "}
                  · {entry.entityType}
                  {entry.entityId !== null && ` · ${entry.entityId}`}
                </p>
              </li>
            ))}
          </ul>
        )}

        <Pagination currentPage={currentPage} totalPages={totalPages} />
      </section>
    </Main>
  );
}

export { AuditLogPage };
