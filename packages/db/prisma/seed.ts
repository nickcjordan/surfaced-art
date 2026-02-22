import { PrismaClient } from '../src/generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

// CloudFront domain placeholder — update with real domain from Terraform output
const CDN_BASE = 'https://d1example.cloudfront.net'

function cdnUrl(path: string): string {
  return `${CDN_BASE}/seed/${path}`
}

function createPrismaClient() {
  const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL,
  })
  return new PrismaClient({ adapter })
}

const prisma = createPrismaClient()

// ============================================================================
// Artist 1: Abbey Peters (founding advisor / SIL)
// ============================================================================

const abbeyUser = {
  cognitoId: 'seed-abbey-peters-cognito',
  email: 'abbey@abbey-peters.com',
  fullName: 'Abbey Peters',
  avatarUrl: cdnUrl('abbey-peters/profile.webp'),
}

const abbeyProfile = {
  displayName: 'Abbey Peters',
  slug: 'abbey-peters',
  bio: 'Abbey Peters is an artist working primarily with ceramics and collected ephemeral materials. She is currently based in Denver, CO and serves as the Phipps Visiting Professor of Ceramics at the University of Denver. She holds an MFA in Ceramics from the University of Iowa and a BFA from the University of Arkansas. Her work has been exhibited across the US and Canada in over forty group exhibitions, in addition to recent solo shows at Berea College and UIHC Project Art. Peters has received international research grants supporting projects on reproductive care, seed preservation, and beekeeping in London, UK. She has completed residencies at laRex l\'Atelier in France, the inaugural CIRCA Exchange, and Vermont Studio Center.',
  location: 'Denver, CO',
  websiteUrl: 'https://abbey-peters.com',
  instagramUrl: 'https://www.instagram.com/abbey_peters',
  originZip: '80210',
  status: 'approved' as const,
  commissionsOpen: false,
  coverImageUrl: cdnUrl('abbey-peters/cover.webp'),
  profileImageUrl: cdnUrl('abbey-peters/profile.webp'),
  applicationSource: 'advisor_network',
}

const abbeyCvEntries = [
  // Education
  { type: 'education' as const, title: 'MFA, Ceramics (Sculpture Secondary)', institution: 'University of Iowa', year: 2024, sortOrder: 1 },
  { type: 'education' as const, title: 'MA, Ceramics', institution: 'University of Iowa', year: 2023, sortOrder: 2 },
  { type: 'education' as const, title: 'BFA, Studio Art (Minor: Art History)', institution: 'University of Arkansas', year: 2019, sortOrder: 3 },
  // Solo Exhibitions
  { type: 'exhibition' as const, title: 'Carefully Held', institution: 'Berea College, Berea, KY', year: 2025, sortOrder: 4 },
  { type: 'exhibition' as const, title: '24: Sub Rosa', institution: 'UI Health Care: Project Art, Iowa City, IA', year: 2024, sortOrder: 5 },
  { type: 'exhibition' as const, title: 'From Lemons to Leaves', institution: 'Drewelowe Gallery, Iowa City, IA', year: 2024, sortOrder: 6 },
  // Selected Group Exhibitions
  { type: 'exhibition' as const, title: 'Beyond the Garden (NCECA 2026)', institution: 'Detroit, MI', year: 2026, sortOrder: 7 },
  { type: 'exhibition' as const, title: 'What Holds', institution: 'Vessels + Sticks, Toronto, Canada', year: 2025, sortOrder: 8 },
  { type: 'exhibition' as const, title: 'Soft Power', institution: 'Lydia and Robert Ruyle Gallery, University of Northern Colorado, Greeley, CO', year: 2025, sortOrder: 9 },
  { type: 'exhibition' as const, title: 'Small Favors', institution: 'The Clay Studio, Philadelphia, PA', year: 2024, sortOrder: 10 },
  { type: 'exhibition' as const, title: 'NCECA Juried Student Exhibition', institution: 'Visual Art Center, Richmond, VA', year: 2024, sortOrder: 11 },
  // Residencies
  { type: 'residency' as const, title: 'Artist in Residence, Ceramics', institution: 'University of Denver, Denver, CO', year: 2026, sortOrder: 12 },
  { type: 'residency' as const, title: 'Artist in Residence, Sculpture', institution: 'Vermont Studio Center, Johnson, VT', year: 2025, sortOrder: 13 },
  { type: 'residency' as const, title: 'International Artist Residency Exchange', institution: "laRex l'Atelier, St. Raphael, France", year: 2023, sortOrder: 14 },
  // Awards
  { type: 'award' as const, title: 'Vermont Studio Center Full Fellowship', institution: 'Vermont Studio Center, Johnson, VT', year: 2025, sortOrder: 15 },
  { type: 'award' as const, title: 'Athena Fund Finalist', institution: 'Arc Gallery, Chicago, IL', year: 2024, sortOrder: 16 },
  { type: 'award' as const, title: 'CIRCA Residency Exchange Grant', institution: 'Boulder, CO', year: 2023, sortOrder: 17 },
  // Press
  { type: 'press' as const, title: 'Artist Feature', institution: 'Suboart Magazine, Portugal', year: 2026, sortOrder: 18 },
  { type: 'press' as const, title: 'Spotlight: A Decorative Vessel', institution: 'Ceramics Monthly', year: 2025, sortOrder: 19 },
]

