import { Card, GameResult, Suit, Value } from "../../interfaces";

type Deck = Card[];

const SUITS: Suit[] = ['H', 'D', 'C', 'S'];
const VALUES: Value[] = ['6', '7', '8', '9', '10', '11', '12', '13'];

function generateDeck(): Deck {
    const deck: Deck = [];
    for (const suit of SUITS) {
        for (const value of VALUES) {
            deck.push({ value, suit });
        }
    }
    return deck;
};


function getPredfinedPoint(cat: string): number {
    if (cat == '1') return 8;
    else if (cat == '2') return 9;
    else if (cat == '3') return 10;
    else return 11;
}

function shuffleDeck(deck: Deck): Deck {
    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    return deck;
};

export function play32CardRound(): GameResult {
    let deck = shuffleDeck(generateDeck());

    let roundCards: { [key: string]: string[] } = { 8: [], 9: [], 10: [], 11: [] };
    let roundPoints: { [key: string]: number } = { 8: 0, 9: 0, 10: 0, 11: 0 };
    let roundWisePoints: { [key: string]: number[] } = { 8: [], 9: [], 10: [], 11: [] };
    let activeKeys: string[] = ['8', '9', '10', '11'];

    for (let key of activeKeys) {
        const cardIndex = Math.floor(Math.random() * deck.length);
        const card: Card | undefined = deck[cardIndex];
        deck.splice(cardIndex, 1);
        if (card) {
            roundCards[key].push(`${card?.suit}${card.value}`);
            const point = getPredfinedPoint(key) + Number(card.value);
            roundWisePoints[key].push(point);
            roundPoints[key] += point;
        }
    };

    while (true) {
        const maxPoint = Math.max(...Object.values(roundPoints));
        const tiedKeys = Object.keys(roundPoints).filter(key => roundPoints[key] === maxPoint);

        if (tiedKeys.length === 1) {
            break;
        }

        for (let key of tiedKeys) {
            const cardIndex = Math.floor(Math.random() * deck.length);
            const card = deck[cardIndex];
            deck.splice(cardIndex, 1);
            if (!card) continue;
            roundCards[key].push(`${card.suit}${card.value}`);
            const finalPoint = Number(card.value);
            roundPoints[key] += finalPoint;
            roundWisePoints[key].push(finalPoint);
        }
    }

    const finalMax = Math.max(...Object.values(roundPoints));
    const finalWinner = Object.keys(roundPoints).find(key => roundPoints[key] === finalMax);

    return {
        cards: roundCards,
        roundWisePoints,
        winner: Number(finalWinner)
    };
}
