import type { Metadata } from 'next'

function slugToTitle(slug: string): string {
  return slug
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

type Props = {
  params: Promise<{ propertySlug: string }>
  children: React.ReactNode
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { propertySlug } = await params
  const propertyName = slugToTitle(propertySlug)

  return {
    title: `Your Stay at ${propertyName}`,
    description: `Manage your stay at ${propertyName} with Stayscape — chat with your hotel, discover local experiences, and access everything you need for the perfect trip.`,
    openGraph: {
      title: `Your Stay at ${propertyName} | Stayscape`,
      description: `Manage your stay at ${propertyName} — requests, concierge, local discovery and more.`,
      url: `https://www.thestayscape.com/stay/${propertySlug}`,
    },
    twitter: {
      title: `Your Stay at ${propertyName} | Stayscape`,
      description: `Manage your stay at ${propertyName} — requests, concierge, local discovery and more.`,
    },
  }
}

export default function PropertyLayout({ children }: { children: React.ReactNode }) {
  return children
}
