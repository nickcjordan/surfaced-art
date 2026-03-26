import { Hono } from 'hono'
import type { PrismaClient } from '@surfaced-art/db'
import { contactArtistBody, artistSlugParam } from '@surfaced-art/types'
import { sendEmail, ArtistContactMessage } from '@surfaced-art/email'
import { logger } from '@surfaced-art/utils'
import { notFound, validationError, tooManyRequests } from '../errors'

/** Maximum contact messages a single sender can send to a single artist per hour */
const MAX_MESSAGES_PER_HOUR = 3

/**
 * Extract client IP from the request, accounting for API Gateway proxying.
 */
function getClientIp(c: Parameters<typeof notFound>[0]): string {
  return (
    c.req.header('X-Forwarded-For')?.split(',')[0]?.trim() ||
    c.req.header('X-Real-IP') ||
    '127.0.0.1'
  )
}

export function createArtistContactRoutes(prisma: PrismaClient) {
  const contact = new Hono()

  /**
   * POST /artists/:slug/contact
   * Send a contact message to an artist. Public endpoint (no auth required).
   */
  contact.post('/:slug/contact', async (c) => {
    // Validate slug
    const slugParsed = artistSlugParam.safeParse({ slug: c.req.param('slug') })
    if (!slugParsed.success) {
      return validationError(c, slugParsed.error)
    }
    const { slug } = slugParsed.data

    // Validate body
    let body: unknown
    try {
      body = await c.req.json()
    } catch {
      return c.json({ error: { code: 'BAD_REQUEST', message: 'Invalid JSON body' } }, 400)
    }

    const bodyParsed = contactArtistBody.safeParse(body)
    if (!bodyParsed.success) {
      return validationError(c, bodyParsed.error)
    }
    const { firstName, lastName, email, subject, message, website } = bodyParsed.data

    // Honeypot check — silently accept if bot filled the field
    if (website) {
      logger.info('Honeypot triggered on contact form', { slug })
      return c.json({ message: 'Your message has been sent' }, 200)
    }

    // Look up artist
    const artist = await prisma.artistProfile.findUnique({
      where: { slug },
      select: {
        id: true,
        displayName: true,
        contactEmail: true,
        contactEnabled: true,
        status: true,
      },
    })

    if (
      !artist ||
      artist.status !== 'approved' ||
      !artist.contactEmail ||
      !artist.contactEnabled
    ) {
      return notFound(c, 'Artist not found')
    }

    // Application-level rate limiting: max N messages per sender/artist per hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
    const recentCount = await prisma.contactMessage.count({
      where: {
        artistId: artist.id,
        senderEmail: email,
        sentAt: { gte: oneHourAgo },
      },
    })

    if (recentCount >= MAX_MESSAGES_PER_HOUR) {
      return tooManyRequests(
        c,
        'You have sent too many messages to this artist. Please try again later.',
      )
    }

    // Store the message
    const ipAddress = getClientIp(c)
    await prisma.contactMessage.create({
      data: {
        artistId: artist.id,
        senderName: `${firstName} ${lastName}`,
        senderEmail: email,
        subject,
        message,
        ipAddress,
      },
    })

    // Send email (non-blocking — don't fail the request if email fails)
    try {
      await sendEmail({
        to: artist.contactEmail,
        subject: `[Surfaced Art] ${subject}`,
        replyTo: email,
        template: ArtistContactMessage({
          artistName: artist.displayName,
          senderFirstName: firstName,
          senderLastName: lastName,
          senderEmail: email,
          subject,
          message,
        }),
      })
    } catch (err) {
      logger.error('Failed to send contact email', {
        errorMessage: err instanceof Error ? err.message : String(err),
        artistSlug: slug,
        senderEmail: email,
      })
    }

    logger.info('Contact message sent', {
      artistSlug: slug,
      senderEmail: email,
    })

    return c.json({ message: 'Your message has been sent' }, 200)
  })

  return contact
}