const abbeyListings = [
  // Available listings (5 selected from her 21)
  {
    title: 'Drippy Teal Box',
    description: 'Functional lidded box made with stoneware and glaze.',
    medium: 'stoneware',
    category: 'ceramics' as const,
    price: 11500,
    status: 'available' as const,
    isDocumented: true,
    artworkLength: 4.5, artworkWidth: 5.5, artworkHeight: 4,
    packedLength: 8.5, packedWidth: 9.5, packedHeight: 8,
    packedWeight: 3,
  },
  {
    title: 'Purple and Lighter Purple Box',
    description: 'Functional lidded box made with stoneware and glaze.',
    medium: 'stoneware',
    category: 'ceramics' as const,
    price: 12500,
    status: 'available' as const,
    isDocumented: false,
    artworkLength: 6, artworkWidth: 5, artworkHeight: 3.5,
    packedLength: 10, packedWidth: 9, packedHeight: 7.5,
    packedWeight: 3.5,
  },
  {
    title: 'Pink Candlestick with Hidden Base',
    description: 'Functional candlestick with a hidden compartment, made with stoneware and glaze.',
    medium: 'stoneware',
    category: 'ceramics' as const,
    price: 6000,
    status: 'available' as const,
    isDocumented: false,
    artworkLength: 5.5, artworkWidth: 5.5, artworkHeight: 5,
    packedLength: 9.5, packedWidth: 9.5, packedHeight: 9,
    packedWeight: 2.5,
  },
  {
    title: 'White with Tea Bag Box',
    description: 'Functional lidded box with embedded tea bag detail, made with stoneware and glaze.',
    medium: 'stoneware',
    category: 'ceramics' as const,
    price: 15000,
    status: 'available' as const,
    isDocumented: true,
    artworkLength: 5, artworkWidth: 5, artworkHeight: 7,
    packedLength: 9, packedWidth: 9, packedHeight: 11,
    packedWeight: 4,
  },
  {
    title: 'Pink Vase',
    description: 'Handmade vase in stoneware and glaze.',
    medium: 'stoneware',
    category: 'ceramics' as const,
    price: 5500,
    status: 'available' as const,
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
    category: 'ceramics' as const,
    price: 5500,
    status: 'sold' as const,
    isDocumented: false,
    artworkLength: 5, artworkWidth: 5, artworkHeight: 6.5,
    packedLength: 9, packedWidth: 9, packedHeight: 10.5,
    packedWeight: 3,
  },
  {
    title: 'Pale Pink Box with Key',
    description: 'Functional lidded box with embedded key detail, made with stoneware and glaze.',
    medium: 'stoneware',
    category: 'ceramics' as const,
    price: 12500,
    status: 'sold' as const,
    isDocumented: true,
    artworkLength: 7, artworkWidth: 6, artworkHeight: 5.5,
    packedLength: 11, packedWidth: 10, packedHeight: 9.5,
    packedWeight: 4.5,
  },
]

