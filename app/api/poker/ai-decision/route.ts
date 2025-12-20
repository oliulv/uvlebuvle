import { NextResponse } from 'next/server';
import { Card, BettingAction, BetAction, AIDecision } from '@/lib/poker/types';
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

interface RequestBody {
  gameState: GameContext;
  playerId: string;
  playerName: string;
  model: string;
}

function buildPrompt(context: GameContext, playerName: string): string {
  const handStr = context.playerHand.map(cardToString).join(' ');
  const communityStr = context.communityCards.length > 0
    ? context.communityCards.map(cardToString).join(' ')
    : 'None yet';

  const recentActions = context.actionHistory
    .map(a => `${a.playerName}: ${a.action}${a.amount ? ` $${a.amount}` : ''}`)
    .join('\n') || 'None';

  const toCall = context.currentBet - context.playerCurrentBet;

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

RECENT ACTIONS:
${recentActions}

AVAILABLE ACTIONS: ${context.availableActions.join(', ')}

Respond with ONLY a JSON object in this exact format (no markdown, no explanation outside JSON):
{"action": "${context.availableActions[0]}", "amount": 0, "reasoning": "brief explanation"}

For raises, set amount to your total bet (not the raise increment).
For fold/check/call, amount should be 0.

Your decision:`;
}

function parseAIResponse(content: string, availableActions: BettingAction[]): AIDecision {
  try {
    // Try to extract JSON from the response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);

      // Validate action
      let action: BettingAction = parsed.action?.toLowerCase();
      if (!availableActions.includes(action)) {
        // Fallback to safe action
        action = availableActions.includes('check') ? 'check' :
                 availableActions.includes('call') ? 'call' : 'fold';
      }

      return {
        action,
        amount: typeof parsed.amount === 'number' ? parsed.amount : undefined,
        reasoning: parsed.reasoning || 'No reasoning provided',
      };
    }
  } catch (e) {
    console.error('Failed to parse AI response:', e);
  }

  // Fallback
  const fallbackAction = availableActions.includes('check') ? 'check' :
                         availableActions.includes('call') ? 'call' : 'fold';
  return {
    action: fallbackAction,
    reasoning: 'Fallback decision',
  };
}

export async function POST(request: Request) {
  try {
    const body: RequestBody = await request.json();
    const { gameState, playerName, model } = body;

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      console.error('OPENROUTER_API_KEY not configured');
      // Return fallback decision
      return NextResponse.json({
        action: gameState.availableActions.includes('check') ? 'check' : 'fold',
        reasoning: 'API not configured',
      });
    }

    const prompt = buildPrompt(gameState, playerName);

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
            content: 'You are an expert poker player AI. Respond only with valid JSON. Be strategic but occasionally make human-like plays.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_tokens: 150,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('OpenRouter API error:', error);
      return NextResponse.json({
        action: gameState.availableActions.includes('check') ? 'check' : 'fold',
        reasoning: 'API error - safe play',
      });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';

    const decision = parseAIResponse(content, gameState.availableActions);

    return NextResponse.json(decision);
  } catch (error) {
    console.error('AI decision error:', error);
    return NextResponse.json({
      action: 'fold',
      reasoning: 'Error occurred',
    });
  }
}
