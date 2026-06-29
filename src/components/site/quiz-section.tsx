'use client'

import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Brain, CheckCircle2, XCircle, RotateCcw, Trophy } from 'lucide-react'
import { quizQuestions } from '@/lib/history-data'
import { cn, withAlpha } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { REGION_COLORS, REGION_LABELS } from '@/lib/constants'

export function QuizSection() {
  const [current, setCurrent] = React.useState(0)
  const [selected, setSelected] = React.useState<number | null>(null)
  const [answers, setAnswers] = React.useState<(number | null)[]>(
    Array(quizQuestions.length).fill(null)
  )
  const [finished, setFinished] = React.useState(false)

  // Calculate correct answers count
  const correctCount = React.useMemo(() => {
    return answers.reduce<number>(
      (acc, answer, index) => acc + (answer !== null && answer === quizQuestions[index].correct ? 1 : 0),
      0
    )
  }, [answers])

  // Calculate total answered count (for progress bar)
  const answeredCount = React.useMemo(() => {
    return answers.filter((a) => a !== null).length
  }, [answers])

  const q = quizQuestions[current]
  const isAnswered = selected !== null
  const isCorrect = selected === q.correct

  const select = (i: number) => {
    if (isAnswered) return
    setSelected(i)
    const updated = [...answers]
    updated[current] = i
    setAnswers(updated)
  }

  const goNext = () => {
    if (current + 1 >= quizQuestions.length) {
      setFinished(true)
    } else {
      setCurrent((c) => c + 1)
      setSelected(answers[current + 1] ?? null)
    }
  }

  const goPrev = () => {
    if (current > 0) {
      setCurrent((c) => c - 1)
      setSelected(answers[current - 1] ?? null)
    }
  }

  // Keyboard navigation: 1-4 to answer, Enter/ArrowRight for next, ArrowLeft for prev
  React.useEffect(() => {
    if (finished) return
    const onKey = (e: KeyboardEvent) => {
      const active = document.activeElement
      if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA')) return
      if (e.key >= '1' && e.key <= '4') {
        const idx = parseInt(e.key, 10) - 1
        if (idx < q.options.length && !isAnswered) {
          e.preventDefault()
          select(idx)
        }
      } else if (e.key === 'Enter' || e.key === 'ArrowRight') {
        if (isAnswered) {
          e.preventDefault()
          goNext()
        }
      } else if (e.key === 'ArrowLeft') {
        if (current > 0) {
          e.preventDefault()
          goPrev()
        }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [current, isAnswered, finished, q, answers]) // eslint-disable-line react-hooks/exhaustive-deps

  const reset = () => {
    setCurrent(0)
    setSelected(null)
    setAnswers(Array(quizQuestions.length).fill(null))
    setFinished(false)
  }

  const progress = (answeredCount / quizQuestions.length) * 100

  if (finished) {
    const percent = Math.round((correctCount / quizQuestions.length) * 100)

    const tier =
      percent === 100
        ? { label: 'Идеально!', emoji: '🏛️', color: 'text-amber-500' }
        : percent >= 80
          ? { label: 'Отлично!', emoji: '🌟', color: 'text-yellow-500' }
          : percent >= 60
            ? { label: 'Хорошо!', emoji: '📖', color: 'text-sky-500' }
            : { label: 'Попробуйте ещё', emoji: '🕯️', color: 'text-muted-foreground' }

    // Precompute region stats in a single pass
    const regionStats: Record<string, { total: number; correct: number }> = {}
    quizQuestions.forEach((q, index) => {
      if (!regionStats[q.region]) {
        regionStats[q.region] = { total: 0, correct: 0 }
      }
      regionStats[q.region].total++
      if (answers[index] !== null && answers[index] === q.correct) {
        regionStats[q.region].correct++
      }
    })

    return (
      <section
        id="quiz"
        className="py-20 md:py-28 scroll-mt-20"
        style={{
          background:
            'linear-gradient(180deg, oklch(0.55 0.1 60 / 0.04) 0%, transparent 100%)',
        }}
      >
        <div className="container mx-auto max-w-2xl px-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="rounded-xl border border-border bg-card p-6 sm:p-8 md:p-10 lg:p-12 text-center"
          >
            <motion.div
              initial={{ scale: 0, rotate: -20 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 200, damping: 12, delay: 0.1 }}
            >
              <Trophy className="h-12 w-12 sm:h-14 sm:w-14 md:h-16 md:w-16 mx-auto mb-1 text-primary" />
            </motion.div>
            <motion.span
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="block text-2xl sm:text-3xl mb-2"
            >
              {tier.emoji}
            </motion.span>
            <motion.h3
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="font-display text-xl sm:text-2xl md:text-3xl font-semibold mb-1"
            >
              Квиз пройден!
            </motion.h3>
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-sm sm:text-base text-muted-foreground mb-4 sm:mb-6"
            >
              Правильных ответов:
            </motion.p>
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 150, damping: 14, delay: 0.5 }}
              className="font-display text-4xl sm:text-5xl md:text-6xl font-bold gold-text mb-1 sm:mb-2"
            >
              {correctCount} / {quizQuestions.length}
            </motion.div>
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className={cn('text-xl sm:text-2xl font-semibold mb-6 sm:mb-8', tier.color)}
            >
              {percent}% — {tier.label}
            </motion.p>

            {/* Статистика по регионам */}
            <motion.div
              initial="hidden"
              animate="visible"
              variants={{
                visible: { transition: { staggerChildren: 0.08, delayChildren: 0.7 } },
              }}
              className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mb-6 sm:mb-8"
            >
              {(['greece', 'rome', 'mesopotamia', 'kuban'] as const).map(
                (key) => {
                  const total = regionStats[key].total
                  const correct = regionStats[key].correct
                  return (
                    <motion.div
                      key={key}
                      variants={{
                        hidden: { opacity: 0, y: 12 },
                        visible: { opacity: 1, y: 0 },
                      }}
                      className="rounded-lg border border-border p-2.5 sm:p-3"
                      style={{
                        backgroundColor: withAlpha(REGION_COLORS[key], 0.08),
                      }}
                    >
                      <div
                        className="text-[10px] sm:text-xs font-medium mb-0.5 sm:mb-1"
                        style={{ color: REGION_COLORS[key] }}
                      >
                        {REGION_LABELS[key]}
                      </div>
                      <div className="text-base sm:text-lg font-bold">
                        {correct}/{total}
                      </div>
                    </motion.div>
                  )
                }
              )}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.0 }}
            >
              <Button onClick={reset} size="lg">
                <RotateCcw className="h-4 w-4 mr-2" />
                Пройти заново
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>
    )
  }

  return (
    <section
      id="quiz"
      className="py-20 md:py-28 scroll-mt-20"
      style={{
        background:
          'linear-gradient(180deg, oklch(0.55 0.1 60 / 0.04) 0%, transparent 100%)',
      }}
    >
      <div className="container mx-auto max-w-3xl px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6 }}
          className="mb-6 sm:mb-8 text-center"
        >
          <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 rounded-full border border-primary/30 bg-primary/5 mb-3 sm:mb-4">
            <Brain className="h-3.5 w-3.5 text-primary" />
            <span className="text-[10px] sm:text-xs uppercase tracking-widest font-medium">
              Проверка знаний
            </span>
          </div>
          <h2 className="font-display text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-semibold mb-3 sm:mb-4">
            Исторический квиз
          </h2>
          <p className="text-sm sm:text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
            {quizQuestions.length} вопросов о Греции, Риме, Месопотамии и
            Кубани. Проверьте, насколько хорошо вы усвоили материал.
          </p>
        </motion.div>

        {/* Прогресс */}
        <div className="mb-5 sm:mb-6">
          <div className="flex items-center justify-between text-xs sm:text-sm mb-1.5 sm:mb-2">
            <span className="text-muted-foreground">
              Вопрос {current + 1} из {quizQuestions.length}
            </span>
            <span className="font-medium">
              Правильно: {correctCount} / {quizQuestions.length}
            </span>
          </div>
          <Progress value={progress} className="h-1.5 sm:h-2" />
          <div className="flex gap-1 mt-1.5 sm:mt-2 justify-center">
            {quizQuestions.map((_, i) => {
              const a = answers[i]
              const isCorrect_q = a !== null && a === quizQuestions[i].correct
              return (
                <button
                  type="button"
                  key={i}
                  onClick={() => {
                    if (answers[i] !== null || i < current) {
                      setCurrent(i)
                      setSelected(answers[i] ?? null)
                    }
                  }}
                  className={cn(
                    'h-1.5 sm:h-2 rounded-full transition-all cursor-pointer',
                    i === current ? 'w-5 sm:w-6 bg-primary' : 'w-1.5 sm:w-2',
                    a === null ? 'bg-border' : isCorrect_q ? 'bg-green-500' : 'bg-red-400'
                  )}
                  aria-label={`Вопрос ${i + 1}${a !== null ? (isCorrect_q ? ', верно' : ', неверно') : ', не отвечен'}`}
                />
              )
            })}
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={current}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="rounded-xl border border-border bg-card p-4 sm:p-5 md:p-6 lg:p-8"
          >
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <span
                className="text-[10px] sm:text-xs uppercase tracking-widest font-medium px-2 py-1 rounded-full"
                style={{
                  backgroundColor: withAlpha(REGION_COLORS[q.region], 0.12),
                  color: REGION_COLORS[q.region],
                }}
              >
                {REGION_LABELS[q.region]}
              </span>
              {!isAnswered && (
                <span className="hidden sm:inline text-[11px] text-muted-foreground italic">
                  1–{q.options.length} — ответ, Enter — далее
                </span>
              )}
            </div>

            <h3 className="font-display text-base sm:text-lg md:text-xl lg:text-2xl font-semibold mb-4 sm:mb-6 leading-snug">
              {q.question}
            </h3>

            <div className="space-y-2">
              {q.options.map((opt, i) => {
                const showAsCorrect = isAnswered && i === q.correct
                const showAsWrong = isAnswered && i === selected && i !== q.correct
                return (
                  <motion.button
                    key={i}
                    whileTap={!isAnswered ? { scale: 0.98 } : undefined}
                    onClick={() => select(i)}
                    disabled={isAnswered}
                    className={cn(
                      'w-full text-left p-3 sm:p-4 rounded-lg border transition-all flex items-center gap-2 sm:gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1',
                      !isAnswered &&
                        'border-border hover:border-primary hover:bg-accent/5 hover:shadow-sm cursor-pointer',
                      showAsCorrect &&
                        'border-green-500 bg-green-50 dark:bg-green-950/30',
                      showAsWrong &&
                        'border-red-500 bg-red-50 dark:bg-red-950/30',
                      isAnswered &&
                        !showAsCorrect &&
                        !showAsWrong &&
                        'border-border opacity-50'
                    )}
                  >
                    <span
                      className={cn(
                        'flex h-6 w-6 sm:h-7 sm:w-7 shrink-0 items-center justify-center rounded-full text-[11px] sm:text-xs font-bold border-2',
                        !isAnswered && 'border-border',
                        showAsCorrect && 'border-green-500 bg-green-500 text-white',
                        showAsWrong && 'border-red-500 bg-red-500 text-white',
                        isAnswered &&
                          !showAsCorrect &&
                          !showAsWrong &&
                          'border-border'
                      )}
                    >
                      {showAsCorrect ? (
                        <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      ) : showAsWrong ? (
                        <XCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      ) : (
                        String.fromCharCode(65 + i)
                      )}
                    </span>
                    <span className="text-xs sm:text-sm md:text-base flex-1 leading-relaxed">{opt}</span>
                  </motion.button>
                )
              })}
            </div>

            {isAnswered && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
            className={cn(
              'mt-3 sm:mt-4 p-3 sm:p-4 rounded-lg border',
              isCorrect
                ? 'border-green-500/40 bg-green-50 dark:bg-green-950/30'
                : 'border-amber-500/40 bg-amber-50 dark:bg-amber-950/30'
            )}
          >
            <p
              className={cn(
                'text-xs sm:text-sm font-semibold mb-1',
                isCorrect ? 'text-green-700 dark:text-green-400' : 'text-amber-700 dark:text-amber-400'
              )}
            >
              {isCorrect ? '✓ Верно!' : '✗ Не совсем так'}
            </p>
            <p className="text-xs sm:text-sm text-foreground/85 leading-relaxed">
              {q.explanation}
            </p>
              </motion.div>
            )}

            <div className="mt-4 sm:mt-6 flex flex-col-reverse sm:flex-row justify-between gap-2 sm:gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={goPrev}
                disabled={current === 0}
                className="flex-1 sm:flex-none"
              >
                Назад
              </Button>
              <Button onClick={goNext} disabled={!isAnswered} size="sm" className="flex-1 sm:flex-none">
                {current + 1 >= quizQuestions.length
                  ? 'Завершить'
                  : 'Следующий вопрос'}
              </Button>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  )
}
