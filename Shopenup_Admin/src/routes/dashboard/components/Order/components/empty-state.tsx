type EmptyStateProps = {
  message: string
}

export function EmptyState({ message }: EmptyStateProps) {
  return (
    <div className="text-center py-8 text-gray-500 dark:text-ui-fg-muted">
      {message}
    </div>
  )
}