// ============================================================================
// Artist 2: David Morrison
// ============================================================================

const davidUser = {
  cognitoId: 'seed-david-morrison-cognito',
  email: 'davidmorrison167@gmail.com',
  fullName: 'David Morrison',
  avatarUrl: cdnUrl('david-morrison/profile.webp'),
}

const davidProfile = {
  displayName: 'David Morrison',
  slug: 'david-morrison',
  bio: 'David was born and raised in Batavia, IL a western suburb of Chicago. He attended St. Olaf College where he received his B.A. in studio art and a concentration in Asian Studies. Upon graduating he was an artistic intern for the summer and fall of 2019 at Anderson Ranch Arts Center. He is a ceramic oriented mixed media artist and earned his MFA in Art from the University of Oklahoma. He is making playful objects exploring the Anthropocene through re-contextualizing the superfluous waste from our consumption within ceramic assemblages. He is working and pursuing his studio practice in Winooski, Vermont.',
  location: 'Winooski, VT',
  websiteUrl: 'https://morrison-david.com',
  instagramUrl: 'https://www.instagram.com/david_morrison_ceramics',
  originZip: '05404',
  status: 'approved' as const,
  commissionsOpen: false,
  coverImageUrl: cdnUrl('david-morrison/cover.webp'),
  profileImageUrl: cdnUrl('david-morrison/profile.webp'),
  applicationSource: 'advisor_network',
}

const davidCvEntries = [
  // Education
  { type: 'education' as const, title: 'MFA, Art', institution: 'University of Oklahoma', year: 2025, sortOrder: 1 },
  { type: 'education' as const, title: 'BA, Studio Art (concentration: Asian Studies)', institution: 'St. Olaf College, Northfield, MN', year: 2019, sortOrder: 2 },
  // Residencies
  { type: 'residency' as const, title: 'Artist in Residence', institution: 'Vermont Studio Center, Johnson, VT', year: 2025, sortOrder: 3 },
  // Exhibitions
  { type: 'exhibition' as const, title: '63rd Faenza Prize (Shortlisted)', institution: 'International Museum of Ceramics, Faenza, Italy', year: 2025, sortOrder: 4 },
  { type: 'exhibition' as const, title: 'NCECA National Student Juried Exhibition', institution: 'Richmond, VA', year: 2024, sortOrder: 5 },
  { type: 'exhibition' as const, title: 'Hot, Happy Mess — The Dysfunction of Process', institution: 'The Guild, Northfield, MN', year: 2020, sortOrder: 6 },
  { type: 'exhibition' as const, title: 'Interim', institution: 'Patton-Malott Gallery, Anderson Ranch, Snowmass Village, CO', year: 2019, sortOrder: 7 },
  { type: 'exhibition' as const, title: 'Cross River Connections (NCECA)', institution: 'The Phipps, Hudson, WI', year: 2019, sortOrder: 8 },
  // Awards
  { type: 'award' as const, title: 'Scholarship', institution: 'Anderson Ranch Arts Center, Snowmass Village, CO', year: 2018, sortOrder: 9 },
]

