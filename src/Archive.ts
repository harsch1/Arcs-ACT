export { Archive, Player, Board, Resource, Golem, Color, BuildingType, Token, Fate };
export type { Card, Multi, MapPiece, Piece, Ship, Building, Holdable };

// Used to represent multiple of an item as a means of compression/easier loading
type Multi<T> = {
    item: T;
    type?: string;
    count?: number;
    
};

/**
 * Represents a card in the game.
 * @param id - The unique identifier of the card in the form "F1-10"
 */
type Card = {
    id: string;
    name?: string;
    holding?: Multi<Piece>[];
    isAddedLore?: boolean;
}

type Ship = {
    color: Color;
    type?: string;
}

type Building = {
    type: BuildingType;
    color: Color;
    hasSeatToken?: boolean;
    isCloudCity?: boolean;
}

type MapPiece = Ship | Building | Token;
type Holdable = Resource | Golem;
type Piece = MapPiece | Holdable;

class Player {
    name: string;
    color: Color;
    cards: Card[] = [];
    resources: Holdable[] = [];
    outrage: Resource[] = [];
    empireStatus = "Regent";
    currentFate: Fate;
    /**
     * @param fateHistory - Array of tuples of Fate and boolean if succeeded objective in chronological order prior to current game
     */
    fateHistory: [Fate, boolean][] = [];
    power: number = 0;
    //TODO flagShipData: {};

    constructor(name: string, color: Color, currentFate: Fate) {
        this.name = name;
        this.color = color;
        this.cards = [];
        this.currentFate = currentFate;
    }
}

function processPiece(piece: MapPiece): MapPiece {
    if ((piece as Ship).color && !(piece as Ship).type) {
        const newPiece = piece as Ship;
        newPiece.type = "SHIP";
        return newPiece;
    }
    return piece;
}

function processMultiPiece(piece: Multi<MapPiece>): Multi<MapPiece> {
    const newPiece = {item: processPiece(piece.item), count: piece.count} as Multi<MapPiece>;
    return newPiece;
}

/**
 * Represents a board with systems and pieces.
 */
class Board {
    Systems: Map<string, Multi<MapPiece>[]> = new Map(
        [
            ["1A", []],
            ["1C", []],
            ["1H", []],
            ["1G", []],
            ["2A", []],
            ["2C", []],
            ["2H", []],
            ["2G", []],
            ["3A", []],
            ["3C", []],
            ["3H", []],
            ["3G", []],
            ["4A", []],
            ["4C", []],
            ["4H", []],
            ["4G", []],
            ["5A", []],
            ["5C", []],
            ["5H", []],
            ["5G", []],
            ["6A", []],
            ["6C", []],
            ["6H", []],
            ["6G", []],
        ]
    );
    _systems = {};

    /**
     * Adds a piece to the specified system.
     * @param system The system to add the piece to.
     * @param piece The piece to add.
     */
    addPiece(system: string, piece: MapPiece) {
        if (this.Systems.has(system)) {
            this.Systems.get(system)?.push({ item: processPiece(piece), count: 1});
        }
        this.prepForSave();
    }
    
    /**
     * Adds multiple pieces to the specified system.
     * @param system The system to add the pieces to.
     * @param pieces An array of pieces to add.
     */
    addPieces(system: string, pieces:(MapPiece|Multi<MapPiece>)[]) {
        if (this.Systems.has(system)) {
            this.Systems.get(system)?.push(...pieces.map(p => {
                if ((p as Multi<MapPiece>).item) {
                    return processMultiPiece(p as Multi<MapPiece>);
                }

                return {item: processPiece(p as MapPiece), count: 1};
            }));
        }
        this.prepForSave();
    }
    
    /**
     * Updates the count of a piece in the specified system.
     * @param system The system to update the piece in.
     * @param piece The piece to update.
     * @param count The new count of the piece.
     */
    updateCount(system: string, piece: MapPiece, count: number) {
        if (this.Systems.has(system)) {
            const pieces = this.Systems.get(system);
            if (pieces) {
                const index = pieces.findIndex(p => p.item === piece);
                if (index >= 0) {
                    pieces[index].count = count;
                }
            }
        }
        this.prepForSave();
    }

    prepForSave() {
        this._systems = Object.fromEntries(this.Systems);
    }
}

class Archive {
    players: Player[] = [];
    board: Board = new Board();
    /**
     * @param scrap - Array of card objects scrapped from the game (implied cards from fate history are excluded)
     */
    scrap: Card[] = [];
    addedFaithfulActionCards?: Card[];
    idealMarkers?: string[];
    act: number = 1;
    firstRegent: string;
    /**
     * @param edicts - Array of edict cards (implied cards from fate history are excluded)
     */
    edicts: Card[] = [];
    
    constructor(players: Player[]) {
        this.players = players;
        this.firstRegent = players[0].name;
    }

    setFirstRegent(player: Player) {
        this.firstRegent = player.name;
    }
}

enum Resource {
    material = "MATERIAL",
    fuel = "FUEL",
    weapon = "WEAPON",
    relic = "RELIC",
    psionic = "PSIONIC",
}

enum Golem {
    golemWarrior = "GOLEM_W",
    golemProtector = "GOLEM_P",
    golemSeeker = "GOLEM_S",
    golemHarvester = "GOLEM_H",
}

enum Color {
    red = "RED",
    blue = "BLUE",
    yellow = "YELLOW",
    white = "WHITE",
    empire = "EMPIRE",
    free = "FREE",
}

enum BuildingType {
    city = "CITY",
    starport = "STARPORT",
};

enum Token {
    blight = "BLIGHT",
    portal = "PORTAL",
    banner = "BANNER",
    brokenWorld = "BROKEN_WORLD",
}

enum Fate {
    steward = "F1",
    founder = "F2",
    magnate = "F3",
    advocate = "F4",
    caretaker = "F5",
    partisan = "F6",
    admiral = "F7",
    believer = "F8",
    pathfinder = "F9",
    hegemon = "F10",
    planetBreaker = "F11",
    pirate = "F12",
    blightSpeaker = "F13", 
    pacifist = "F14",
    peacekeeper = "F15",
    warden = "F16",
    overlord = "F17",
    suvivalist = "F18",
    redeemer = "F19",
    guardian = "F20",
    naturalist = "F21",
    gateWraith = "F22",
    conspirator = "F23",
    judge = "F24"
}