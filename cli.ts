import { Command } from "commander";
import {
  EntryPoint_ETF,
  EntryPoint_Stock,
  EntryPoint_Kofia,
  EntryPoint_Fusion,
} from "./src/commands/index.ts";

const main = async () => {
  const program = new Command();
  program
    .addCommand(EntryPoint_ETF.program)
    .addCommand(EntryPoint_Stock.program)
    .addCommand(EntryPoint_Kofia.program)
    .addCommand(EntryPoint_Fusion.program)
    .allowUnknownOption(true);
  await program.parseAsync(process.argv);
};

main();
