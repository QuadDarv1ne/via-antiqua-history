export const QUIZ_STORAGE_KEY = 'via-antiqua-quiz-state'

export type QuizState = {
  current: number
  answers: (number | null)[]
  finished: boolean
}

/**
 * Сохранение состояния квиза в localStorage — прогресс переживает
 * перезагрузку страницы. Ошибки хранилища молча игнорируются.
 */
export function saveQuizState(state: QuizState): void {
  try {
    localStorage.setItem(QUIZ_STORAGE_KEY, JSON.stringify(state))
  } catch {
    // Storage full or unavailable — silently ignore
  }
}

export function clearQuizState(): void {
  try {
    localStorage.removeItem(QUIZ_STORAGE_KEY)
  } catch {
    // Ignore storage errors
  }
}

/**
 * Загрузка состояния квиза. Возвращает null для отсутствующих, повреждённых
 * или несовместимых данных (другое число вопросов, некорректные типы).
 * Некорректные отдельные ответы/current аккуратно заменяются безопасными
 * значениями, чтобы не уронить квиз.
 */
export function loadQuizState(questionCount: number): QuizState | null {
  if (!Number.isInteger(questionCount) || questionCount <= 0) return null
  try {
    const raw = localStorage.getItem(QUIZ_STORAGE_KEY)
    if (!raw) return null
    const parsed: unknown = JSON.parse(raw)
    if (
      typeof parsed !== 'object' ||
      parsed === null ||
      Array.isArray(parsed)
    ) {
      return null
    }
    const p = parsed as Record<string, unknown>
    if (!Array.isArray(p.answers) || typeof p.finished !== 'boolean') {
      return null
    }
    if (p.answers.length !== questionCount) return null

    const answers = p.answers.map((a) => {
      if (a === null) return null
      if (
        typeof a === 'number' &&
        Number.isInteger(a) &&
        a >= 0 &&
        a < questionCount
      ) {
        return a
      }
      return null
    })

    const current =
      typeof p.current === 'number' &&
      Number.isInteger(p.current) &&
      p.current >= 0 &&
      p.current < questionCount
        ? p.current
        : 0

    return { current, answers, finished: Boolean(p.finished) }
  } catch {
    return null
  }
}
