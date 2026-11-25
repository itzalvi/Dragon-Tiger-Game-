import 'dotenv/config';
import express from 'express';
import type { Request, Response } from 'express';
import path from 'path';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';

interface ChatMessageInput {
  role: 'user' | 'model';
  text: string;
}

interface SupportContextInput {
  userName?: string;
  userId?: string;
  balance?: number;
  language?: 'en' | 'ur';
  currentView?: string;
  pendingDepositCount?: number;
  pendingWithdrawCount?: number;
  lastTransactionSummary?: string;
}

const PORT = Number(process.env.PORT || 3000);

function createGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

function buildSystemInstruction(ctx?: SupportContextInput): string {
  const userName = ctx?.userName || 'Player';
  const userId = ctx?.userId || 'N/A';
  const balance = typeof ctx?.balance === 'number' ? `Rs ${ctx.balance.toLocaleString()}` : 'Unknown';
  const pendingDeposits = typeof ctx?.pendingDepositCount === 'number' ? ctx.pendingDepositCount : 0;
  const pendingWithdraws = typeof ctx?.pendingWithdrawCount === 'number' ? ctx.pendingWithdrawCount : 0;
  const view = ctx?.currentView || 'Game';
  const lastTx = ctx?.lastTransactionSummary || 'No recent transactions';

  return `You are the official **Dragon Tiger Help Bot** (created by **Alvi Games**).
Your job is to warmly, concisely, and accurately solve any player problem inside the Dragon Tiger game.

LANGUAGE RULE:
- Default to clear, polite **English** (or match if the player writes in Roman Urdu/Urdu, while noting the game UI is in English).
- Keep replies practical, clear, step-by-step, and concise (2 to 6 short lines max, easy to read on a mobile landscape screen).

LIVE PLAYER CONTEXT:
- Player Name: ${userName}
- Player ID: ${userId}
- Wallet Balance: ${balance}
- Pending Deposits: ${pendingDeposits}
- Pending Withdrawals: ${pendingWithdraws}
- Current Screen: ${view}
- Latest Transaction: ${lastTx}

EXACT GAME KNOWLEDGE & TROUBLESHOOTING:
1. **How to Play & Payouts**:
   - Dragon vs Tiger draws 1 card each (Ace=1 lowest up to King=13 highest). Higher card wins.
   - **Dragon or Tiger bet**: 1:1 bet gives **1.9x total return** (e.g., Rs 10 bet returns Rs 19 = +Rs 9 profit).
   - **Tie bet**: Pays **8:1 profit (9x total return)** (e.g., Rs 10 bet returns Rs 90). On Tie, 50% of Dragon/Tiger bets are refunded automatically.
   - **Round Timer**: Runs continuously on a 26-second live schedule (15s Start Betting, 2s Stop Betting, 1s Dealing, 3s Showdown, 5s Result). Tap a chip (Rs 10 to Rs 10,000), then tap Dragon, Tiger, or Tie during the 15s Betting phase.

2. **Deposits (EasyPaisa, JazzCash, All Bank QR)**:
   - Tap **ALL BANK DEPOSIT** in the Lobby or **Wallet / Top Up (+)** on the table.
   - Scan the All Bank QR, send the payment (Min Rs 300), enter your SMS **TID** and amount, and click **Submit**.
   - **Important**: Deposits are NOT auto-paid — every deposit stays **Pending** until **approved by Admin**. Once Admin approves, the balance updates immediately!
   - Players can check **Pending** and **Approved** Deposit History directly inside the **Deposit** tab of the Wallet.

3. **Withdrawals (Cash Out)**:
   - Tap **WITHDRAW** in Lobby or **Wallet -> Withdraw** on the table (Min Rs 500).
   - Enter amount, choose EasyPaisa or JazzCash, enter Account Title & Account Number, and submit.
   - Withdrawals are held in escrow and **require Admin approval** before payout. Players can track **Pending** and **Approved** Withdraw History directly inside the **Withdraw** tab of the Wallet (if rejected, balance is refunded).

4. **Bonuses & Referrals**:
   - **Sign-Up Bonus**: New accounts automatically get **Rs 20 free** upon registration.
   - **Share & Earn 7%**: Tap **Share Game & Earn 7% Bonus** in the Lobby to copy or WhatsApp-share your invite link. You earn a **7% bonus** when friends register via your link and their deposit is approved.

5. **Install APK / Add to Home Screen**:
   - Tap the green **Install App / APK** button in the top-right bar of the Lobby.
   - On Android Chrome, tap the Chrome prompt **Install** (or Chrome 3-dot menu ⋮ -> **Install App** / **Add to Home screen**) to install with the Dragon Tiger icon.

6. **Settings & Sound**:
   - Tap the **Gear (⚙️) icon** in the top bar (Lobby or Table) to toggle sound effects & background music or sign out.
   - Mobile landscape mode is recommended for the best table view.

SECURITY & PRIVACY RULES:
- Never mention internal admin triggers, secret logo taps, prediction controls, or backend code details.
- Never ask for passwords, PINs, OTPs, or API keys.`;
}

async function generateSupportReply(
  messages: ChatMessageInput[],
  context?: SupportContextInput
): Promise<string> {
  const ai = createGeminiClient();
  if (!ai) {
    throw Object.assign(new Error('GEMINI_API_KEY is not configured on the server.'), {
      statusCode: 503,
    });
  }

  const contents = messages
    .filter((m) => m && typeof m.text === 'string' && m.text.trim().length > 0)
    .slice(-14)
    .map((m) => ({
      role: m.role === 'model' ? 'model' : 'user',
      parts: [{ text: m.text.trim() }],
    }));

  if (contents.length === 0) {
    throw Object.assign(new Error('Message cannot be empty.'), { statusCode: 400 });
  }

  let lastErr: unknown;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents,
        config: {
          systemInstruction: buildSystemInstruction(context),
          thinkingConfig: {
            thinkingLevel: ThinkingLevel.LOW,
          },
        },
      });

      const replyText = response.text?.trim();
      if (!replyText) {
        throw new Error('Empty response from assistant.');
      }
      return replyText;
    } catch (err) {
      lastErr = err;
      if (attempt === 0) {
        await new Promise((r) => setTimeout(r, 400));
      }
    }
  }

  throw lastErr;
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '1mb' }));

  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({ ok: true });
  });

  app.post('/api/support/chat', async (req: Request, res: Response) => {
    try {
      const body = req.body as {
        messages?: ChatMessageInput[];
        context?: SupportContextInput;
      };

      if (!Array.isArray(body?.messages) || body.messages.length === 0) {
        res.status(400).json({ error: 'Please enter a message.' });
        return;
      }

      const reply = await generateSupportReply(body.messages, body.context);
      res.json({ reply });
    } catch (error: unknown) {
      const errObj = error as { statusCode?: number; status?: number; message?: string };
      const status = errObj?.statusCode || errObj?.status || 500;
      const rawMessage = errObj?.message || 'Unable to reach support assistant right now.';

      let friendlyError = rawMessage;
      if (status === 403 || rawMessage.includes('PERMISSION_DENIED') || rawMessage.includes('API_KEY_INVALID')) {
        friendlyError = 'Support assistant key needs to be checked in Settings > Secrets.';
      } else if (status === 429 || rawMessage.includes('RESOURCE_EXHAUSTED')) {
        friendlyError = 'Support assistant is busy right now. Please try again in a few seconds.';
      }

      res.status(status >= 400 && status < 600 ? status : 500).json({
        error: friendlyError,
      });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== 'true',
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Dragon Tiger server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