const davidListings = [
  // Available listings
  {
    title: 'micro-landscape (0011)',
    description: 'Porcelaneous stoneware sculptural landscape with glaze, neon, electricity, and silicon.',
    medium: 'porcelaneous stoneware, glaze, neon, electricity, silicon',
    category: 'ceramics' as const,
    price: 55000,
    status: 'available' as const,
    isDocumented: true,
    artworkLength: 11, artworkWidth: 8, artworkHeight: 8,
    packedLength: 15, packedWidth: 12, packedHeight: 12,
    packedWeight: 8,
  },
  {
    title: 'Core Sample Cup (27)',
    description: 'Functional cup from the Core Sample series. Earthenware with mixed media.',
    medium: 'earthenware, mixed media',
    category: 'ceramics' as const,
    price: 5500,
    status: 'available' as const,
    isDocumented: false,
    artworkLength: 4, artworkWidth: 3.5, artworkHeight: 4,
    packedLength: 8, packedWidth: 7.5, packedHeight: 8,
    packedWeight: 2,
  },
  {
    title: 'Core Sample Mug (22)',
    description: 'Functional mug from the Core Sample series. Earthenware with mixed media.',
    medium: 'earthenware, mixed media',
    category: 'ceramics' as const,
    price: 5500,
    status: 'available' as const,
    isDocumented: false,
    artworkLength: 5, artworkWidth: 3.5, artworkHeight: 4.5,
    packedLength: 9, packedWidth: 7.5, packedHeight: 8.5,
    packedWeight: 2,
  },
  {
    title: 'Core Sample Tumbler (14)',
    description: 'Functional tumbler from the Core Sample series. Earthenware with mixed media.',
    medium: 'earthenware, mixed media',
    category: 'ceramics' as const,
    price: 5500,
    status: 'available' as const,
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
    category: 'ceramics' as const,
    price: 5500,
    status: 'sold' as const,
    isDocumented: false,
    artworkLength: 5, artworkWidth: 3.5, artworkHeight: 4.5,
    packedLength: 9, packedWidth: 7.5, packedHeight: 8.5,
    packedWeight: 2,
  },
  {
    title: 'Core Sample Bowl (24)',
    description: 'Functional bowl from the Core Sample series. Earthenware with mixed media.',
    medium: 'earthenware, mixed media',
    category: 'ceramics' as const,
    price: 5500,
    status: 'sold' as const,
    isDocumented: false,
    artworkLength: 6, artworkWidth: 6, artworkHeight: 3,
    packedLength: 10, packedWidth: 10, packedHeight: 7,
    packedWeight: 2.5,
  },
]

// ============================================================================
// Artist 3: Karina Yanes
// ============================================================================

const karinaUser = {
  cognitoId: 'seed-karina-yanes-cognito',
  email: 'karina@karinayanesceramics.com',
  fullName: 'Karina Yanes',
  avatarUrl: cdnUrl('karina-yanes/profile.webp'),
}

const karinaProfile = {
  displayName: 'Karina Yanes',
  slug: 'karina-yanes',
  bio: 'Karina Yanes is a Puerto Rican-Palestinian-Midwesterner ceramic artist based in Gainesville, FL. She creates and pieces together ceramic multiples, fragments, and tiles with collaged surfaces that hold onto traditions, icons, architecture, and language from her family\'s oral histories. Her practice highlights how cultures are carried on through repetition, daily gestures, and acts of care — reflected in her work through tedious, repetitive making and careful craft. Yanes holds an MFA in Studio Art from the University of Florida and a BA from Denison University. She has exhibited nationally and internationally, with forthcoming solo exhibitions at Art Center Sarasota and Morean Center for Clay.',
  location: 'Gainesville, FL',
  websiteUrl: 'https://karinayanesceramics.squarespace.com',
  instagramUrl: 'https://www.instagram.com/karinayanes.ceramics',
  originZip: '32601',
  status: 'approved' as const,
  commissionsOpen: false,
  coverImageUrl: cdnUrl('karina-yanes/cover.webp'),
  profileImageUrl: cdnUrl('karina-yanes/profile.webp'),
  applicationSource: 'advisor_network',
}

