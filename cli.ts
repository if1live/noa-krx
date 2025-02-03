import { Command } from "commander";
import * as EntryPoint_ETF from "./main_etf.js";

const main = async () => {
  const program = new Command();
  program.addCommand(EntryPoint_ETF.program).allowUnknownOption(true);
  await program.parseAsync(process.argv);
};

main();
