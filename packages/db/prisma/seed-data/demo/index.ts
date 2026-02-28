import { paintingArtists } from './painting'
import { printArtists } from './print'
import { jewelryArtists } from './jewelry'
import { illustrationArtists } from './illustration'
import { photographyArtists } from './photography'
import { woodworkingArtists } from './woodworking'
import { fibersArtists } from './fibers'

/** All fabricated demo artist configs, grouped by primary category. */
export const demoArtistConfigs = [
  ...paintingArtists,
  ...printArtists,
  ...jewelryArtists,
  ...illustrationArtists,
  ...photographyArtists,
  ...woodworkingArtists,
  ...fibersArtists,
]