const karinaCvEntries = [
  // Education
  { type: 'education' as const, title: 'MFA, Studio Art (Ceramics)', institution: 'University of Florida, Gainesville, FL', year: 2025, sortOrder: 1 },
  { type: 'education' as const, title: 'Post-Baccalaureate', institution: 'University of Florida, Gainesville, FL', year: 2022, sortOrder: 2 },
  { type: 'education' as const, title: 'BA, Studio Art & Communication', institution: 'Denison University, Granville, OH', year: 2017, sortOrder: 3 },
  // Solo Exhibitions
  { type: 'exhibition' as const, title: 'Between Two Groves (Forthcoming)', institution: 'Morean Center for Clay, St. Petersburg, FL', year: 2026, sortOrder: 4 },
  { type: 'exhibition' as const, title: 'We Never Thought We\'d Be Here', institution: '4Most Gallery, Gainesville, FL', year: 2024, sortOrder: 5 },
  // Selected Group Exhibitions
  { type: 'exhibition' as const, title: 'NCECA Annual: Absence Takes Form (Forthcoming)', institution: 'Wasserman Projects, Detroit, MI', year: 2026, sortOrder: 6 },
  { type: 'exhibition' as const, title: 'All We Ate Was Watermelon', institution: 'University Gallery, Gainesville, FL', year: 2025, sortOrder: 7 },
  { type: 'exhibition' as const, title: 'Beacon', institution: 'Human Rights Gallery at The Leonardo, Salt Lake City, UT', year: 2025, sortOrder: 8 },
  { type: 'exhibition' as const, title: 'Fresh Squeezed: Emerging Artists in Florida', institution: 'Morean Center for Arts, St. Petersburg, FL', year: 2024, sortOrder: 9 },
  // Residencies
  { type: 'residency' as const, title: 'Artist in Residence', institution: 'ACRE, Steuben, WI', year: 2025, sortOrder: 10 },
  { type: 'residency' as const, title: 'Summer Residency', institution: 'Craigardan, Elizabethtown, NY', year: 2024, sortOrder: 11 },
  { type: 'residency' as const, title: 'Open Studio Residency', institution: 'Haystack Mountain School of Crafts, Deer Isle, ME', year: 2023, sortOrder: 12 },
  // Awards
  { type: 'award' as const, title: 'NCECA Graduate Fellowship', institution: 'Richmond, VA', year: 2024, sortOrder: 13 },
  { type: 'award' as const, title: 'Penland School of Craft Higher Education Partners Scholarship', institution: 'University of Florida', year: 2024, sortOrder: 14 },
]

const karinaListings = [
  // Available listings
  {
    title: 'Olive Oil Bowl, blue tatreez',
    description: 'Handmade olive oil bowl with tatreez-inspired surface pattern in blue.',
    medium: 'stoneware, glaze',
    category: 'ceramics' as const,
    price: 4200,
    status: 'available' as const,
    isDocumented: false,
    artworkLength: 6, artworkWidth: 6, artworkHeight: 2.5,
    packedLength: 10, packedWidth: 10, packedHeight: 6.5,
    packedWeight: 2,
  },
  {
    title: 'Olive Oil Bowl, green and ochre',
    description: 'Handmade olive oil bowl with collaged surface in green and ochre tones.',
    medium: 'stoneware, glaze',
    category: 'ceramics' as const,
    price: 4200,
    status: 'available' as const,
    isDocumented: false,
    artworkLength: 6, artworkWidth: 6, artworkHeight: 2.5,
    packedLength: 10, packedWidth: 10, packedHeight: 6.5,
    packedWeight: 2,
  },
  {
    title: 'Collaged Tile, watermelon',
    description: 'Ceramic tile with collaged underglaze surface depicting watermelon motif.',
    medium: 'stoneware, underglaze, collage',
    category: 'ceramics' as const,
    price: 6500,
    status: 'available' as const,
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
    category: 'ceramics' as const,
    price: 4200,
    status: 'sold' as const,
    isDocumented: false,
    artworkLength: 6, artworkWidth: 6, artworkHeight: 2.5,
    packedLength: 10, packedWidth: 10, packedHeight: 6.5,
    packedWeight: 2,
  },
  {
    title: 'Olive Oil Bowl 4',
    description: 'Handmade olive oil bowl with collaged ceramic surface.',
    medium: 'stoneware, glaze',
    category: 'ceramics' as const,
    price: 4200,
    status: 'sold' as const,
    isDocumented: false,
    artworkLength: 6, artworkWidth: 6, artworkHeight: 2.5,
    packedLength: 10, packedWidth: 10, packedHeight: 6.5,
    packedWeight: 2,
  },
]

