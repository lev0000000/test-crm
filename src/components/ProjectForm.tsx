import { useState } from 'react'
import type { FormEvent } from 'react'
import { createProject, updateProject } from '../service/projects.api'
import type { Project } from '../service/projects.api'

type ProjectFormProps = {
  project?: Project
  onSaved: (project?: Project) => void
  onCancel: () => void
}

export function ProjectForm({
  project,
  onSaved,
  onCancel,
}: ProjectFormProps) {
  const [name, setName] = useState(project?.name ?? '')
  const [address, setAddress] = useState(project?.address ?? '')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (isSubmitting || !name.trim() || !address.trim()) return

    setIsSubmitting(true)
    setError(null)

    let savedProject: Project | undefined

    try {
      if (project) {
        savedProject = await updateProject(project.id, {
          name,
          address,
        })
      } else {
        await createProject({ name, address })
      }
    } catch {
      setError('Не удалось сохранить объект. Попробуйте ещё раз.')
      setIsSubmitting(false)
      return
    }

    onSaved(savedProject)
  }

  return (
    <section>
      <h3>{project ? 'Редактирование объекта' : 'Новый объект'}</h3>

      <form onSubmit={handleSubmit} aria-busy={isSubmitting}>
        <label htmlFor="project-name">Название</label>
        <input
          id="project-name"
          autoFocus
          required
          maxLength={200}
          disabled={isSubmitting}
          value={name}
          onChange={(event) => setName(event.target.value)}
        />

        <label htmlFor="project-address">Адрес</label>
        <input
          id="project-address"
          required
          maxLength={500}
          disabled={isSubmitting}
          value={address}
          onChange={(event) => setAddress(event.target.value)}
        />

        {error && <p role="alert">{error}</p>}

        <div className="task-actions">
          <button
            type="submit"
            disabled={
              isSubmitting || !name.trim() || !address.trim()
            }
          >
            {isSubmitting ? 'Сохранение…' : 'Сохранить'}
          </button>

          <button
            type="button"
            disabled={isSubmitting}
            onClick={onCancel}
          >
            Отмена
          </button>
        </div>
      </form>
    </section>
  )
}