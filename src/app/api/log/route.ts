let renderCounter = 0;

export async function POST(req: Request) {
  try {
    const text = await req.text();
    const data = JSON.parse(text);

    const ts = new Date(data.ts).toISOString();
    const msg = String(data.args?.[0] ?? "");

    if (msg.includes("[HMR] connected")) {
      renderCounter++;

      console.log(
        "\n\n" +
          "══════════════════════════════════════════════\n" +
          `   PAGE RENDER #${renderCounter}\n` +
          `   ${ts}\n` +
          "══════════════════════════════════════════════\n\n",
      );
    }

    const level = data.type.replace("console.", "").toUpperCase();

    console.log("\n\n    [CLIENT " + level + "]", ...data.args, "\n\n");

    return new Response(null, { status: 204 });
  } catch (err) {
    // absolutely never throw here or the logger loops
    console.log("\n[LOGGER ERROR]", err);
    return new Response(null, { status: 204 });
  }
}
