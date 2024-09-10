import type { ISOStringFormat } from 'date-fns'

export {
  Archive,
  Board,
  BuildingType,
  Color,
  Fate,
  Golem,
  Player,
  Resource,
  TokenType,
  EmpireStatus,
  CardType,
  ShipType
}

export type {
  Building,
  Card,
  Holdable,
  MapPiece,
  Multi,
  Piece,
  SaveFile,
  Ship,
  System,
  Systems,
  SystemKey,
  Token,
  FlagshipState,
  FlagshipSlot
}

// Used to represent multiple of an item as a means of compression/easier loading
type Multi<T> = {
  item: T
  type?: string
  count?: number
}

/**
 * Represents a card in the game.
 * @param id - The unique identifier of the card in the form "F1-10"
 */
type Card = {
  id: string
  name?: string
  holding?: Multi<Piece>[]
  isAddedLore?: boolean
}

export type Cluster = 1 | 2 | 3 | 4 | 5 | 6

type Ship = {
  color: Color
  type: ShipType
}

type Building = {
  type: BuildingType
  color: Color
  hasSeatToken?: boolean
  isCloudCity?: boolean
}

type Token = {
  type: TokenType
  // side: 'A' | 'B'
}

type MapPiece = Ship | Building | Token
type Holdable = Resource | Golem
type Piece = MapPiece | Holdable

type FlagshipSlot =
  | 'slipstreamDrive'
  | 'tractorBeam'
  | 'controlArray'
  | 'defenseArray'
  | 'shipCrane'
  | 'hull'

type FlagshipState = {
  [slot in FlagshipSlot]?: {
    upgrade?: [BuildingType, boolean] // Boolean is for freshness
    armor?: [BuildingType, boolean]
  }
}

class Player {
  name: string
  color: Color
  cards: Card[] = []
  resources: Holdable[] = []
  outrage: Resource[] = []
  empireStatus = EmpireStatus.regent
  currentFate: Fate
  notes: string = ''
  /**
   * @param fateHistory - Array of tuples of Fate, power, and boolean if succeeded objective in chronological order prior to current game
   */
  fateHistory: [Fate, number, boolean][] = []
  power: number = 0
  flagshipState?: FlagshipState

  constructor(name: string, color: Color, currentFate: Fate) {
    this.name = name
    this.color = color
    this.cards = []
    this.currentFate = currentFate
  }
}

function processPiece(piece: MapPiece): MapPiece {
  if ((piece as Ship).color && !(piece as Ship).type) {
    const newPiece = piece as Ship
    newPiece.type = ShipType.ship
    return newPiece
  }
  return piece
}

function processMultiPiece(piece: Multi<MapPiece>): Multi<MapPiece> {
  const newPiece = { item: processPiece(piece.item), count: piece.count } as Multi<MapPiece>
  return newPiece
}

type SystemKey = `${1 | 2 | 3 | 4 | 5 | 6}${'A' | 'C' | 'H' | 'G'}`

type System = Multi<MapPiece>
type Systems = Map<SystemKey, System[]>

/**
 * Represents a board with systems and pieces.
 */
class Board {
  systems: Systems = new Map([
    ['1A', []],
    ['1C', []],
    ['1H', []],
    ['1G', []],
    ['2A', []],
    ['2C', []],
    ['2H', []],
    ['2G', []],
    ['3A', []],
    ['3C', []],
    ['3H', []],
    ['3G', []],
    ['4A', []],
    ['4C', []],
    ['4H', []],
    ['4G', []],
    ['5A', []],
    ['5C', []],
    ['5H', []],
    ['5G', []],
    ['6A', []],
    ['6C', []],
    ['6H', []],
    ['6G', []]
  ])
  _systems = {}

  /**
   * Adds a piece to the specified system.
   * @param system The system to add the piece to.
   * @param piece The piece to add.
   */
  addPiece(system: SystemKey, piece: MapPiece) {
    if (this.systems.has(system)) {
      this.systems.get(system)?.push({ item: processPiece(piece), count: 1 })
    }
    this.prepForSave()
  }

  /**
   * Adds multiple pieces to the specified system.
   * @param system The system to add the pieces to.
   * @param pieces An array of pieces to add.
   */
  addPieces(system: SystemKey, pieces: (MapPiece | Multi<MapPiece>)[]) {
    if (this.systems.has(system)) {
      this.systems.get(system)?.push(
        ...pieces.map((p) => {
          if ((p as Multi<MapPiece>).item) {
            return processMultiPiece(p as Multi<MapPiece>)
          }

          return { item: processPiece(p as MapPiece), count: 1 }
        })
      )
    }
    this.prepForSave()
  }