// ============================================================================
// Artist 4: Mako Sandusky
// ============================================================================

const makoUser = {
  cognitoId: 'seed-mako-sandusky-cognito',
  email: 'macaylasandusky@gmail.com',
  fullName: 'Macayla Sandusky',
  avatarUrl: cdnUrl('mako-sandusky/profile.webp'),
}

const makoProfile = {
  displayName: 'Mako Sandusky',
  slug: 'mako-sandusky',
  bio: 'Macayla is a ceramic artist pursuing an MFA at The University of Iowa. They received a BFA from The University of Arkansas with an emphasis in Ceramics and have held teaching positions at multiple community studios in New York City. Their functional vessels are a practice of self-reflection and translation of memory. The fantastical surface drawings blur and blend as the glazes move together to achieve a dreamy quality. By letting go of refinement, their pottery is imaginative while staying rooted in historical contexts of clay and illustration.',
  location: 'Iowa City, IA',
  websiteUrl: 'https://makomud.com',
  instagramUrl: 'https://www.instagram.com/makomud',
  originZip: '52240',
  status: 'approved' as const,
  commissionsOpen: false,
  coverImageUrl: cdnUrl('mako-sandusky/cover.webp'),
  profileImageUrl: cdnUrl('mako-sandusky/profile.webp'),
  applicationSource: 'advisor_network',
}

const makoCvEntries = [
  // Education
  { type: 'education' as const, title: 'MFA (in progress)', institution: 'University of Iowa, Iowa City, IA', year: 2025, sortOrder: 1 },
  { type: 'education' as const, title: 'BFA (emphasis: Ceramics)', institution: 'University of Arkansas', year: 2018, sortOrder: 2 },
  // Exhibitions
  { type: 'exhibition' as const, title: 'Gallery Representation', institution: 'A.MANO Brooklyn, Brooklyn, NY', year: 2022, sortOrder: 3 },
  { type: 'exhibition' as const, title: 'Gallery Representation', institution: 'The Clay Studio, Philadelphia, PA', year: 2023, sortOrder: 4 },
  // Professional experience
  { type: 'other' as const, title: 'Ceramic Educator', institution: 'Community studios, New York City', year: 2020, sortOrder: 5 },
  { type: 'other' as const, title: 'Intern', institution: 'Harvard Ceramics Program, Allston, MA', year: 2019, sortOrder: 6 },
  { type: 'other' as const, title: 'Apprentice to Corinne D Peterson', institution: 'Lillstreet Art Center, Chicago, IL', year: 2017, sortOrder: 7 },
]

