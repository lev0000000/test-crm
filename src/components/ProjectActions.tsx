import { useState } from 'react'
import { deleteProject } from '../service/projects.api'
import type { Project } from '../service/projects.api'
import { ProjectForm } from './ProjectForm'

type ProjectActionsProps = {
  project: Project
  onUpdated: (project: Project) => void
  onDeleted: () => void
}

export function ProjectActions({
  project,
  onUpdated,
  onDeleted,
}: ProjectActionsProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleDelete() {
    if (isDeleting) return

    const confirmed = window.confirm(
      `Удалить объект «${project.name}»? Все его задачи и история тоже будут удалены.`,
    )

    if (!confirmed) return

    setIsDeleting(true)
    setError(null)

    try {
      await deleteProject(project.id)
    } catch {
      setError('Не удалось удалить объект.')
      setIsDeleting(false)
      return
    }

    onDeleted()
  }

  if (isEditing) {
    return (
      <ProjectForm
        project={project}
        onCancel={() => setIsEditing(false)}
        onSaved={(updatedProject) => {
          setIsEditing(false)

          if (updatedProject) {
            onUpdated(updatedProject)
          }
        }}
      />
    )
  }

  return (
    <section>
      <div className="task-actions">
        <button
          type="button"
          disabled={isDeleting}
          onClick={() => {
            setError(null)
            setIsEditing(true)
          }}
        >
          Изменить объект
        </button>

        <button
          type="button"
          disabled={isDeleting}
          onClick={handleDelete}
        >
          {isDeleting ? 'Удаление…' : 'Удалить объект'}
        </button>
      </div>

      {error && <p role="alert">{error}</p>}
    </section>
  )
}