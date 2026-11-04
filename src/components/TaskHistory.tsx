import { taskStatusLabels } from '../service/tasks.api'
import type { TaskHistoryEntry } from '../service/tasks.api'

type TaskHistoryProps = {
  entries: TaskHistoryEntry[]
}

const dateFormatter = new Intl.DateTimeFormat('ru-RU', {
  dateStyle: 'medium',
  timeStyle: 'short',
})

export function TaskHistory({ entries }: TaskHistoryProps) {
  return (
    <section>
      <h3>История статусов</h3>

      {entries.length === 0 ? (
        <p>История пока пуста.</p>
      ) : (
        <ol className="history-list">
          {entries.map((entry) => (
            <li key={entry.id}>
              <p>
                <strong>{entry.actor_name}</strong>
                {' · '}
                <time dateTime={entry.created_at}>
                  {dateFormatter.format(new Date(entry.created_at))}
                </time>
              </p>

              <p>
                {entry.from_status
                  ? `${taskStatusLabels[entry.from_status]} → ${
                      taskStatusLabels[entry.to_status]
                    }`
                  : `Задача создана: ${
                      taskStatusLabels[entry.to_status]
                    }`}
              </p>

              {entry.comment && (
                <blockquote>{entry.comment}</blockquote>
              )}
            </li>
          ))}
        </ol>
      )}
    </section>
  )
}