const makoListings = [
  // Available listings
  {
    title: 'Illustrated Jar, dreaming fox',
    description: 'Functional stoneware jar with fantastical illustrated surface.',
    medium: 'stoneware, glaze',
    category: 'ceramics' as const,
    price: 8500,
    status: 'available' as const,
    isDocumented: true,
    artworkLength: 5, artworkWidth: 5, artworkHeight: 7,
    packedLength: 9, packedWidth: 9, packedHeight: 11,
    packedWeight: 3,
  },
  {
    title: 'Illustrated Jar, night garden',
    description: 'Functional stoneware jar with dreamy illustrated garden scene.',
    medium: 'stoneware, glaze',
    category: 'ceramics' as const,
    price: 8500,
    status: 'available' as const,
    isDocumented: false,
    artworkLength: 5, artworkWidth: 5, artworkHeight: 6.5,
    packedLength: 9, packedWidth: 9, packedHeight: 10.5,
    packedWeight: 3,
  },
  {
    title: 'Illustrated Mug, tangled birds',
    description: 'Functional stoneware mug with illustrated bird motif.',
    medium: 'stoneware, glaze',
    category: 'ceramics' as const,
    price: 4500,
    status: 'available' as const,
    isDocumented: false,
    artworkLength: 5, artworkWidth: 3.5, artworkHeight: 4,
    packedLength: 9, packedWidth: 7.5, packedHeight: 8,
    packedWeight: 2,
  },
  {
    title: 'Illustrated Planter, forest creature',
    description: 'Functional stoneware planter with fantastical creature illustration.',
    medium: 'stoneware, glaze',
    category: 'ceramics' as const,
    price: 9500,
    status: 'available' as const,
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
    category: 'ceramics' as const,
    price: 8500,
    status: 'sold' as const,
    isDocumented: false,
    artworkLength: 5, artworkWidth: 5, artworkHeight: 7,
    packedLength: 9, packedWidth: 9, packedHeight: 11,
    packedWeight: 3,
  },
]

// ============================================================================
// Seed function
// ============================================================================

interface ArtistSeedData {
  user: typeof abbeyUser
  profile: typeof abbeyProfile
  categories: Array<'ceramics' | 'painting' | 'print' | 'jewelry' | 'illustration' | 'photography' | 'woodworking' | 'fibers' | 'mixed_media'>
  cvEntries: typeof abbeyCvEntries
  listings: typeof abbeyListings
  processMedia: Array<{ type: 'photo' | 'video'; url?: string; sortOrder: number }>
}

async function seedArtist(data: ArtistSeedData) {
  // Upsert user
  const user = await prisma.user.upsert({
    where: { email: data.user.email },
    update: {
      fullName: data.user.fullName,
      avatarUrl: data.user.avatarUrl,
    },
    create: data.user,
  })

  // Upsert buyer role
  await prisma.userRole.upsert({
    where: { userId_role: { userId: user.id, role: 'buyer' } },
    update: {},
    create: { userId: user.id, role: 'buyer' },
  })

  // Upsert artist role
  await prisma.userRole.upsert({
    where: { userId_role: { userId: user.id, role: 'artist' } },
    update: {},
    create: { userId: user.id, role: 'artist' },
  })

  // Upsert artist profile
  const profile = await prisma.artistProfile.upsert({
    where: { userId: user.id },
    update: {
      displayName: data.profile.displayName,
      slug: data.profile.slug,
      bio: data.profile.bio,
      location: data.profile.location,
      websiteUrl: data.profile.websiteUrl,
      instagramUrl: data.profile.instagramUrl,
      originZip: data.profile.originZip,
      status: data.profile.status,
      commissionsOpen: data.profile.commissionsOpen,
      coverImageUrl: data.profile.coverImageUrl,
      profileImageUrl: data.profile.profileImageUrl,
      applicationSource: data.profile.applicationSource,
    },
    create: {
      userId: user.id,
      ...data.profile,
    },
  })

  // Delete and re-create categories (no unique constraint on individual entries to upsert on)
  await prisma.artistCategory.deleteMany({ where: { artistId: profile.id } })
  for (const category of data.categories) {
    await prisma.artistCategory.create({
      data: { artistId: profile.id, category },
    })
  }

  // Delete and re-create CV entries
  await prisma.artistCvEntry.deleteMany({ where: { artistId: profile.id } })
  for (const entry of data.cvEntries) {
    await prisma.artistCvEntry.create({
      data: { artistId: profile.id, ...entry },
    })
  }

  // Delete and re-create process media
  await prisma.artistProcessMedia.deleteMany({ where: { artistId: profile.id } })
  for (const media of data.processMedia) {
    await prisma.artistProcessMedia.create({
      data: { artistId: profile.id, ...media },
    })
  }

  // Delete and re-create listings (and their images cascade)
  await prisma.listing.deleteMany({ where: { artistId: profile.id } })
  for (let i = 0; i < data.listings.length; i++) {
    const listingData = data.listings[i]
    const listingSlug = listingData.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')

    const listing = await prisma.listing.create({
      data: {
        artistId: profile.id,
        type: 'standard',
        title: listingData.title,
        description: listingData.description,
        medium: listingData.medium,
        category: listingData.category,
        price: listingData.price,
        status: listingData.status,
        isDocumented: listingData.isDocumented,
        quantityTotal: 1,
        quantityRemaining: listingData.status === 'available' ? 1 : 0,
        artworkLength: listingData.artworkLength,
        artworkWidth: listingData.artworkWidth,
        artworkHeight: listingData.artworkHeight,
        packedLength: listingData.packedLength,
        packedWidth: listingData.packedWidth,
        packedHeight: listingData.packedHeight,
        packedWeight: listingData.packedWeight,
      },
    })

    // Create 2 images per listing: primary + one additional angle
    // For documented listings, second image is a process photo
    await prisma.listingImage.create({
      data: {
        listingId: listing.id,
        url: cdnUrl(`${data.profile.slug}/${listingSlug}-front.webp`),
        isProcessPhoto: false,
        sortOrder: 0,
      },
    })
    await prisma.listingImage.create({
      data: {
        listingId: listing.id,
        url: cdnUrl(`${data.profile.slug}/${listingSlug}-angle.webp`),
        isProcessPhoto: listingData.isDocumented,
        sortOrder: 1,
      },
    })
  }

  return { user, profile }
}

