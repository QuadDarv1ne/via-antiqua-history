import { greece, rome, mesopotamia, kuban, timeline, persons } from '@/lib/history-data'
import HomePageClient from './home-page-client'

export default function Home() {
  const citiesCount = [greece, rome, mesopotamia, kuban].reduce(
    (acc, r) => acc + r.cities.length, 0
  )
  const landmarksCount = [greece, rome, mesopotamia, kuban].reduce(
    (acc, r) => acc + r.cities.reduce((a, c) => a + c.landmarks.length, 0), 0
  )

  const heroStats = {
    citiesCount,
    landmarksCount,
    eventsCount: timeline.length,
    personsCount: persons.length,
  }

  return (
    <HomePageClient
      greece={greece}
      rome={rome}
      mesopotamia={mesopotamia}
      kuban={kuban}
      heroStats={heroStats}
    />
  )
}
