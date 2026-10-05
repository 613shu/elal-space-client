import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/booking/$flightId/')({
  beforeLoad: ({ params }) => {
    throw redirect({ to: '/booking/$flightId/seats', params, replace: true })
  },
})
