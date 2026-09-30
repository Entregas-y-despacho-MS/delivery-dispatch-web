import { Fragment, type ReactNode } from "react";

import { DataTable, type DataTableProps } from "@/shared/components/common/data-table";
import { CardSkeletonList } from "@/shared/components/feedback/card-skeleton-list";
import { EmptyState, NoResultsState } from "@/shared/components/feedback/empty-state";
import { ErrorAlert } from "@/shared/components/feedback/error-alert";

interface ResponsiveListProps<T extends { id: string | number }> extends DataTableProps<T> {
  renderCard: (item: T) => ReactNode;
  mobileEmptyTitle?: string;
  mobileFilteredState?: boolean;
  mobileSkeletonCount?: number;
  mobileSkeletonVariant?: "default" | "incident";
}

/** Comparte los estados de una tabla de escritorio y sus tarjetas móviles. */
export function ResponsiveList<T extends { id: string | number }>({
  renderCard,
  mobileEmptyTitle,
  mobileFilteredState = false,
  mobileSkeletonCount,
  mobileSkeletonVariant,
  ...tableProps
}: ResponsiveListProps<T>) {
  const { data, loading, error, onRetry, isFiltered, onClearFilters, emptyMessage } = tableProps;

  return (
    <>
      <div className="hidden md:block"><DataTable {...tableProps} /></div>
      <div className="space-y-3 md:hidden">
        {error && !loading ? (
          <ErrorAlert error={error} onRetry={onRetry} />
        ) : loading ? (
          <CardSkeletonList count={mobileSkeletonCount} variant={mobileSkeletonVariant} />
        ) : data.length === 0 ? (
          mobileFilteredState && isFiltered ? (
            <NoResultsState description={emptyMessage} onClearFilters={onClearFilters} bordered />
          ) : (
            <EmptyState title={mobileEmptyTitle ?? "Sin resultados"} description={emptyMessage} />
          )
        ) : (
          data.map((item) => <Fragment key={item.id}>{renderCard(item)}</Fragment>)
        )}
      </div>
    </>
  );
}