async function main() {
  console.log('Start seeding...')

  // Artist 1: Abbey Peters (founding advisor)
  const abbey = await seedArtist({
    user: abbeyUser,
    profile: abbeyProfile,
    categories: ['ceramics', 'mixed_media'],
    cvEntries: abbeyCvEntries,
    listings: abbeyListings,
    processMedia: [
      { type: 'photo', url: cdnUrl('abbey-peters/process-studio.webp'), sortOrder: 0 },
      { type: 'photo', url: cdnUrl('abbey-peters/process-kiln.webp'), sortOrder: 1 },
    ],
  })
  console.log(`  Seeded artist: ${abbey.profile.displayName} (${abbey.profile.slug})`)

  // Artist 2: David Morrison
  const david = await seedArtist({
    user: davidUser,
    profile: davidProfile,
    categories: ['ceramics', 'mixed_media'],
    cvEntries: davidCvEntries,
    listings: davidListings,
    processMedia: [
      { type: 'photo', url: cdnUrl('david-morrison/process-studio.webp'), sortOrder: 0 },
    ],
  })
  console.log(`  Seeded artist: ${david.profile.displayName} (${david.profile.slug})`)

  // Artist 3: Karina Yanes
  const karina = await seedArtist({
    user: karinaUser,
    profile: karinaProfile,
    categories: ['ceramics', 'mixed_media'],
    cvEntries: karinaCvEntries,
    listings: karinaListings,
    processMedia: [
      { type: 'photo', url: cdnUrl('karina-yanes/process-studio.webp'), sortOrder: 0 },
    ],
  })
  console.log(`  Seeded artist: ${karina.profile.displayName} (${karina.profile.slug})`)

  // Artist 4: Mako Sandusky
  const mako = await seedArtist({
    user: makoUser,
    profile: makoProfile,
    categories: ['ceramics', 'mixed_media'],
    cvEntries: makoCvEntries,
    listings: makoListings,
    processMedia: [
      { type: 'photo', url: cdnUrl('mako-sandusky/process-studio.webp'), sortOrder: 0 },
    ],
  })
  console.log(`  Seeded artist: ${mako.profile.displayName} (${mako.profile.slug})`)

  console.log('Seeding finished.')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
