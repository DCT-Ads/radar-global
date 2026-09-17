import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";

export async function confirmSignalDelete(detail: string) {
  if (process.env.CONFIRM_SIGNAL_DELETE === "YES") {
    console.log(`[confirm] CONFIRM_SIGNAL_DELETE=YES · ${detail}`);
    return;
  }

  if (!stdin.isTTY) {
    throw new Error(
      `deleteMany bloqueado sem TTY. ${detail} Confirme com CONFIRM_SIGNAL_DELETE=YES.`,
    );
  }

  const rl = createInterface({ input: stdin, output: stdout });
  try {
    const answer = (
      await rl.question(`${detail}\nDigite DELETE para confirmar: `)
    )
      .trim()
      .toUpperCase();
    if (answer !== "DELETE") {
      throw new Error("deleteMany abortado (confirmação recusada).");
    }
  } finally {
    rl.close();
  }
}
