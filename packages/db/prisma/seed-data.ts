/**
 * Seed data configuration for all artists.
 *
 * This module is imported by both seed.ts (to write to the database) and
 * seed.test.ts (to validate data integrity). Keeping data here as the
 * single source of truth prevents drift between the seed and its tests.
 */

import type {
  ArtistStatusType,
  CategoryType,
  CvEntryTypeType,
  ListingStatusType,
  ProcessMediaTypeType,
} from '../src/generated/prisma/client'

// ============================================================================
// Types
// ============================================================================

export interface SeedUser {
  cognitoId: string
  email: string
  fullName: string
  avatarUrl: string
}

export interface SeedProfile {
  displayName: string
  slug: string
  bio: string
  location: string
  websiteUrl: string | null
  instagramUrl: string | null
  originZip: string
  status: ArtistStatusType
  commissionsOpen: boolean
  coverImageUrl: string | null
  profileImageUrl: string | null
  applicationSource: string | null
}

export interface SeedCvEntry {
  type: CvEntryTypeType
  title: string
  institution: string
  year: number
  sortOrder: number
}

export interface SeedListing {
  title: string
  description: string
  medium: string
  category: CategoryType
  price: number
  status: ListingStatusType
  isDocumented: boolean
  artworkLength: number
  artworkWidth: number
  artworkHeight: number
  packedLength: number
  packedWidth: number
  packedHeight: number
  packedWeight: number
}

export interface SeedProcessMedia {
  type: ProcessMediaTypeType
  url?: string
  sortOrder: number
}

export interface ArtistSeedConfig {
  user: SeedUser
  profile: SeedProfile
  categories: CategoryType[]
  cvEntries: SeedCvEntry[]
  listings: SeedListing[]
  processMedia: SeedProcessMedia[]
}

// ============================================================================
// CDN helpers
// ============================================================================

// Production CloudFront CDN for seed images (surfaced-art-prod-media bucket)
export const CDN_BASE = 'https://dmfu4c7s6z2cc.cloudfront.net'

export function cdnUrl(path: string): string {
  return `${CDN_BASE}/seed/${path}`
}

// ============================================================================
// Artist 1: Abbey Peters (founding advisor / SIL)
// ============================================================================

