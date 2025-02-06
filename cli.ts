import { Command } from "commander";
import { EntryPoint_ETF } from "./src/commands/index.js";

const main = async () => {
  const program = new Command();
  program.addCommand(EntryPoint_ETF.program).allowUnknownOption(true);
  await program.parseAsync(process.argv);
};

main();
