import { Command } from "commander";
import { EntryPoint_ETF, EntryPoint_Stock } from "./src/commands/index.js";

const main = async () => {
  const program = new Command();
  program
    .addCommand(EntryPoint_ETF.program)
    .addCommand(EntryPoint_Stock.program)
    .allowUnknownOption(true);
  await program.parseAsync(process.argv);
};

main();