const abbeyConfig: ArtistSeedConfig = {
  user: {
    cognitoId: 'seed-abbey-peters-cognito',
    email: 'abbey@abbey-peters.com',
    fullName: 'Abbey Peters',
    avatarUrl: cdnUrl('abbey-peters/profile.webp'),
  },
  profile: {
    displayName: 'Abbey Peters',
    slug: 'abbey-peters',
    bio: 'Abbey Peters is an artist working primarily with ceramics and collected ephemeral materials. She is currently based in Denver, CO and serves as the Phipps Visiting Professor of Ceramics at the University of Denver. She holds an MFA in Ceramics from the University of Iowa and a BFA from the University of Arkansas. Her work has been exhibited across the US and Canada in over forty group exhibitions, in addition to recent solo shows at Berea College and UIHC Project Art. Peters has received international research grants supporting projects on reproductive care, seed preservation, and beekeeping in London, UK. She has completed residencies at laRex l\'Atelier in France, the inaugural CIRCA Exchange, and Vermont Studio Center.',
    location: 'Denver, CO',
    websiteUrl: 'https://abbey-peters.com',
    instagramUrl: 'https://www.instagram.com/abbey_peters',
    originZip: '80210',
    status: 'approved',
    commissionsOpen: false,
    coverImageUrl: cdnUrl('abbey-peters/cover.webp'),
    profileImageUrl: cdnUrl('abbey-peters/profile.webp'),
    applicationSource: 'advisor_network',
  },
  categories: ['ceramics', 'mixed_media'],
  cvEntries: [
    // Education
    { type: 'education', title: 'MFA, Ceramics (Sculpture Secondary)', institution: 'University of Iowa', year: 2024, sortOrder: 1 },
    { type: 'education', title: 'MA, Ceramics', institution: 'University of Iowa', year: 2023, sortOrder: 2 },
    { type: 'education', title: 'BFA, Studio Art (Minor: Art History)', institution: 'University of Arkansas', year: 2019, sortOrder: 3 },
    // Solo Exhibitions
    { type: 'exhibition', title: 'Carefully Held', institution: 'Berea College, Berea, KY', year: 2025, sortOrder: 4 },
    { type: 'exhibition', title: '24: Sub Rosa', institution: 'UI Health Care: Project Art, Iowa City, IA', year: 2024, sortOrder: 5 },
    { type: 'exhibition', title: 'From Lemons to Leaves', institution: 'Drewelowe Gallery, Iowa City, IA', year: 2024, sortOrder: 6 },
    // Selected Group Exhibitions
    { type: 'exhibition', title: 'Beyond the Garden (NCECA 2026)', institution: 'Detroit, MI', year: 2026, sortOrder: 7 },
    { type: 'exhibition', title: 'What Holds', institution: 'Vessels + Sticks, Toronto, Canada', year: 2025, sortOrder: 8 },
    { type: 'exhibition', title: 'Soft Power', institution: 'Lydia and Robert Ruyle Gallery, University of Northern Colorado, Greeley, CO', year: 2025, sortOrder: 9 },
    { type: 'exhibition', title: 'Small Favors', institution: 'The Clay Studio, Philadelphia, PA', year: 2024, sortOrder: 10 },
    { type: 'exhibition', title: 'NCECA Juried Student Exhibition', institution: 'Visual Art Center, Richmond, VA', year: 2024, sortOrder: 11 },
    // Residencies
    { type: 'residency', title: 'Artist in Residence, Ceramics', institution: 'University of Denver, Denver, CO', year: 2026, sortOrder: 12 },
    { type: 'residency', title: 'Artist in Residence, Sculpture', institution: 'Vermont Studio Center, Johnson, VT', year: 2025, sortOrder: 13 },
    { type: 'residency', title: 'International Artist Residency Exchange', institution: "laRex l'Atelier, St. Raphael, France", year: 2023, sortOrder: 14 },
    // Awards
    { type: 'award', title: 'Vermont Studio Center Full Fellowship', institution: 'Vermont Studio Center, Johnson, VT', year: 2025, sortOrder: 15 },
    { type: 'award', title: 'Athena Fund Finalist', institution: 'Arc Gallery, Chicago, IL', year: 2024, sortOrder: 16 },
    { type: 'award', title: 'CIRCA Residency Exchange Grant', institution: 'Boulder, CO', year: 2023, sortOrder: 17 },
    // Press
    { type: 'press', title: 'Artist Feature', institution: 'Suboart Magazine, Portugal', year: 2026, sortOrder: 18 },
    { type: 'press', title: 'Spotlight: A Decorative Vessel', institution: 'Ceramics Monthly', year: 2025, sortOrder: 19 },
  ],
  listings: [
    // Available listings (5 selected from her 21)
    {
      title: 'Drippy Teal Box',
      description: 'Functional lidded box made with stoneware and glaze.',
      medium: 'stoneware',
      category: 'ceramics',
      price: 11500,
      status: 'available',
      isDocumented: true,
      artworkLength: 4.5, artworkWidth: 5.5, artworkHeight: 4,
      packedLength: 8.5, packedWidth: 9.5, packedHeight: 8,
      packedWeight: 3,
    },
    {
      title: 'Purple and Lighter Purple Box',
      description: 'Functional lidded box made with stoneware and glaze.',
      medium: 'stoneware',
      category: 'ceramics',
      price: 12500,
      status: 'available',
      isDocumented: false,
      artworkLength: 6, artworkWidth: 5, artworkHeight: 3.5,
      packedLength: 10, packedWidth: 9, packedHeight: 7.5,
      packedWeight: 3.5,
    },
    {
      title: 'Pink Candlestick with Hidden Base',
      description: 'Functional candlestick with a hidden compartment, made with stoneware and glaze.',
      medium: 'stoneware',
      category: 'ceramics',
      price: 6000,
      status: 'available',
      isDocumented: false,
      artworkLength: 5.5, artworkWidth: 5.5, artworkHeight: 5,
      packedLength: 9.5, packedWidth: 9.5, packedHeight: 9,
      packedWeight: 2.5,
    },
    {
      title: 'White with Tea Bag Box',
      description: 'Functional lidded box with embedded tea bag detail, made with stoneware and glaze.',
      medium: 'stoneware',
      category: 'ceramics',
      price: 15000,
      status: 'available',
      isDocumented: true,
      artworkLength: 5, artworkWidth: 5, artworkHeight: 7,
      packedLength: 9, packedWidth: 9, packedHeight: 11,
      packedWeight: 4,
    },
    {
      title: 'Pink Vase',
      description: 'Handmade vase in stoneware and glaze.',
      medium: 'stoneware',
      category: 'ceramics',
      price: 5500,
      status: 'available',
      isDocumented: false,
      artworkLength: 4, artworkWidth: 4, artworkHeight: 7,
      packedLength: 8, packedWidth: 8, packedHeight: 11,
      packedWeight: 2.5,
    },
    // Sold listings (2 for archive)
    {
      title: 'Teal Vase',
      description: 'Handmade vase in stoneware and glaze.',
      medium: 'stoneware',
      category: 'ceramics',
      price: 5500,
      status: 'sold',
      isDocumented: false,
      artworkLength: 5, artworkWidth: 5, artworkHeight: 6.5,
      packedLength: 9, packedWidth: 9, packedHeight: 10.5,
      packedWeight: 3,
    },
    {
      title: 'Pale Pink Box with Key',
      description: 'Functional lidded box with embedded key detail, made with stoneware and glaze.',
      medium: 'stoneware',
      category: 'ceramics',
      price: 12500,
      status: 'sold',
      isDocumented: true,
      artworkLength: 7, artworkWidth: 6, artworkHeight: 5.5,
      packedLength: 11, packedWidth: 10, packedHeight: 9.5,
      packedWeight: 4.5,
    },
  ],
  processMedia: [
    { type: 'photo', url: cdnUrl('abbey-peters/process-studio.webp'), sortOrder: 0 },
    { type: 'photo', url: cdnUrl('abbey-peters/process-kiln.webp'), sortOrder: 1 },
  ],
}

