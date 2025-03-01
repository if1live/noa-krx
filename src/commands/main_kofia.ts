import { Command } from "commander";
import { z } from "zod";

export const Input = z.object({
  dataDir: z.string(),
});
type Input = z.infer<typeof Input>;

export const program = new Command("kofia");
program
  .requiredOption("--data-dir <dataDir>", "data directory")
  .action(async (opts: unknown) => {
    const input = Input.parse(opts);
    await main(input);
  });

const main = async (input: Input) => {
  console.log("TODO");
};