  /**
   * Updates the count of a piece in the specified system.
   * @param system The system to update the piece in.
   * @param piece The piece to update.
   * @param count The new count of the piece.
   */
  updateCount(system: SystemKey, piece: MapPiece, count: number) {
    if (this.systems.has(system)) {
      const pieces = this.systems.get(system)
      if (pieces) {
        const index = pieces.findIndex((p) => p.item === piece)
        if (index >= 0) {
          pieces[index].count = count
        }
      }
    }
    this.prepForSave()
  }

  prepForSave() {
    this._systems = Object.fromEntries(this.systems)
  }
}

interface SaveFile {
  id: string
  name: string
  timestamp: ISOStringFormat
  players: Player[]
  board: {
    systems: Systems
  }
  /**
   * @param scrap - Array of card objects scrapped from the game (implied cards from fate history are excluded)
   */
  scrap: Card[]
  addedFaithfulActionCards?: Card[]
  idealMarkers?: string[]
  act: number
  firstRegent: string
  /**
   * @param edicts - Array of edict cards (implied cards from fate history are excluded)
   */
  edicts: Card[]
  notes: string
}

class Archive {
  players: Player[] = []
  board: Board = new Board()
  /**
   * @param scrap - Array of card objects scrapped from the game (implied cards from fate history are excluded)
   */
  scrap: Card[] = []
  addedFaithfulActionCards?: Card[]
  idealMarkers?: string[]
  act: number = 1
  firstRegent: string
  /**
   * @param edicts - Array of edict cards (implied cards from fate history are excluded)
   */
  edicts: Card[] = []
  /**
   * @param notes - String for details outside of the basic log scope
   */
  notes: string = ''

  constructor(players: Player[]) {
    this.players = players
    this.firstRegent = players[0].name
  }

  setFirstRegent(player: Player) {
    this.firstRegent = player.name
  }
}

enum CardType {
  court = 'COURT',
  law = 'LAW',
  action = 'ACTION',
  fate = 'FATE',
  rules = 'RULES',
  ability = 'Ability',
  lore = 'Lore',
  guild = 'Guild',
  edict = 'Edict',
  title = 'Title',
  vox = 'Vox',
  setup = 'Setup',
  objective = 'Objective',
  resolution = 'Resolution'
}

enum EmpireStatus {
  regent = 'REGENT',
  outlaw = 'OUTLAW'
}

enum Resource {
  material = 'MATERIAL',
  fuel = 'FUEL',
  weapon = 'WEAPON',
  relic = 'RELIC',
  psionic = 'PSIONIC'
}

enum Golem {
  golemWarrior = 'GOLEM_W',
  golemProtector = 'GOLEM_P',
  golemSeeker = 'GOLEM_S',
  golemHarvester = 'GOLEM_H'
}

enum Color {
  red = 'RED',
  blue = 'BLUE',
  yellow = 'YELLOW',
  white = 'WHITE',
  empire = 'EMPIRE',
  free = 'FREE'
}

enum ShipType {
  ship = 'SHIP',
  flagship = 'FLAGSHIP'
}

enum BuildingType {
  city = 'CITY',
  starport = 'STARPORT'
}

enum TokenType {
  blight = 'BLIGHT',
  portal = 'PORTAL',
  banner = 'BANNER',
  brokenWorld = 'BROKEN_WORLD',
  golemHarvester = 'GOLEM_HARVESTER',
  golemProtector = 'GOLEM_PROTECTOR',
  golemSeeker = 'GOLEM_SEEKER',
  golemWarrior = 'GOLEM_WARRIOR',
  hammerFragment = 'HAMMER_FRAGMENT',
  seat1 = 'SEAT_1',
  seat2 = 'SEAT_2',
  seat3 = 'SEAT_3',
  seat4 = 'SEAT_4',
  seat5 = 'SEAT_5',
  seat6 = 'SEAT_6'
  // wisdomIdeal = 'WISDOM_IDEAL',
  // zealIdeal = 'ZEAL_IDEAL'
}

enum Fate {
  steward = 'F1',
  founder = 'F2',
  magnate = 'F3',
  advocate = 'F4',
  caretaker = 'F5',
  partisan = 'F6',
  admiral = 'F7',
  believer = 'F8',
  pathfinder = 'F9',
  hegemon = 'F10',
  planetBreaker = 'F11',
  pirate = 'F12',
  blightSpeaker = 'F13',
  pacifist = 'F14',
  peacekeeper = 'F15',
  warden = 'F16',
  overlord = 'F17',
  suvivalist = 'F18',
  redeemer = 'F19',
  guardian = 'F20',
  naturalist = 'F21',
  gateWraith = 'F22',
  conspirator = 'F23',
  judge = 'F24'
}