// ============================================================================
// Artist 2: David Morrison
// ============================================================================

const davidConfig: ArtistSeedConfig = {
  user: {
    cognitoId: 'seed-david-morrison-cognito',
    email: 'davidmorrison167@gmail.com',
    fullName: 'David Morrison',
    avatarUrl: cdnUrl('david-morrison/profile.webp'),
  },
  profile: {
    displayName: 'David Morrison',
    slug: 'david-morrison',
    bio: 'David was born and raised in Batavia, IL a western suburb of Chicago. He attended St. Olaf College where he received his B.A. in studio art and a concentration in Asian Studies. Upon graduating he was an artistic intern for the summer and fall of 2019 at Anderson Ranch Arts Center. He is a ceramic oriented mixed media artist and earned his MFA in Art from the University of Oklahoma. He is making playful objects exploring the Anthropocene through re-contextualizing the superfluous waste from our consumption within ceramic assemblages. He is working and pursuing his studio practice in Winooski, Vermont.',
    location: 'Winooski, VT',
    websiteUrl: 'https://morrison-david.com',
    instagramUrl: 'https://www.instagram.com/david_morrison_ceramics',
    originZip: '05404',
    status: 'approved',
    commissionsOpen: false,
    coverImageUrl: cdnUrl('david-morrison/cover.webp'),
    profileImageUrl: cdnUrl('david-morrison/profile.webp'),
    applicationSource: 'advisor_network',
  },
  categories: ['ceramics', 'mixed_media'],
  cvEntries: [
    // Education
    { type: 'education', title: 'MFA, Art', institution: 'University of Oklahoma', year: 2025, sortOrder: 1 },
    { type: 'education', title: 'BA, Studio Art (concentration: Asian Studies)', institution: 'St. Olaf College, Northfield, MN', year: 2019, sortOrder: 2 },
    // Residencies
    { type: 'residency', title: 'Artist in Residence', institution: 'Vermont Studio Center, Johnson, VT', year: 2025, sortOrder: 3 },
    // Exhibitions
    { type: 'exhibition', title: '63rd Faenza Prize (Shortlisted)', institution: 'International Museum of Ceramics, Faenza, Italy', year: 2025, sortOrder: 4 },
    { type: 'exhibition', title: 'NCECA National Student Juried Exhibition', institution: 'Richmond, VA', year: 2024, sortOrder: 5 },
    { type: 'exhibition', title: 'Hot, Happy Mess — The Dysfunction of Process', institution: 'The Guild, Northfield, MN', year: 2020, sortOrder: 6 },
    { type: 'exhibition', title: 'Interim', institution: 'Patton-Malott Gallery, Anderson Ranch, Snowmass Village, CO', year: 2019, sortOrder: 7 },
    { type: 'exhibition', title: 'Cross River Connections (NCECA)', institution: 'The Phipps, Hudson, WI', year: 2019, sortOrder: 8 },
    // Awards
    { type: 'award', title: 'Scholarship', institution: 'Anderson Ranch Arts Center, Snowmass Village, CO', year: 2018, sortOrder: 9 },
  ],
  listings: [
    // Available listings
    {
      title: 'micro-landscape (0011)',
      description: 'Porcelaneous stoneware sculptural landscape with glaze, neon, electricity, and silicon.',
      medium: 'porcelaneous stoneware, glaze, neon, electricity, silicon',
      category: 'ceramics',
      price: 55000,
      status: 'available',
      isDocumented: true,
      artworkLength: 11, artworkWidth: 8, artworkHeight: 8,
      packedLength: 15, packedWidth: 12, packedHeight: 12,
      packedWeight: 8,
    },
    {
      title: 'Core Sample Cup (27)',
      description: 'Functional cup from the Core Sample series. Earthenware with mixed media.',
      medium: 'earthenware, mixed media',
      category: 'ceramics',
      price: 5500,
      status: 'available',
      isDocumented: false,
      artworkLength: 4, artworkWidth: 3.5, artworkHeight: 4,
      packedLength: 8, packedWidth: 7.5, packedHeight: 8,
      packedWeight: 2,
    },
    {
      title: 'Core Sample Mug (22)',
      description: 'Functional mug from the Core Sample series. Earthenware with mixed media.',
      medium: 'earthenware, mixed media',
      category: 'ceramics',
      price: 5500,
      status: 'available',
      isDocumented: false,
      artworkLength: 5, artworkWidth: 3.5, artworkHeight: 4.5,
      packedLength: 9, packedWidth: 7.5, packedHeight: 8.5,
      packedWeight: 2,
    },
    {
      title: 'Core Sample Tumbler (14)',
      description: 'Functional tumbler from the Core Sample series. Earthenware with mixed media.',
      medium: 'earthenware, mixed media',
      category: 'ceramics',
      price: 5500,
      status: 'available',
      isDocumented: false,
      artworkLength: 3.5, artworkWidth: 3.5, artworkHeight: 5,
      packedLength: 7.5, packedWidth: 7.5, packedHeight: 9,
      packedWeight: 2,
    },
    // Sold listings
    {
      title: 'Core Sample Mug (29)',
      description: 'Functional mug from the Core Sample series. Earthenware with mixed media.',
      medium: 'earthenware, mixed media',
      category: 'ceramics',
      price: 5500,
      status: 'sold',
      isDocumented: false,
      artworkLength: 5, artworkWidth: 3.5, artworkHeight: 4.5,
      packedLength: 9, packedWidth: 7.5, packedHeight: 8.5,
      packedWeight: 2,
    },
    {
      title: 'Core Sample Bowl (24)',
      description: 'Functional bowl from the Core Sample series. Earthenware with mixed media.',
      medium: 'earthenware, mixed media',
      category: 'ceramics',
      price: 5500,
      status: 'sold',
      isDocumented: false,
      artworkLength: 6, artworkWidth: 6, artworkHeight: 3,
      packedLength: 10, packedWidth: 10, packedHeight: 7,
      packedWeight: 2.5,
    },
  ],
  processMedia: [
    { type: 'photo', url: cdnUrl('david-morrison/process-studio.webp'), sortOrder: 0 },
  ],
}

