import { NextResponse } from 'next/server';
import { Card, BettingAction, BetAction, AIDecision, HandSummary, GamePhase } from '@/lib/poker/types';
import { cardToString } from '@/lib/poker/deck';

interface GameContext {
  phase: string;
  communityCards: Card[];
  pot: number;
  currentBet: number;
  playerHand: Card[];
  playerChips: number;
  playerCurrentBet: number;
  actionHistory: BetAction[];
  availableActions: BettingAction[];
}

interface PlayerStats {
  name: string;
  handsPlayed: number;
  handsWon: number;
  totalBet: number;
  allInCount: number;
  foldCount: number;
  bluffCaught: number;
}

interface GameHistoryContext {
  recentHands: HandSummary[];
  playerStats: PlayerStats[];
  currentHandActions: {
    playerName: string;
    action: BettingAction;
    amount?: number;
    phase: GamePhase;
  }[];
}

interface RequestBody {
  gameState: GameContext;
  gameHistory?: GameHistoryContext;
  playerId: string;
  playerName: string;
  model: string;
}

function buildPrompt(context: GameContext, playerName: string, gameHistory?: GameHistoryContext): string {
  const handStr = context.playerHand.map(cardToString).join(' ');
  const communityStr = context.communityCards.length > 0
    ? context.communityCards.map(cardToString).join(' ')
    : 'None yet';

  const recentActions = context.actionHistory
    .map(a => `${a.playerName}: ${a.action}${a.amount ? ` $${a.amount}` : ''}`)
    .join('\n') || 'None';

  const toCall = context.currentBet - context.playerCurrentBet;

  // Build game history section
  let historySection = '';
  if (gameHistory && (gameHistory.recentHands.length > 0 || gameHistory.playerStats.length > 0)) {
    historySection = '\n\n=== GAME HISTORY (Use this to identify patterns!) ===\n';

    // Player statistics
    if (gameHistory.playerStats.length > 0) {
      historySection += '\nPLAYER TENDENCIES:\n';
      for (const stats of gameHistory.playerStats) {
        const aggressionRatio = stats.handsPlayed > 0
          ? ((stats.allInCount / stats.handsPlayed) * 100).toFixed(0)
          : '0';
        const foldRatio = stats.handsPlayed > 0
          ? ((stats.foldCount / stats.handsPlayed) * 100).toFixed(0)
          : '0';
        historySection += `- ${stats.name}: ${stats.handsWon}W/${stats.handsPlayed}H, All-in ${aggressionRatio}%, Fold ${foldRatio}%\n`;

        // Add insights about player behavior
        if (stats.allInCount >= 2 && stats.handsPlayed <= 5) {
          historySection += `  ⚠️ ${stats.name} goes all-in frequently - might be bluffing!\n`;
        }
        if (stats.foldCount >= 3 && stats.handsPlayed <= 5) {
          historySection += `  ℹ️ ${stats.name} folds often - likely plays tight\n`;
        }
      }
    }

    // Recent hands summary
    if (gameHistory.recentHands.length > 0) {
      historySection += '\nRECENT HANDS:\n';
      for (const hand of gameHistory.recentHands.slice(-3)) {
        historySection += `Hand #${hand.handNumber}: ${hand.winner} won $${hand.potSize} with ${hand.winningHand}\n`;

        // Highlight notable plays
        const allIns = hand.actions.filter(a => a.action === 'all-in');
        if (allIns.length > 0) {
          historySection += `  All-ins: ${allIns.map(a => a.playerName).join(', ')}\n`;
        }
      }
    }

    // Current hand actions so far
    if (gameHistory.currentHandActions && gameHistory.currentHandActions.length > 0) {
      historySection += '\nTHIS HAND SO FAR:\n';
      for (const action of gameHistory.currentHandActions) {
        historySection += `- ${action.playerName}: ${action.action}${action.amount ? ` $${action.amount}` : ''} (${action.phase})\n`;
      }
    }

    historySection += '\n=== END GAME HISTORY ===\n';
  }

  return `You are ${playerName}, an AI playing Texas Hold'em poker. Make a strategic decision.

YOUR HAND: ${handStr}
COMMUNITY CARDS: ${communityStr}
PHASE: ${context.phase}

GAME STATE:
- Pot: $${context.pot}
- Current bet: $${context.currentBet}
- Amount to call: $${toCall}
- Your chips: $${context.playerChips}
- Your current bet this round: $${context.playerCurrentBet}

RECENT ACTIONS THIS ROUND:
${recentActions}
${historySection}
STRATEGIC NOTES:
- Use the game history to identify patterns. If someone frequently goes all-in, they might be bluffing.
- Don't be scared of all-ins if you have a strong hand or if the player has a history of bluffing.
- Consider pot odds when deciding to call.
- A player who has gone all-in multiple times in a few hands is likely playing aggressively/bluffing.

AVAILABLE ACTIONS: ${context.availableActions.join(', ')}

Respond with ONLY a JSON object in this exact format (no markdown, no explanation outside JSON):
{"action": "${context.availableActions[0]}", "amount": 0, "reasoning": "brief explanation of your decision, including any reads on opponents"}

For raises, set amount to your total bet (not the raise increment).
For fold/check/call, amount should be 0.

Your decision:`;
}

