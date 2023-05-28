import { useState } from "react";
import {
  Card,
  CardRank,
  CardDeck,
  CardSuit,
  GameState,
  Hand,
  GameResult,
} from "./types";

// UI Elements
const CardBackImage = () => (
  <img src={process.env.PUBLIC_URL + `/SVG-cards/png/1x/back.png`} />
);

const CardImage = ({ suit, rank }: Card) => {
  const card = rank === CardRank.Ace ? 1 : rank;
  return (
    <img
      src={
        process.env.PUBLIC_URL +
        `/SVG-cards/png/1x/${suit.slice(0, -1)}_${card}.png`
      }
    />
  );
};

// Setup
const newCardDeck = (): CardDeck =>
  Object.values(CardSuit)
    .map((suit) =>
      Object.values(CardRank).map((rank) => ({
        suit,
        rank,
      }))
    )
    .reduce((a, v) => [...a, ...v]);

const shuffle = (deck: CardDeck): CardDeck => {
  return deck.sort(() => Math.random() - 0.5);
};

const takeCard = (deck: CardDeck): { card: Card; remaining: CardDeck } => {
  const card = deck[deck.length - 1];
  const remaining = deck.slice(0, deck.length - 1);
  return { card, remaining };
};

const setupGame = (): GameState => {
  const cardDeck = shuffle(newCardDeck());
  return {
    playerHand: cardDeck.slice(cardDeck.length - 2, cardDeck.length),
    dealerHand: cardDeck.slice(cardDeck.length - 4, cardDeck.length - 2),
    cardDeck: cardDeck.slice(0, cardDeck.length - 4),
    turn: "player_turn",
  };
};

// Scoring
const calculateHandScore = (hand: Hand): number => {
  let score = 0;
  let aceCount = 0;

  for (const card of hand) {
    if (card.rank === CardRank.Ace) {
      score += 11;
      aceCount++;
    } else if (
      card.rank === CardRank.Jack ||
      card.rank === CardRank.Queen ||
      card.rank === CardRank.King
    ) {
      score += 10;
    } else {
      score += +card.rank;
    }
  }

  while (score > 21 && aceCount > 0) {
    score -= 10;
    aceCount--;
  }

  return score;
};

const determineGameResult = (state: GameState): GameResult => {
  const playerScore = calculateHandScore(state.playerHand);
  const dealerScore = calculateHandScore(state.dealerHand);

  if (playerScore > 21) {
    return "dealer_win";
  } else if (dealerScore > 21) {
    return "player_win";
  } else if (
    playerScore === 21 &&
    state.playerHand.length === 2 &&
    (dealerScore !== 21 ||
      (dealerScore === 21 && state.dealerHand.length !== 2))
  ) {
    return "player_win";
  } else if (
    dealerScore === 21 &&
    state.dealerHand.length === 2 &&
    (playerScore !== 21 ||
      (playerScore === 21 && state.playerHand.length !== 2))
  ) {
    return "dealer_win";
  } else if (playerScore === dealerScore) {
    return "draw";
  }  else if (playerScore > dealerScore) {
    return "player_win";
  } else {
    return "dealer_win";
  }
};

// Player Actions
const playerStands = (state: GameState): GameState => {
  let newState = { ...state };

  while (calculateHandScore(newState.dealerHand) <= 16) {
    const { card, remaining } = takeCard(newState.cardDeck);
    newState = {
      ...newState,
      cardDeck: remaining,
      dealerHand: [...newState.dealerHand, card],
    };
  }

  newState.turn = "dealer_turn";
  return newState;
};

const playerHits = (state: GameState): GameState => {
  const { card, remaining } = takeCard(state.cardDeck);
  return {
    ...state,
    cardDeck: remaining,
    playerHand: [...state.playerHand, card],
  };
};

// UI Component
const Game = (): JSX.Element => {
  const [state, setState] = useState(setupGame());

  const handleHit = (): void => {
    if (state.turn === "player_turn") {
      setState(playerHits);
    }
  };

  const handleStand = (): void => {
    if (state.turn === "player_turn") {
      setState(playerStands);
    }
  };

  const handleReset = (): void => {
    setState(setupGame());
  };

  return (
    <>
      <div>
        <p>There are {state.cardDeck.length} cards left in deck</p>
        <button disabled={state.turn === "dealer_turn"} onClick={handleHit}>
          Hit
        </button>
        <button disabled={state.turn === "dealer_turn"} onClick={handleStand}>
          Stand
        </button>
        <button onClick={handleReset}>Reset</button>
      </div>
      <p>Player Cards</p>
      <div>
        {state.playerHand.map(CardImage)}
        <p>Player Score: {calculateHandScore(state.playerHand)}</p>
      </div>
      <p>Dealer Cards</p>
      {state.turn === "player_turn" && state.dealerHand.length > 0 ? (
        <div>
          <CardBackImage />
          <CardImage {...state.dealerHand[1]} />
        </div>
      ) : (
        <div>
          {state.dealerHand.map(CardImage)}
          <p>Dealer Score: {calculateHandScore(state.dealerHand)}</p>
        </div>
      )}
      {state.turn === "dealer_turn" &&
      determineGameResult(state) !== "no_result" ? (
        <p>{determineGameResult(state)}</p>
      ) : (
        <p>{state.turn}</p>
      )}
    </>
  );
};

export {
  Game,
  playerHits,
  playerStands,
  determineGameResult,
  calculateHandScore,
  setupGame,
};