// ============================================================================
// Artist 3: Karina Yanes
// ============================================================================

const karinaConfig: ArtistSeedConfig = {
  user: {
    cognitoId: 'seed-karina-yanes-cognito',
    email: 'karina@karinayanesceramics.com',
    fullName: 'Karina Yanes',
    avatarUrl: cdnUrl('karina-yanes/profile.webp'),
  },
  profile: {
    displayName: 'Karina Yanes',
    slug: 'karina-yanes',
    bio: 'Karina Yanes is a Puerto Rican-Palestinian-Midwesterner ceramic artist based in Gainesville, FL. She creates and pieces together ceramic multiples, fragments, and tiles with collaged surfaces that hold onto traditions, icons, architecture, and language from her family\'s oral histories. Her practice highlights how cultures are carried on through repetition, daily gestures, and acts of care — reflected in her work through tedious, repetitive making and careful craft. Yanes holds an MFA in Studio Art from the University of Florida and a BA from Denison University. She has exhibited nationally and internationally, with forthcoming solo exhibitions at Art Center Sarasota and Morean Center for Clay.',
    location: 'Gainesville, FL',
    websiteUrl: 'https://karinayanesceramics.squarespace.com',
    instagramUrl: 'https://www.instagram.com/karinayanes.ceramics',
    originZip: '32601',
    status: 'approved',
    commissionsOpen: false,
    coverImageUrl: cdnUrl('karina-yanes/cover.webp'),
    profileImageUrl: cdnUrl('karina-yanes/profile.webp'),
    applicationSource: 'advisor_network',
  },
  categories: ['ceramics', 'mixed_media'],
  cvEntries: [
    // Education
    { type: 'education', title: 'MFA, Studio Art (Ceramics)', institution: 'University of Florida, Gainesville, FL', year: 2025, sortOrder: 1 },
    { type: 'education', title: 'Post-Baccalaureate', institution: 'University of Florida, Gainesville, FL', year: 2022, sortOrder: 2 },
    { type: 'education', title: 'BA, Studio Art & Communication', institution: 'Denison University, Granville, OH', year: 2017, sortOrder: 3 },
    // Solo Exhibitions
    { type: 'exhibition', title: 'Between Two Groves (Forthcoming)', institution: 'Morean Center for Clay, St. Petersburg, FL', year: 2026, sortOrder: 4 },
    { type: 'exhibition', title: 'We Never Thought We\'d Be Here', institution: '4Most Gallery, Gainesville, FL', year: 2024, sortOrder: 5 },
    // Selected Group Exhibitions
    { type: 'exhibition', title: 'NCECA Annual: Absence Takes Form (Forthcoming)', institution: 'Wasserman Projects, Detroit, MI', year: 2026, sortOrder: 6 },
    { type: 'exhibition', title: 'All We Ate Was Watermelon', institution: 'University Gallery, Gainesville, FL', year: 2025, sortOrder: 7 },
    { type: 'exhibition', title: 'Beacon', institution: 'Human Rights Gallery at The Leonardo, Salt Lake City, UT', year: 2025, sortOrder: 8 },
    { type: 'exhibition', title: 'Fresh Squeezed: Emerging Artists in Florida', institution: 'Morean Center for Arts, St. Petersburg, FL', year: 2024, sortOrder: 9 },
    // Residencies
    { type: 'residency', title: 'Artist in Residence', institution: 'ACRE, Steuben, WI', year: 2025, sortOrder: 10 },
    { type: 'residency', title: 'Summer Residency', institution: 'Craigardan, Elizabethtown, NY', year: 2024, sortOrder: 11 },
    { type: 'residency', title: 'Open Studio Residency', institution: 'Haystack Mountain School of Crafts, Deer Isle, ME', year: 2023, sortOrder: 12 },
    // Awards
    { type: 'award', title: 'NCECA Graduate Fellowship', institution: 'Richmond, VA', year: 2024, sortOrder: 13 },
    { type: 'award', title: 'Penland School of Craft Higher Education Partners Scholarship', institution: 'University of Florida', year: 2024, sortOrder: 14 },
  ],
  listings: [
    // Available listings
    {
      title: 'Olive Oil Bowl, blue tatreez',
      description: 'Handmade olive oil bowl with tatreez-inspired surface pattern in blue.',
      medium: 'stoneware, glaze',
      category: 'ceramics',
      price: 4200,
      status: 'available',
      isDocumented: false,
      artworkLength: 6, artworkWidth: 6, artworkHeight: 2.5,
      packedLength: 10, packedWidth: 10, packedHeight: 6.5,
      packedWeight: 2,
    },
    {
      title: 'Olive Oil Bowl, green and ochre',
      description: 'Handmade olive oil bowl with collaged surface in green and ochre tones.',
      medium: 'stoneware, glaze',
      category: 'ceramics',
      price: 4200,
      status: 'available',
      isDocumented: false,
      artworkLength: 6, artworkWidth: 6, artworkHeight: 2.5,
      packedLength: 10, packedWidth: 10, packedHeight: 6.5,
      packedWeight: 2,
    },
    {
      title: 'Collaged Tile, watermelon',
      description: 'Ceramic tile with collaged underglaze surface depicting watermelon motif.',
      medium: 'stoneware, underglaze, collage',
      category: 'ceramics',
      price: 6500,
      status: 'available',
      isDocumented: true,
      artworkLength: 8, artworkWidth: 8, artworkHeight: 1,
      packedLength: 12, packedWidth: 12, packedHeight: 5,
      packedWeight: 3,
    },
    // Sold listings
    {
      title: 'Olive Oil Bowl 3',
      description: 'Handmade olive oil bowl with collaged ceramic surface.',
      medium: 'stoneware, glaze',
      category: 'ceramics',
      price: 4200,
      status: 'sold',
      isDocumented: false,
      artworkLength: 6, artworkWidth: 6, artworkHeight: 2.5,
      packedLength: 10, packedWidth: 10, packedHeight: 6.5,
      packedWeight: 2,
    },
    {
      title: 'Olive Oil Bowl 4',
      description: 'Handmade olive oil bowl with collaged ceramic surface.',
      medium: 'stoneware, glaze',
      category: 'ceramics',
      price: 4200,
      status: 'sold',
      isDocumented: false,
      artworkLength: 6, artworkWidth: 6, artworkHeight: 2.5,
      packedLength: 10, packedWidth: 10, packedHeight: 6.5,
      packedWeight: 2,
    },
  ],
  processMedia: [
    { type: 'photo', url: cdnUrl('karina-yanes/process-studio.webp'), sortOrder: 0 },
  ],
}