function parseAIResponse(content: string, availableActions: BettingAction[], playerName: string): AIDecision {
  try {
    // Remove markdown code blocks if present
    let cleanContent = content
      .replace(/```json\s*/gi, '')
      .replace(/```\s*/g, '')
      .trim();

    // Try to extract JSON from the response
    const jsonMatch = cleanContent.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);

      // Validate action
      let action: BettingAction = parsed.action?.toLowerCase();
      if (!availableActions.includes(action)) {
        console.warn(`[AI Decision] ${playerName} returned invalid action "${parsed.action}", using fallback`);
        // Fallback to safe action
        action = availableActions.includes('check') ? 'check' :
                 availableActions.includes('call') ? 'call' : 'fold';
      }

      return {
        action,
        amount: typeof parsed.amount === 'number' ? parsed.amount : undefined,
        reasoning: parsed.reasoning || 'No reasoning provided',
      };
    } else {
      console.warn(`[AI Decision] ${playerName} no JSON found in response:`, content.substring(0, 100));
    }
  } catch (e) {
    console.error(`[AI Decision] ${playerName} failed to parse response:`, e, 'Content:', content.substring(0, 200));
  }

  // Fallback
  const fallbackAction = availableActions.includes('check') ? 'check' :
                         availableActions.includes('call') ? 'call' : 'fold';
  return {
    action: fallbackAction,
    reasoning: 'Fallback decision - could not parse AI response',
  };
}

export async function POST(request: Request) {
  try {
    const body: RequestBody = await request.json();
    const { gameState, gameHistory, playerName, model } = body;

    console.log(`[AI Decision] ${playerName} using model: ${model}`);

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      console.error('OPENROUTER_API_KEY not configured');
      // Return fallback decision
      return NextResponse.json({
        action: gameState.availableActions.includes('check') ? 'check' : 'fold',
        reasoning: 'API not configured',
      });
    }

    const prompt = buildPrompt(gameState, playerName, gameHistory);

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://family-games.local',
        'X-Title': 'Family Games - AI Poker',
      },
      body: JSON.stringify({
        model: model,
        messages: [
          {
            role: 'system',
            content: `You are an expert poker player AI named ${playerName}. You have access to game history showing player tendencies. Use this information strategically:
- If a player frequently goes all-in, they may be bluffing - don't automatically fold
- Track patterns: aggressive players often bluff, tight players usually have strong hands
- Consider pot odds and implied odds
- Adapt your strategy based on opponent tendencies
Respond ONLY with a valid JSON object, no other text. Keep reasoning brief (1-2 sentences).`,
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        // GPT-5.2 uses reasoning tokens internally, so we need more tokens
        // to ensure the actual response isn't cut off
        max_tokens: 500,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error(`[AI Decision] ${playerName} API error:`, error);
      return NextResponse.json({
        action: gameState.availableActions.includes('check') ? 'check' : 'fold',
        reasoning: `API error - safe play (${response.status})`,
      });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';

    console.log(`[AI Decision] ${playerName} raw response:`, content.substring(0, 200));

    const decision = parseAIResponse(content, gameState.availableActions, playerName);

    console.log(`[AI Decision] ${playerName} decision:`, decision);

    return NextResponse.json(decision);
  } catch (error) {
    console.error('[AI Decision] Error:', error);
    return NextResponse.json({
      action: 'fold',
      reasoning: 'Error occurred',
    });
  }
}