// ============================================================================
// Artist 4: Mako Sandusky
// ============================================================================

const makoConfig: ArtistSeedConfig = {
  user: {
    cognitoId: 'seed-mako-sandusky-cognito',
    email: 'macaylasandusky@gmail.com',
    fullName: 'Macayla Sandusky',
    avatarUrl: cdnUrl('mako-sandusky/profile.webp'),
  },
  profile: {
    displayName: 'Mako Sandusky',
    slug: 'mako-sandusky',
    bio: 'Macayla is a ceramic artist pursuing an MFA at The University of Iowa. They received a BFA from The University of Arkansas with an emphasis in Ceramics and have held teaching positions at multiple community studios in New York City. Their functional vessels are a practice of self-reflection and translation of memory. The fantastical surface drawings blur and blend as the glazes move together to achieve a dreamy quality. By letting go of refinement, their pottery is imaginative while staying rooted in historical contexts of clay and illustration.',
    location: 'Iowa City, IA',
    websiteUrl: 'https://makomud.com',
    instagramUrl: 'https://www.instagram.com/makomud',
    originZip: '52240',
    status: 'approved',
    commissionsOpen: false,
    coverImageUrl: cdnUrl('mako-sandusky/cover.webp'),
    profileImageUrl: cdnUrl('mako-sandusky/profile.webp'),
    applicationSource: 'advisor_network',
  },
  categories: ['ceramics', 'mixed_media'],
  cvEntries: [
    // Education
    { type: 'education', title: 'MFA (in progress)', institution: 'University of Iowa, Iowa City, IA', year: 2025, sortOrder: 1 },
    { type: 'education', title: 'BFA (emphasis: Ceramics)', institution: 'University of Arkansas', year: 2018, sortOrder: 2 },
    // Exhibitions
    { type: 'exhibition', title: 'Gallery Representation', institution: 'A.MANO Brooklyn, Brooklyn, NY', year: 2022, sortOrder: 3 },
    { type: 'exhibition', title: 'Gallery Representation', institution: 'The Clay Studio, Philadelphia, PA', year: 2023, sortOrder: 4 },
    // Professional experience
    { type: 'other', title: 'Ceramic Educator', institution: 'Community studios, New York City', year: 2020, sortOrder: 5 },
    { type: 'other', title: 'Intern', institution: 'Harvard Ceramics Program, Allston, MA', year: 2019, sortOrder: 6 },
    { type: 'other', title: 'Apprentice to Corinne D Peterson', institution: 'Lillstreet Art Center, Chicago, IL', year: 2017, sortOrder: 7 },
  ],
  listings: [
    // Available listings
    {
      title: 'Illustrated Jar, dreaming fox',
      description: 'Functional stoneware jar with fantastical illustrated surface.',
      medium: 'stoneware, glaze',
      category: 'ceramics',
      price: 8500,
      status: 'available',
      isDocumented: true,
      artworkLength: 5, artworkWidth: 5, artworkHeight: 7,
      packedLength: 9, packedWidth: 9, packedHeight: 11,
      packedWeight: 3,
    },
    {
      title: 'Illustrated Jar, night garden',
      description: 'Functional stoneware jar with dreamy illustrated garden scene.',
      medium: 'stoneware, glaze',
      category: 'ceramics',
      price: 8500,
      status: 'available',
      isDocumented: false,
      artworkLength: 5, artworkWidth: 5, artworkHeight: 6.5,
      packedLength: 9, packedWidth: 9, packedHeight: 10.5,
      packedWeight: 3,
    },
    {
      title: 'Illustrated Mug, tangled birds',
      description: 'Functional stoneware mug with illustrated bird motif.',
      medium: 'stoneware, glaze',
      category: 'ceramics',
      price: 4500,
      status: 'available',
      isDocumented: false,
      artworkLength: 5, artworkWidth: 3.5, artworkHeight: 4,
      packedLength: 9, packedWidth: 7.5, packedHeight: 8,
      packedWeight: 2,
    },
    {
      title: 'Illustrated Planter, forest creature',
      description: 'Functional stoneware planter with fantastical creature illustration.',
      medium: 'stoneware, glaze',
      category: 'ceramics',
      price: 9500,
      status: 'available',
      isDocumented: false,
      artworkLength: 6, artworkWidth: 6, artworkHeight: 5.5,
      packedLength: 10, packedWidth: 10, packedHeight: 9.5,
      packedWeight: 3.5,
    },
    // Sold listings
    {
      title: 'Illustrated Jar, swimming fish',
      description: 'Functional stoneware jar with illustrated swimming fish.',
      medium: 'stoneware, glaze',
      category: 'ceramics',
      price: 8500,
      status: 'sold',
      isDocumented: false,
      artworkLength: 5, artworkWidth: 5, artworkHeight: 7,
      packedLength: 9, packedWidth: 9, packedHeight: 11,
      packedWeight: 3,
    },
  ],
  processMedia: [
    { type: 'photo', url: cdnUrl('mako-sandusky/process-studio.webp'), sortOrder: 0 },
  ],
}

// ============================================================================
// Exported artist configs (ordered: Abbey is artist #1 / founding advisor)
// ============================================================================

export const artistConfigs: ArtistSeedConfig[] = [
  abbeyConfig,
  davidConfig,
  karinaConfig,
  makoConfig,
]
